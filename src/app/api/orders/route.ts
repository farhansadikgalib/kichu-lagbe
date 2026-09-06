import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons, orderItems, orders, products, productVariants } from "@/lib/db/schema";
import { getDeliveryCharge } from "@/lib/db/queries/settings";
import { requireUser } from "@/lib/auth/guards";
import { couponDiscount } from "@/lib/pricing";
import { checkoutSchema } from "@/lib/validation/order";
import { ApiError, handleApiError, ok } from "@/lib/api/response";
import { notify } from "@/lib/notify";
import { formatOrderNumber } from "@/lib/format";

/** Customer's own orders, newest first. */
export async function GET() {
  try {
    const session = await requireUser();
    const rows = await db.query.orders.findMany({
      where: eq(orders.userId, session.sub),
      orderBy: [desc(orders.createdAt)],
      with: { items: true },
    });
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

const UNAVAILABLE = "One of the items in your cart is no longer available.";

/** Place an order. Prices are always recomputed server-side. */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const input = checkoutSchema.parse(await request.json());

    // One flat charge across the coverage area, read at order time so an
    // admin change applies to the next order without a deploy.
    const deliveryCharge = await getDeliveryCharge();

    const productIds = input.items.map((i) => i.productId);
    const variantIds = input.items.flatMap((i) => (i.variantId ? [i.variantId] : []));
    const [dbProducts, dbVariants] = await Promise.all([
      db.query.products.findMany({ where: inArray(products.id, productIds) }),
      variantIds.length
        ? db.query.productVariants.findMany({
            where: and(
              inArray(productVariants.id, variantIds),
              inArray(productVariants.productId, productIds),
            ),
          })
        : Promise.resolve([]),
    ]);
    const productById = new Map(dbProducts.map((p) => [p.id, p]));
    const variantById = new Map(dbVariants.map((v) => [v.id, v]));

    let subtotal = 0;
    const itemRows = input.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product || !product.isAvailable) throw new ApiError(UNAVAILABLE, 422);

      // An option must belong to this product and still be on sale; the
      // price is the option's, never the base price the client may have sent.
      const variant = item.variantId ? variantById.get(item.variantId) : null;
      if (item.variantId && (!variant || variant.productId !== product.id || !variant.isAvailable)) {
        throw new ApiError(UNAVAILABLE, 422);
      }

      const unitPrice = variant ? variant.price : product.price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      return {
        productId: product.id,
        variantId: variant?.id ?? null,
        productName: product.name,
        variantName: variant?.name ?? null,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      };
    });

    let discount = 0;
    let couponCode: string | null = null;
    if (input.couponCode) {
      // Never silently drop a coupon the customer saw applied — the total
      // they confirmed would no longer match what we charge.
      const coupon = await db.query.coupons.findFirst({
        where: eq(coupons.code, input.couponCode.toUpperCase()),
      });
      discount = coupon ? couponDiscount(coupon, subtotal) : 0;
      if (discount === 0) {
        throw new ApiError(
          "Your coupon is no longer valid for this order. Remove it and try again.",
          422,
        );
      }
      couponCode = coupon!.code;
    }

    const total = subtotal + deliveryCharge - discount;

    const order = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(orders)
        .values({
          userId: session.sub,
          customerName: input.customerName,
          phone: input.phone,
          addressDetails: input.addressDetails,
          note: input.note || null,
          subtotal,
          deliveryCharge,
          discount,
          total,
          couponCode,
        })
        .returning();

      await tx
        .insert(orderItems)
        .values(itemRows.map((row) => ({ ...row, orderId: created.id })));

      return created;
    });

    await notify(
      session.sub,
      "Order placed",
      `Your order ${formatOrderNumber(order.orderNumber)} has been received.`,
      `/orders/${order.id}`,
    );

    return ok(order, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

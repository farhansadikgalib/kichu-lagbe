import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons, orderItems, orders, products } from "@/lib/db/schema";
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

/** Place an order. Prices are always recomputed server-side. */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const input = checkoutSchema.parse(await request.json());

    // One flat charge across the coverage area, read at order time so an
    // admin change applies to the next order without a deploy.
    const deliveryCharge = await getDeliveryCharge();

    const productIds = input.items.map((i) => i.productId);
    const dbProducts = await db.query.products.findMany({
      where: inArray(products.id, productIds),
    });
    const productById = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    const itemRows = input.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product || !product.isAvailable) {
        throw new ApiError("One of the items in your cart is no longer available.", 422);
      }
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      return {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
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

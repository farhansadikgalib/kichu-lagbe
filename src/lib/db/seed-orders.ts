/**
 * Demo orders for the admin console: every status, riders on the active and
 * delivered ones, customer notes, a coupon, and placement times spread over
 * the last ten nights so date filters and reports have something to show.
 * Idempotent — skipped entirely once any of these recipients has an order.
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { orderItems, orders, products, users } from "./schema";
import { couponDiscount } from "@/lib/pricing";
import type { OrderStatus } from "@/types";

interface DemoOrder {
  /** Nights ago (0 = tonight) and the local hour the order was placed. */
  daysAgo: number;
  hour: number;
  status: OrderStatus;
  withRider: boolean;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  couponCode?: string;
  items: Array<{ slug: string; quantity: number }>;
}

const DEMO_ORDERS: DemoOrder[] = [
  // Tonight — what the admin sees first
  { daysAgo: 0, hour: 23, status: "pending", withRider: false, customerName: "Rafi Ahmed", phone: "01711223344", address: "House 12, Road 7, Block C, Badda", note: "Call when you reach the gate", items: [{ slug: "morug-pulao", quantity: 2 }, { slug: "coca-cola-1-liter", quantity: 1 }] },
  { daysAgo: 0, hour: 22, status: "pending", withRider: false, customerName: "Nusrat Jahan", phone: "01822334455", address: "Flat 4B, Ali Tower, Middle Badda", items: [{ slug: "benson-hedges-10-pc", quantity: 1 }, { slug: "lays-chips-16gm", quantity: 3 }] },
  { daysAgo: 0, hour: 21, status: "confirmed", withRider: false, customerName: "Tanvir Hasan", phone: "01933445566", address: "House 5, Road 2, South Badda", note: "No bell — knock please", items: [{ slug: "chicken-chap-2-pc-puruta", quantity: 1 }, { slug: "mojo-500ml", quantity: 2 }] },
  { daysAgo: 0, hour: 21, status: "confirmed", withRider: true, customerName: "Sadia Islam", phone: "01644556677", address: "Flat 7A, Green Villa, Uttar Badda", items: [{ slug: "deshi-murgi-khichuri", quantity: 1 }] },
  { daysAgo: 0, hour: 20, status: "picked_up", withRider: true, customerName: "Imran Kabir", phone: "01755667788", address: "House 22, Road 10, Merul Badda", note: "Leave with the guard if I don't answer", items: [{ slug: "malrboro-gold-10-pc", quantity: 1 }, { slug: "potato-crackers", quantity: 2 }, { slug: "coca-cola-600-ml", quantity: 1 }] },
  { daysAgo: 0, hour: 20, status: "picked_up", withRider: true, customerName: "Farzana Akter", phone: "01866778899", address: "Flat 2C, Lake View, Badda Link Road", items: [{ slug: "poruta", quantity: 4 }, { slug: "chicken-grill-2-pc-puruta", quantity: 1 }] },
  // Last night
  { daysAgo: 1, hour: 23, status: "delivered", withRider: true, customerName: "Rafi Ahmed", phone: "01711223344", address: "House 12, Road 7, Block C, Badda", couponCode: "WELCOME10", items: [{ slug: "boyler-chicken-khichuri", quantity: 2 }, { slug: "mojo-1-liter", quantity: 1 }] },
  { daysAgo: 1, hour: 22, status: "delivered", withRider: true, customerName: "Mehedi Hasan", phone: "01977889900", address: "House 3, Road 4, DIT Project, Badda", items: [{ slug: "gold-leaf-switch-10-pc", quantity: 1 }] },
  { daysAgo: 1, hour: 1, status: "cancelled", withRider: false, customerName: "Nusrat Jahan", phone: "01822334455", address: "Flat 4B, Ali Tower, Middle Badda", note: "Customer stopped answering", items: [{ slug: "lucky-strike-red-10-pc", quantity: 2 }] },
  // Earlier this week
  { daysAgo: 2, hour: 22, status: "delivered", withRider: true, customerName: "Tanvir Hasan", phone: "01933445566", address: "House 5, Road 2, South Badda", items: [{ slug: "morug-pulao", quantity: 1 }, { slug: "poppers-chips", quantity: 2 }] },
  { daysAgo: 3, hour: 0, status: "delivered", withRider: true, customerName: "Sadia Islam", phone: "01644556677", address: "Flat 7A, Green Villa, Uttar Badda", items: [{ slug: "camel-blue-blust-10pc", quantity: 1 }, { slug: "coca-cola-1-liter", quantity: 2 }] },
  { daysAgo: 4, hour: 21, status: "delivered", withRider: true, customerName: "Imran Kabir", phone: "01755667788", address: "House 22, Road 10, Merul Badda", couponCode: "WELCOME10", items: [{ slug: "benson-hedges-switch-full-pack", quantity: 1 }] },
  { daysAgo: 5, hour: 23, status: "cancelled", withRider: true, customerName: "Farzana Akter", phone: "01866778899", address: "Flat 2C, Lake View, Badda Link Road", note: "Wrong address given", items: [{ slug: "chicken-chap-2-pc-puruta", quantity: 2 }] },
  { daysAgo: 6, hour: 22, status: "delivered", withRider: true, customerName: "Mehedi Hasan", phone: "01977889900", address: "House 3, Road 4, DIT Project, Badda", items: [{ slug: "deshi-murgi-khichuri", quantity: 2 }, { slug: "mojo-1-liter", quantity: 2 }] },
  { daysAgo: 8, hour: 21, status: "delivered", withRider: true, customerName: "Rafi Ahmed", phone: "01711223344", address: "House 12, Road 7, Block C, Badda", items: [{ slug: "lucky-strike-white-10-pc", quantity: 1 }, { slug: "lays-chips-16gm", quantity: 2 }] },
  { daysAgo: 9, hour: 2, status: "delivered", withRider: true, customerName: "Nusrat Jahan", phone: "01822334455", address: "Flat 4B, Ali Tower, Middle Badda", items: [{ slug: "poruta", quantity: 6 }, { slug: "chicken-grill-2-pc-puruta", quantity: 2 }] },
];

const DEMO_CUSTOMER_EMAIL = "customer@kichulagbe.com";
const DEMO_RIDER_EMAIL = "rider@kichulagbe.com";
const DELIVERY_MINUTES = 35;

/** A Dhaka (+06:00) wall-clock moment `daysAgo` nights back; hours < 6 belong to the following morning. */
function placedAt(daysAgo: number, hour: number) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const [y, m, d] = today.split("-").map(Number);
  const dayOffset = hour < 6 ? 1 - daysAgo : -daysAgo;
  const date = new Date(Date.UTC(y, m - 1, d + dayOffset)).toISOString().slice(0, 10);
  return new Date(`${date}T${String(hour).padStart(2, "0")}:15:00+06:00`);
}

/** Tonight's slots that haven't happened yet are pulled back to a few minutes ago. */
function clampToPast(at: Date, index: number, now = new Date()) {
  return at > now ? new Date(now.getTime() - (index + 1) * 7 * 60_000) : at;
}

export async function seedDemoOrders(deliveryCharge: number) {
  const names = [...new Set(DEMO_ORDERS.map((o) => o.customerName))];
  const existing = await db.query.orders.findMany({
    where: inArray(orders.customerName, names),
    columns: { id: true },
  });
  if (existing.length > 0) {
    console.log(`demo orders: already present (${existing.length})`);
    return;
  }

  const [customer, rider] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.email, DEMO_CUSTOMER_EMAIL), columns: { id: true } }),
    db.query.users.findFirst({ where: eq(users.email, DEMO_RIDER_EMAIL), columns: { id: true } }),
  ]);
  if (!customer || !rider) throw new Error("Demo users must be seeded before demo orders");

  const slugs = [...new Set(DEMO_ORDERS.flatMap((o) => o.items.map((i) => i.slug)))];
  const productRows = await db.query.products.findMany({ where: inArray(products.slug, slugs) });
  const productBySlug = new Map(productRows.map((p) => [p.slug, p]));
  const couponRows = await db.query.coupons.findMany();
  const couponByCode = new Map(couponRows.map((c) => [c.code, c]));

  let created = 0;
  await db.transaction(async (tx) => {
    for (const [index, demo] of DEMO_ORDERS.entries()) {
      const createdAt = clampToPast(placedAt(demo.daysAgo, demo.hour), index);
      const lines = demo.items.map(({ slug, quantity }) => {
        const product = productBySlug.get(slug);
        if (!product) throw new Error(`Demo order references unknown product: ${slug}`);
        return {
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity,
          lineTotal: product.price * quantity,
        };
      });
      const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
      const coupon = demo.couponCode ? couponByCode.get(demo.couponCode) : undefined;
      const discount = coupon ? couponDiscount(coupon, subtotal) : 0;

      const [order] = await tx
        .insert(orders)
        .values({
          userId: customer.id,
          riderId: demo.withRider ? rider.id : null,
          status: demo.status,
          customerName: demo.customerName,
          phone: demo.phone,
          addressDetails: demo.address,
          note: demo.note ?? null,
          subtotal,
          deliveryCharge,
          discount,
          total: subtotal + deliveryCharge - discount,
          couponCode: discount > 0 ? coupon!.code : null,
          createdAt,
          deliveredAt:
            demo.status === "delivered"
              ? new Date(createdAt.getTime() + DELIVERY_MINUTES * 60_000)
              : null,
        })
        .returning({ id: orders.id });
      await tx.insert(orderItems).values(lines.map((line) => ({ ...line, orderId: order.id })));
      created += 1;
    }
  });
  console.log(`demo orders: ${created} inserted`);
}

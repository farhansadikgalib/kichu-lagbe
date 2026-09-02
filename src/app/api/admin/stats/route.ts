import { count, eq, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, products, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    await requireUser("admin");

    const [
      [totalOrders],
      [pendingOrders],
      [deliveredAgg],
      [totalCustomers],
      [totalProducts],
    ] = await Promise.all([
      db.select({ value: count() }).from(orders),
      db.select({ value: count() }).from(orders).where(eq(orders.status, "pending")),
      db
        .select({ value: count(), revenue: sum(orders.total) })
        .from(orders)
        .where(eq(orders.status, "delivered")),
      db.select({ value: count() }).from(users).where(eq(users.role, "customer")),
      db.select({ value: count() }).from(products),
    ]);

    return ok({
      totalOrders: totalOrders.value,
      pendingOrders: pendingOrders.value,
      deliveredOrders: deliveredAgg.value,
      totalRevenue: Number(deliveredAgg.revenue ?? 0),
      totalCustomers: totalCustomers.value,
      totalProducts: totalProducts.value,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

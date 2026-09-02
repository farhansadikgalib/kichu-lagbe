import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";

/**
 * Rider work queue: unassigned confirmed orders (available to accept)
 * plus the rider's own active/recent orders.
 */
export async function GET() {
  try {
    const session = await requireUser("rider", "admin");
    const rows = await db.query.orders.findMany({
      where: or(
        and(eq(orders.status, "confirmed"), isNull(orders.riderId)),
        eq(orders.riderId, session.sub),
      ),
      orderBy: [desc(orders.createdAt)],
      limit: 100,
      with: { items: true },
    });
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

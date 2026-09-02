import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";
import type { OrderStatus } from "@/types";

const STATUSES = ["pending", "confirmed", "picked_up", "delivered", "cancelled"];

export async function GET(request: Request) {
  try {
    await requireUser("admin");
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const rows = await db.query.orders.findMany({
      where:
        status && STATUSES.includes(status)
          ? eq(orders.status, status as OrderStatus)
          : undefined,
      orderBy: [desc(orders.createdAt)],
      limit: 200,
      with: {
        items: true,
        user: { columns: { id: true, name: true, email: true, phone: true } },
        rider: { columns: { id: true, name: true, phone: true } },
      },
    });
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

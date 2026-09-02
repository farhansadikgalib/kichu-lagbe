import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: true,
        rider: { columns: { id: true, name: true, phone: true } },
      },
    });
    if (!order) throw new ApiError("Order not found.", 404);

    const isOwner = order.userId === session.sub;
    const isStaff = session.role === "admin" || order.riderId === session.sub;
    if (!isOwner && !isStaff) throw new ApiError("Order not found.", 404);

    return ok(order);
  } catch (err) {
    return handleApiError(err);
  }
}

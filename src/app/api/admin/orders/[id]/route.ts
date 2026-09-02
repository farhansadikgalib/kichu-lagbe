import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { ApiError, handleApiError, ok } from "@/lib/api/response";
import { notify } from "@/lib/notify";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatOrderNumber } from "@/lib/format";

const updateSchema = z.object({
  status: z.enum(["pending", "confirmed", "picked_up", "delivered", "cancelled"]).optional(),
  riderId: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser("admin");
    const { id } = await params;
    const input = updateSchema.parse(await request.json());

    if (input.riderId) {
      const rider = await db.query.users.findFirst({
        where: eq(users.id, input.riderId),
        columns: { id: true, role: true },
      });
      if (!rider || rider.role !== "rider") throw new ApiError("Invalid rider.", 422);
    }

    const [updated] = await db
      .update(orders)
      .set({
        ...(input.status !== undefined && { status: input.status }),
        ...(input.riderId !== undefined && { riderId: input.riderId }),
        // Reverting a delivered order must also clear its delivery timestamp.
        ...(input.status !== undefined && {
          deliveredAt: input.status === "delivered" ? new Date() : null,
        }),
      })
      .where(eq(orders.id, id))
      .returning();
    if (!updated) throw new ApiError("Order not found.", 404);

    if (input.status) {
      await notify(
        updated.userId,
        `Order ${ORDER_STATUS_LABELS[input.status].toLowerCase()}`,
        `Your order ${formatOrderNumber(updated.orderNumber)} is now ${ORDER_STATUS_LABELS[input.status].toLowerCase()}.`,
        `/orders/${updated.id}`,
      );
    }
    if (input.riderId) {
      await notify(
        input.riderId,
        "New delivery assigned",
        `You have been assigned order ${formatOrderNumber(updated.orderNumber)}.`,
        "/rider",
      );
    }

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

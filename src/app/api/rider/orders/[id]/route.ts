import { after } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { ApiError, handleApiError, ok } from "@/lib/api/response";
import { notify } from "@/lib/notify";
import { createOrderEvent, publishOrderEvent } from "@/lib/events/order-events";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatOrderNumber } from "@/lib/format";

const actionSchema = z.object({
  action: z.enum(["accept", "picked_up", "delivered"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUser("rider", "admin");
    const { id } = await params;
    const { action } = actionSchema.parse(await request.json());

    if (action === "accept") {
      // Atomic claim — only succeeds while the order is still unassigned.
      const [claimed] = await db
        .update(orders)
        .set({ riderId: session.sub })
        .where(and(eq(orders.id, id), eq(orders.status, "confirmed"), isNull(orders.riderId)))
        .returning();
      if (!claimed) throw new ApiError("This order was already taken.", 409);

      await notify(
        claimed.userId,
        "Rider on the way",
        `A rider has accepted your order ${formatOrderNumber(claimed.orderNumber)}.`,
        `/orders/${claimed.id}`,
      );
      after(() =>
        publishOrderEvent(
          createOrderEvent("order.updated", session.sub, claimed, { riderName: session.name }),
        ),
      );
      return ok(claimed);
    }

    const nextStatus = action === "picked_up" ? "picked_up" : "delivered";
    const validFrom = action === "picked_up" ? "confirmed" : "picked_up";

    const [updated] = await db
      .update(orders)
      .set({
        status: nextStatus,
        ...(nextStatus === "delivered" && { deliveredAt: new Date() }),
      })
      .where(
        and(eq(orders.id, id), eq(orders.riderId, session.sub), eq(orders.status, validFrom)),
      )
      .returning();
    if (!updated) throw new ApiError("Order not found or not in a valid state.", 409);

    await notify(
      updated.userId,
      `Order ${ORDER_STATUS_LABELS[nextStatus].toLowerCase()}`,
      `Your order ${formatOrderNumber(updated.orderNumber)} is now ${ORDER_STATUS_LABELS[nextStatus].toLowerCase()}.`,
      `/orders/${updated.id}`,
    );
    after(() =>
      publishOrderEvent(
        createOrderEvent("order.updated", session.sub, updated, { riderName: session.name }),
      ),
    );

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

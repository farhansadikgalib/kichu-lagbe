import { requireUser } from "@/lib/auth/guards";
import { handleApiError } from "@/lib/api/response";
import { orderEventStream } from "@/lib/events/sse";

/**
 * Server-sent events for a signed-in customer: `order.updated` whenever an
 * admin or rider moves one of *their* orders along. Same bus and payload as
 * the admin stream and the outbound webhook, filtered to the caller's orders.
 * No replay — the client revalidates its order queries on every (re)connect.
 */
export async function GET(request: Request) {
  let userId: string;
  try {
    userId = (await requireUser()).sub;
  } catch (err) {
    return handleApiError(err);
  }

  return orderEventStream(request, {
    filter: (event) => event.type === "order.updated" && event.order.userId === userId,
  });
}

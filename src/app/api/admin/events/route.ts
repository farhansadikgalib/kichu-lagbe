import { requireUser } from "@/lib/auth/guards";
import { handleApiError } from "@/lib/api/response";
import { replayOrdersSince } from "@/lib/events/order-events";
import { lastEventTime, orderEventStream } from "@/lib/events/sse";

/**
 * Server-sent events for the admin console: every `order.created` /
 * `order.updated` message, plus a replay of orders placed since the client's
 * last event id when it reconnects.
 */
export async function GET(request: Request) {
  try {
    await requireUser("admin");
  } catch (err) {
    return handleApiError(err);
  }

  const since = lastEventTime(request);
  return orderEventStream(request, {
    filter: () => true,
    replay: since ? () => replayOrdersSince(since) : undefined,
  });
}

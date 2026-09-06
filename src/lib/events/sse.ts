import "server-only";
import { subscribeOrderEvents } from "@/lib/events/order-events";
import type { OrderEvent } from "@/types";

const HEARTBEAT_MS = 25_000;
const DEDUP_WINDOW = 200;

interface StreamOptions {
  /** Which bus events this subscriber may see; everything else is dropped. */
  filter: (event: OrderEvent) => boolean;
  /** Events to send first — what the client missed while disconnected. */
  replay?: () => Promise<OrderEvent[]>;
}

/**
 * Server-sent events over the order bus: one message per change that passes
 * `filter`, a heartbeat comment so proxies keep the socket open, and an
 * optional replay when the client reconnects. Events are de-duplicated by id
 * because the bus can deliver the same one from memory and from Postgres.
 */
export function orderEventStream(request: Request, { filter, replay }: StreamOptions) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const seen: string[] = [];
      let closed = false;

      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      const send = (event: OrderEvent) => {
        if (!filter(event) || seen.includes(event.id)) return;
        seen.push(event.id);
        if (seen.length > DEDUP_WINDOW) seen.shift();
        write(`id: ${event.at}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      };

      const unsubscribe = subscribeOrderEvents(send);
      const heartbeat = setInterval(() => write(": ping\n\n"), HEARTBEAT_MS);
      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed by the client */
        }
      };
      request.signal.addEventListener("abort", cleanup);

      write("retry: 3000\nevent: ready\ndata: {}\n\n");
      if (replay) {
        try {
          for (const event of await replay()) send(event);
        } catch (err) {
          console.error("[events] replay failed", err);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/** The client's last event id (an ISO timestamp), or null when this is a fresh connection. */
export function lastEventTime(request: Request): Date | null {
  const value =
    request.headers.get("last-event-id") ?? new URL(request.url).searchParams.get("since");
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

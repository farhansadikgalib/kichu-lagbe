import "server-only";
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { asc, gt, sql } from "drizzle-orm";
import type { PoolClient } from "pg";
import { db, pool } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { dispatchOrderWebhook } from "@/lib/webhooks";
import type { Order, OrderEvent, OrderEventType } from "@/types";

/**
 * Order event bus. Publishing emits in-process for instant delivery on this
 * server and sends a Postgres NOTIFY so every other instance hears it too.
 * Subscribers (the admin SSE stream) may therefore see an event twice and
 * de-duplicate by id.
 */

const CHANNEL = "order_events";
const REPLAY_LIMIT = 20;

declare global {
  var __dhOrderBus: EventEmitter | undefined;
  var __dhOrderListener: Promise<PoolClient> | null | undefined;
}

/** Singleton bus — survives HMR in development. */
const bus = globalThis.__dhOrderBus ?? new EventEmitter();
bus.setMaxListeners(0);
if (process.env.NODE_ENV !== "production") globalThis.__dhOrderBus = bus;

type EventOrder = Pick<
  Order,
  "id" | "orderNumber" | "userId" | "status" | "customerName" | "total" | "note"
>;

export function createOrderEvent(
  type: OrderEventType,
  actorId: string | null,
  order: EventOrder,
  extra: { itemCount?: number; riderName?: string | null } = {},
): OrderEvent {
  return {
    id: randomUUID(),
    type,
    at: new Date().toISOString(),
    actorId,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      customerName: order.customerName,
      total: order.total,
      note: order.note,
      ...extra,
    },
  };
}

/** Deliver an event to every admin console and the outbound webhook. */
export async function publishOrderEvent(event: OrderEvent) {
  bus.emit("event", event);
  try {
    await db.execute(sql`select pg_notify(${CHANNEL}, ${JSON.stringify(event)})`);
  } catch (err) {
    console.error("[order-events] pg_notify failed", err);
  }
  void dispatchOrderWebhook(event);
}

/**
 * Listen for events from this and every other instance. Returns an
 * unsubscribe. The LISTEN connection exists only while someone is
 * subscribed: when the last SSE stream closes it is released, so an idle
 * instance holds none of the database's connection budget.
 */
export function subscribeOrderEvents(listener: (event: OrderEvent) => void) {
  bus.on("event", listener);
  void ensureListener();
  return () => {
    bus.off("event", listener);
    if (bus.listenerCount("event") === 0) void releaseListener();
  };
}

/**
 * Orders placed after `since`, as created events — sent when a console
 * reconnects so nothing placed during the gap is missed.
 */
export async function replayOrdersSince(since: Date): Promise<OrderEvent[]> {
  const rows = await db.query.orders.findMany({
    where: gt(orders.createdAt, since),
    orderBy: [asc(orders.createdAt)],
    limit: REPLAY_LIMIT,
    with: { items: { columns: { quantity: true } } },
  });
  return rows.map((row) => ({
    ...createOrderEvent("order.created", row.userId, row, {
      itemCount: row.items.reduce((n, item) => n + item.quantity, 0),
    }),
    at: row.createdAt.toISOString(),
  }));
}

/** One dedicated connection per server holds LISTEN; re-opened after an error. */
function ensureListener() {
  if (globalThis.__dhOrderListener) return globalThis.__dhOrderListener;

  const listener = (async () => {
    const client = await pool.connect();
    client.on("notification", (message) => {
      if (message.channel !== CHANNEL || !message.payload) return;
      try {
        bus.emit("event", JSON.parse(message.payload) as OrderEvent);
      } catch (err) {
        console.error("[order-events] bad payload", err);
      }
    });
    client.on("error", (err) => {
      console.error("[order-events] listener dropped", err);
      globalThis.__dhOrderListener = null;
      client.release(err);
    });
    // Pooled connections are reaped server-side after a minute idle (see
    // lib/db); a LISTEN session is idle by nature, so exempt this one.
    await client.query("set idle_session_timeout = 0");
    await client.query(`listen ${CHANNEL}`);
    return client;
  })();

  globalThis.__dhOrderListener = listener;
  listener.catch((err) => {
    console.error("[order-events] listen failed", err);
    globalThis.__dhOrderListener = null;
  });
  return listener;
}

/** Give the LISTEN connection back once nobody is subscribed. */
async function releaseListener() {
  const pending = globalThis.__dhOrderListener;
  if (!pending) return;
  globalThis.__dhOrderListener = null;
  try {
    const client = await pending;
    // A subscriber may have arrived while we awaited; they've re-ensured a
    // listener of their own by now, so this one can still go.
    await client.query(`unlisten ${CHANNEL}`).catch(() => undefined);
    client.release();
  } catch {
    /* connect failed — nothing to release */
  }
}

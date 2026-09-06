import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  var __dhPool: Pool | undefined;
}

/**
 * Server-side idle cutoff for pooled connections (Postgres interval syntax).
 * Aiven's 20-connection plan loses ~11 slots to managed background workers
 * (TimescaleDB, pg_cron, failover, WAL senders), leaving the app only ~8.
 * Across Vercel serverless instances that budget is tiny, so idle connections
 * must return to it fast — the next query just reconnects.
 */
export const IDLE_SESSION_TIMEOUT = "20s";

function createPool() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }
  // Strip sslmode from the URL — newer `pg` treats `sslmode=require` as
  // verify-full, which fails on Aiven's self-signed CA. TLS is configured
  // explicitly below instead.
  const url = new URL(raw);
  const sslmode = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  const pool = new Pool({
    connectionString: url.toString(),
    // The app shares only ~8 real slots (see IDLE_SESSION_TIMEOUT) across every
    // warm serverless instance, the SSE LISTEN client, and drizzle-kit. Keep the
    // per-instance pool tiny — one open SSE stream already parks a connection on
    // LISTEN, so 2 leaves headroom for a query alongside it; concurrency comes
    // from instances, not from a big pool.
    max: Number(process.env.DB_POOL_MAX) || 2,
    // Fail fast instead of queueing forever when the pool is saturated or the
    // database is unreachable — users get an error state, not a hanging page.
    connectionTimeoutMillis: 10_000,
    // Release idle connections back to the shared budget within seconds.
    idleTimeoutMillis: 5_000,
    // TCP keep-alive stops intermediaries from dropping the remote Aiven link
    // between bursts, which would cost a reconnect handshake per query.
    keepAlive: true,
    // Local Postgres usually has TLS off; hosted ones (Aiven) require it with
    // a self-signed CA. `sslmode=disable` opts out, anything else opts in.
    ssl: sslmode === "disable" ? false : { rejectUnauthorized: false },
  });
  // A frozen serverless instance never runs its idle timer, so its pooled
  // connections would stay open server-side until the instance is reaped —
  // enough warm instances and the plan's limit is hit. Have the server drop
  // any connection idle for a minute instead; the next query reconnects.
  // (Long-lived LISTEN clients opt out — see lib/events/order-events.ts.)
  pool.on("connect", (client) => {
    // idle_session_timeout: reap idle connections back to the shared budget.
    // statement_timeout: never let one stuck query pin a scarce slot; 15s is
    // far above any real query here. The LISTEN client raises both back off
    // (see lib/events/order-events.ts) since it is idle and long-lived by design.
    client
      .query(
        `set idle_session_timeout = '${IDLE_SESSION_TIMEOUT}'; set statement_timeout = '15s'`,
      )
      .catch((err: Error) => {
        console.warn("[db] could not set session timeouts:", err.message);
      });
  });
  // Without a handler, an error on an idle client is an unhandled 'error'
  // event and kills the whole Node process. The server reaping an idle
  // session (57P05) is the timeout above doing its job, not a fault.
  pool.on("error", (err: Error & { code?: string }) => {
    if (err.code === "57P05") return;
    console.error("[db] idle client error:", err.message);
  });
  return pool;
}

/** Singleton pool — survives HMR in development. */
const pool = globalThis.__dhPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis.__dhPool = pool;
}

export const db = drizzle(pool, { schema });

/** The raw pool — for long-lived connections drizzle can't model (LISTEN/NOTIFY). */
export { pool };

export * as dbSchema from "./schema";

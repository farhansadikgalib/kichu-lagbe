import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  var __dhPool: Pool | undefined;
}

/** Server-side idle cutoff for pooled connections (Postgres interval syntax). */
export const IDLE_SESSION_TIMEOUT = "60s";

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
    // Aiven's plan allows 20 server connections (3 reserved), shared by every
    // warm serverless instance, the SSE LISTEN client, and drizzle-kit. Each
    // instance therefore gets a small pool; concurrency comes from instances.
    max: Number(process.env.DB_POOL_MAX) || 3,
    // Fail fast instead of queueing forever when the pool is saturated or the
    // database is unreachable — users get an error state, not a hanging page.
    connectionTimeoutMillis: 10_000,
    // Release idle connections promptly so bursty instances don't sit on the
    // plan's connection budget.
    idleTimeoutMillis: 10_000,
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
    client.query(`set idle_session_timeout = '${IDLE_SESSION_TIMEOUT}'`).catch((err: Error) => {
      console.warn("[db] could not set idle_session_timeout:", err.message);
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

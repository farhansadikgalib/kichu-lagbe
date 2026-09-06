import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  var __dhPool: Pool | undefined;
}

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
    // Aiven's plan caps total server connections, shared with the deployed app,
    // the SSE LISTEN client, and drizzle-kit — stay well under it per process.
    max: Number(process.env.DB_POOL_MAX) || 5,
    // Fail fast instead of queueing forever when the pool is saturated or the
    // database is unreachable — users get an error state, not a hanging page.
    connectionTimeoutMillis: 10_000,
    // Release idle connections promptly so bursty instances don't sit on the
    // plan's connection budget.
    idleTimeoutMillis: 30_000,
    // TCP keep-alive stops intermediaries from dropping the remote Aiven link
    // between bursts, which would cost a reconnect handshake per query.
    keepAlive: true,
    // Local Postgres usually has TLS off; hosted ones (Aiven) require it with
    // a self-signed CA. `sslmode=disable` opts out, anything else opts in.
    ssl: sslmode === "disable" ? false : { rejectUnauthorized: false },
  });
  // Without a handler, an error on an idle client (e.g. the server dropping
  // connections when its limit is hit) is an unhandled 'error' event and
  // kills the whole Node process.
  pool.on("error", (err) => {
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

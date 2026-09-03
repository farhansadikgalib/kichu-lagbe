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
  return new Pool({
    connectionString: url.toString(),
    max: 10,
    // Local Postgres usually has TLS off; hosted ones (Aiven) require it with
    // a self-signed CA. `sslmode=disable` opts out, anything else opts in.
    ssl: sslmode === "disable" ? false : { rejectUnauthorized: false },
  });
}

/** Singleton pool — survives HMR in development. */
const pool = globalThis.__dhPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis.__dhPool = pool;
}

export const db = drizzle(pool, { schema });

export * as dbSchema from "./schema";

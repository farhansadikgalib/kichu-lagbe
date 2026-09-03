import { defineConfig } from "drizzle-kit";

// Strip sslmode — newer pg treats `sslmode=require` as verify-full, which
// fails on Aiven's self-signed CA. TLS is configured explicitly instead.
function normalizeUrl(raw: string) {
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  return url.toString();
}

// Local Postgres usually has TLS off; hosted ones (Aiven) require it with a
// self-signed CA. `sslmode=disable` opts out, anything else opts in.
function sslOption(raw: string) {
  return new URL(raw).searchParams.get("sslmode") === "disable"
    ? false
    : { rejectUnauthorized: false };
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: normalizeUrl(process.env.DATABASE_URL!),
    ssl: sslOption(process.env.DATABASE_URL!),
  },
});

import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

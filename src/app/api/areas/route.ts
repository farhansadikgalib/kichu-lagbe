import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryAreas } from "@/lib/db/schema";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(deliveryAreas)
      .where(eq(deliveryAreas.isActive, true))
      .orderBy(asc(deliveryAreas.name));
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

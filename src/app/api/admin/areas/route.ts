import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryAreas } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { deliveryAreaSchema } from "@/lib/validation/catalog";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    await requireUser("admin");
    const rows = await db.select().from(deliveryAreas).orderBy(asc(deliveryAreas.name));
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser("admin");
    const input = deliveryAreaSchema.parse(await request.json());
    const [created] = await db
      .insert(deliveryAreas)
      .values({ name: input.name, charge: input.charge, isActive: input.isActive ?? true })
      .returning();
    return ok(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

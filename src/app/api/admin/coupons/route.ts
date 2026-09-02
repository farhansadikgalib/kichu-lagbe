import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { couponSchema } from "@/lib/validation/catalog";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    await requireUser("admin");
    const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser("admin");
    const input = couponSchema.parse(await request.json());
    const [created] = await db
      .insert(coupons)
      .values({
        code: input.code,
        type: input.type,
        value: input.value,
        minOrder: input.minOrder,
        isActive: input.isActive,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      })
      .returning();
    return ok(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

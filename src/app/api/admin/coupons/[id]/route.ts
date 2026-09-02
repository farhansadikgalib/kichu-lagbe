import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { couponPatchSchema } from "@/lib/validation/catalog";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireUser("admin");
    const { id } = await params;
    const input = couponPatchSchema.parse(await request.json());

    const [updated] = await db
      .update(coupons)
      .set({
        ...(input.code !== undefined && { code: input.code }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.value !== undefined && { value: input.value }),
        ...(input.minOrder !== undefined && { minOrder: input.minOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.expiresAt !== undefined && {
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        }),
      })
      .where(eq(coupons.id, id))
      .returning();
    if (!updated) throw new ApiError("Coupon not found.", 404);
    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireUser("admin");
    const { id } = await params;
    const deleted = await db.delete(coupons).where(eq(coupons.id, id)).returning();
    if (deleted.length === 0) throw new ApiError("Coupon not found.", 404);
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

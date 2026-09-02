import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryAreas } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { deliveryAreaSchema } from "@/lib/validation/catalog";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser("admin");
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) throw new ApiError("Invalid area id.", 422);

    const input = deliveryAreaSchema.partial().parse(await request.json());
    const [updated] = await db
      .update(deliveryAreas)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.charge !== undefined && { charge: input.charge }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      })
      .where(eq(deliveryAreas.id, numericId))
      .returning();
    if (!updated) throw new ApiError("Area not found.", 404);
    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

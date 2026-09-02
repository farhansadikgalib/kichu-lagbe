import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { productSchema } from "@/lib/validation/catalog";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireUser("admin");
    const { id } = await params;
    const input = productSchema.partial().parse(await request.json());

    const [updated] = await db
      .update(products)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl || null }),
        ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
      })
      .where(eq(products.id, id))
      .returning();
    if (!updated) throw new ApiError("Product not found.", 404);
    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireUser("admin");
    const { id } = await params;
    // Soft delete: mark unavailable (order history references products).
    const [updated] = await db
      .update(products)
      .set({ isAvailable: false })
      .where(eq(products.id, id))
      .returning();
    if (!updated) throw new ApiError("Product not found.", 404);
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getProductById } from "@/lib/db/queries/products";
import { syncVariants } from "@/lib/db/queries/product-variants";
import { requireUser } from "@/lib/auth/guards";
import { productSchema } from "@/lib/validation/catalog";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireUser("admin");
    const { id } = await params;
    const input = productSchema.partial().parse(await request.json());

    const changes = {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.description !== undefined && { description: input.description || null }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl || null }),
      ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
    };

    await db.transaction(async (tx) => {
      // A variants-only PATCH has nothing to set on the product row itself.
      const [found] =
        Object.keys(changes).length > 0
          ? await tx
              .update(products)
              .set(changes)
              .where(eq(products.id, id))
              .returning({ id: products.id })
          : await tx.select({ id: products.id }).from(products).where(eq(products.id, id));
      if (!found) throw new ApiError("Product not found.", 404);
      if (input.variants !== undefined) await syncVariants(tx, id, input.variants);
    });
    return ok(await getProductById(id));
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

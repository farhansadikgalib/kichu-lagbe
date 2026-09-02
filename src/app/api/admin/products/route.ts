import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { productSchema } from "@/lib/validation/catalog";
import { handleApiError, ok } from "@/lib/api/response";

/** All products (including unavailable) for the admin console. */
export async function GET() {
  try {
    await requireUser("admin");
    const rows = await db
      .select({ product: products, category: categories })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(categories.sortOrder), asc(products.name));
    return ok(rows.map((r) => ({ ...r.product, category: r.category })));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser("admin");
    const input = productSchema.parse(await request.json());
    const [created] = await db
      .insert(products)
      .values({
        name: input.name,
        slug: input.slug,
        categoryId: input.categoryId,
        description: input.description || null,
        price: input.price,
        imageUrl: input.imageUrl || null,
        isAvailable: input.isAvailable ?? true,
      })
      .returning();
    return ok(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

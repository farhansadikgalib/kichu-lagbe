import { and, asc, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const categorySlug = url.searchParams.get("category");
    const q = url.searchParams.get("q");

    const conditions = [eq(products.isAvailable, true)];
    if (categorySlug) conditions.push(eq(categories.slug, categorySlug));
    if (q) conditions.push(ilike(products.name, `%${q}%`));

    const rows = await db
      .select({ product: products, category: categories })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(asc(categories.sortOrder), asc(products.name));

    return ok(rows.map((r) => ({ ...r.product, category: r.category })));
  } catch (err) {
    return handleApiError(err);
  }
}

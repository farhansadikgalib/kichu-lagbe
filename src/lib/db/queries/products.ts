import { and, asc, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import type { ProductWithCategory } from "@/types";

interface ListProductsOptions {
  categorySlug?: string | null;
  search?: string | null;
}

/**
 * Available products with their category, in storefront order. Shared by the
 * products API and server-rendered pages so both return identical shapes.
 */
export async function listProducts({
  categorySlug,
  search,
}: ListProductsOptions = {}): Promise<ProductWithCategory[]> {
  const conditions = [eq(products.isAvailable, true)];
  if (categorySlug) conditions.push(eq(categories.slug, categorySlug));
  if (search) conditions.push(ilike(products.name, `%${search}%`));

  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(categories.sortOrder), asc(products.name));

  return rows.map((r) => ({ ...r.product, category: r.category }));
}

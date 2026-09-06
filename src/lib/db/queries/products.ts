import { and, asc, count, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products, productVariants } from "@/lib/db/schema";
import type { Category, Product, ProductVariant, ProductWithCategory } from "@/types";

interface ListProductsOptions {
  categorySlug?: string | null;
  search?: string | null;
  /** Admin listings include unavailable products and options. */
  includeUnavailable?: boolean;
  /** Page window (1-indexed); omit for the full unpaginated list (storefront use). */
  page?: number;
  pageSize?: number;
  /** `storefront` (default): category then name. `recent`: last edited or created first. */
  order?: "storefront" | "recent";
}

/**
 * Attaches each product's variants (in display order) in one extra query so
 * the storefront and the admin console return the same shape.
 */
export async function withVariants(
  rows: Array<{ product: Product; category: Category }>,
  { includeUnavailable = false } = {},
): Promise<ProductWithCategory[]> {
  if (rows.length === 0) return [];
  const conditions = [inArray(productVariants.productId, rows.map((r) => r.product.id))];
  if (!includeUnavailable) conditions.push(eq(productVariants.isAvailable, true));

  const variantRows = await db
    .select()
    .from(productVariants)
    .where(and(...conditions))
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.name));

  const byProduct = new Map<string, ProductVariant[]>();
  for (const variant of variantRows) {
    const list = byProduct.get(variant.productId) ?? [];
    list.push(variant);
    byProduct.set(variant.productId, list);
  }
  return rows.map((r) => ({
    ...r.product,
    category: r.category,
    variants: byProduct.get(r.product.id) ?? [],
  }));
}

/**
 * Products with their category and options, in storefront order. Shared by
 * the products API, the admin API and server-rendered pages.
 */
export async function listProducts({
  categorySlug,
  search,
  includeUnavailable = false,
  page,
  pageSize,
  order = "storefront",
}: ListProductsOptions = {}): Promise<ProductWithCategory[]> {
  const conditions = [];
  if (!includeUnavailable) conditions.push(eq(products.isAvailable, true));
  if (categorySlug) conditions.push(eq(categories.slug, categorySlug));
  if (search) conditions.push(ilike(products.name, `%${search}%`));
  const where = conditions.length ? and(...conditions) : undefined;

  let query = db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(
      ...(order === "recent"
        ? [desc(products.updatedAt), desc(products.createdAt)]
        : [asc(categories.sortOrder), asc(products.name)]),
    )
    .$dynamic();

  if (page && pageSize) query = query.limit(pageSize).offset((page - 1) * pageSize);

  const rows = await query;
  return withVariants(rows, { includeUnavailable });
}

/** Total products matching the same filters as `listProducts`, for pagination. */
export async function countProducts({
  categorySlug,
  search,
  includeUnavailable = false,
}: ListProductsOptions = {}): Promise<number> {
  const conditions = [];
  if (!includeUnavailable) conditions.push(eq(products.isAvailable, true));
  if (categorySlug) conditions.push(eq(categories.slug, categorySlug));
  if (search) conditions.push(ilike(products.name, `%${search}%`));

  const [{ total }] = await db
    .select({ total: count() })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(conditions.length ? and(...conditions) : undefined);
  return total;
}

/** One product with its category and every option, or null. */
export async function getProductById(id: string): Promise<ProductWithCategory | null> {
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);
  const [product] = await withVariants(rows, { includeUnavailable: true });
  return product ?? null;
}

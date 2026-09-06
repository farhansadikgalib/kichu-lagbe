import { revalidateTag, unstable_cache } from "next/cache";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { listProducts } from "./products";

/**
 * Cross-request cache for the public catalog. The catalog only changes on
 * admin edits, so every storefront read (API routes and server-rendered
 * pages) shares these entries instead of hitting Postgres per request.
 * Admin mutations call `revalidateCatalog()`; the `revalidate` window is
 * just a safety net.
 */
export const CATALOG_TAG = "catalog";

/** Storefront product list (available only), one cache entry per category. */
export const getCachedProducts = unstable_cache(
  (categorySlug?: string) => listProducts({ categorySlug }),
  ["storefront-products"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

export const getCachedCategories = unstable_cache(
  () => db.select().from(categories).orderBy(asc(categories.sortOrder)),
  ["storefront-categories"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

/** Drop the cached catalog now — the next read blocks on fresh data. */
export function revalidateCatalog() {
  revalidateTag(CATALOG_TAG, { expire: 0 });
}

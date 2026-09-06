import { getCachedProducts } from "@/lib/db/queries/catalog-cache";
import { listProducts } from "@/lib/db/queries/products";
import { handleApiError, ok } from "@/lib/api/response";

/** Browse responses are identical for everyone — let the CDN serve repeats. */
const BROWSE_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const categorySlug = url.searchParams.get("category");
    const search = url.searchParams.get("q");

    // Searches are unbounded in key space, so they query directly; plain
    // browse lists come from the shared catalog cache.
    if (search) return ok(await listProducts({ categorySlug, search }));
    return ok(await getCachedProducts(categorySlug ?? undefined), {
      headers: BROWSE_CACHE_HEADERS,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

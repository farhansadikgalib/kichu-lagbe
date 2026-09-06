import { getCachedCategories } from "@/lib/db/queries/catalog-cache";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    return ok(await getCachedCategories(), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

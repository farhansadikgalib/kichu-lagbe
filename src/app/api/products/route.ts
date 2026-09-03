import { listProducts } from "@/lib/db/queries/products";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return ok(
      await listProducts({
        categorySlug: url.searchParams.get("category"),
        search: url.searchParams.get("q"),
      }),
    );
  } catch (err) {
    return handleApiError(err);
  }
}

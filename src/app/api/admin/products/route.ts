import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { countProducts, getProductById, listProducts } from "@/lib/db/queries/products";
import { syncVariants } from "@/lib/db/queries/product-variants";
import { requireUser } from "@/lib/auth/guards";
import { productSchema } from "@/lib/validation/catalog";
import { handleApiError, ok } from "@/lib/api/response";
import { paginate, parsePagination } from "@/lib/api/pagination";

/** All products (including unavailable ones and options) for the admin console. */
export async function GET(request: Request) {
  try {
    await requireUser("admin");
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() || undefined;
    const { page, pageSize } = parsePagination(url);

    const [rows, total] = await Promise.all([
      listProducts({ includeUnavailable: true, search, page, pageSize, order: "recent" }),
      countProducts({ includeUnavailable: true, search }),
    ]);
    return ok(paginate(rows, total, page, pageSize));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser("admin");
    const input = productSchema.parse(await request.json());
    const id = await db.transaction(async (tx) => {
      const [created] = await tx
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
        .returning({ id: products.id });
      if (input.variants?.length) await syncVariants(tx, created.id, input.variants);
      return created.id;
    });
    return ok(await getProductById(id), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

import { HomeSections } from "@/components/home/home-sections";
import { getHomeLayout } from "@/lib/db/queries/home";
import { listProducts } from "@/lib/db/queries/products";

/** Static home page, regenerated in the background at most once a minute so
 * the featured grid tracks the catalog without a per-request query. Publishing
 * from the admin page builder revalidates it immediately. */
export const revalidate = 60;

export default async function HomePage() {
  // Both degrade gracefully: the layout falls back to the shipped sections and
  // the grid to client-side loading, rather than failing the page.
  const [layout, products] = await Promise.all([
    getHomeLayout(),
    listProducts().catch((err: unknown) => {
      console.error("[home] featured products unavailable:", err);
      return undefined;
    }),
  ]);

  return <HomeSections layout={layout} initialProducts={products} />;
}

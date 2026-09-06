import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryBrowser } from "@/components/products/category-browser";
import { CATALOG_TABS, findCatalogTab } from "@/components/products/category-tabs";
import { SERVICE } from "@/lib/constants";
import { getCachedProducts } from "@/lib/db/queries/catalog-cache";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

/** Lanes are pre-rendered with their product grids and refreshed in the
 * background at most once a minute — visitors get products in the first
 * HTML instead of a skeleton, and SWR revalidates on mount. */
export const revalidate = 60;

export function generateStaticParams() {
  return CATALOG_TABS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tab = findCatalogTab(slug);
  if (!tab) return { title: "Category not found" };
  return {
    title: tab.title,
    description: `Browse ${tab.title.toLowerCase()} delivered late-night (${SERVICE.window}) across ${SERVICE.area}.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  if (!findCatalogTab(slug)) notFound();
  // Degrades gracefully to client-side loading rather than failing the page.
  const products = await getCachedProducts(slug === "all" ? undefined : slug).catch(
    (err: unknown) => {
      console.error(`[category:${slug}] products unavailable:`, err);
      return undefined;
    },
  );
  return <CategoryBrowser slug={slug} initialProducts={products} />;
}

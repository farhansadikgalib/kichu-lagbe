import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryBrowser } from "@/components/products/category-browser";
import { findCatalogTab } from "@/components/products/category-tabs";
import { SERVICE } from "@/lib/constants";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
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
  return <CategoryBrowser slug={slug} />;
}

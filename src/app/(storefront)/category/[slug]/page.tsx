import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryBrowser } from "@/components/products/category-browser";
import { CATALOG_TABS } from "@/components/products/category-tabs";
import { SERVICE } from "@/lib/constants";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

function findTab(slug: string) {
  return CATALOG_TABS.find((tab) => tab.slug === slug);
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tab = findTab(slug);
  if (!tab) return { title: "Category not found" };
  const title = tab.slug === "all" ? "All Products" : tab.label;
  return {
    title,
    description: `Browse ${title.toLowerCase()} delivered late-night (${SERVICE.window}) across ${SERVICE.area}.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  if (!findTab(slug)) notFound();
  return <CategoryBrowser slug={slug} />;
}

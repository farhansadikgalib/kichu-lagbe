"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/use-catalog";
import { CATALOG_TABS } from "./category-tabs";
import { ProductGrid } from "./product-grid";
import { SearchInput } from "./search-input";

interface CategoryBrowserProps {
  slug: string;
}

/** Client-side catalog browser: debounced search + grid (category nav lives in the app bar). */
export function CategoryBrowser({ slug }: CategoryBrowserProps) {
  const [search, setSearch] = useState("");
  const { data: products, error, isLoading, mutate } = useProducts(slug, search);

  const tab = CATALOG_TABS.find((t) => t.slug === slug);
  const title = tab?.slug === "all" ? "All products" : (tab?.label ?? "Products");

  return (
    <div className="container-page py-8 md:py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isLoading
            ? "Loading products…"
            : products
              ? `${products.length} item${products.length === 1 ? "" : "s"} available tonight`
              : "Browse and add items to your cart"}
        </p>
      </header>

      <div className="mt-6">
        <SearchInput onSearch={setSearch} className="w-full md:max-w-md" />
      </div>

      <div className="mt-8">
        <ProductGrid
          products={products}
          isLoading={isLoading}
          error={error}
          onRetry={() => void mutate()}
          emptyMessage={
            search
              ? `No products match "${search}".`
              : "No products in this category yet — check back soon."
          }
        />
      </div>
    </div>
  );
}

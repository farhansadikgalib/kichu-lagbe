"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Clock, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/use-catalog";
import { SERVICE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ProductWithCategory } from "@/types";
import { CategoryChips } from "./category-chips";
import { findCatalogTab } from "./category-tabs";
import { MobileCartBar } from "./mobile-cart-bar";
import { ProductGrid } from "./product-grid";
import { SearchInput } from "./search-input";

const SEARCH_DEBOUNCE_MS = 300;

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
] as const;
type SortValue = (typeof SORTS)[number]["value"];

function sortProducts(products: ProductWithCategory[], sort: SortValue) {
  if (sort === "featured") return products;
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}

const FACTS = [
  { icon: Clock, label: SERVICE.window },
  { icon: Zap, label: `~${SERVICE.avgDeliveryMinutes} min delivery` },
  { icon: MapPin, label: SERVICE.area },
] as const;

interface CategoryBrowserProps {
  slug: string;
  /** Server-rendered rows for this lane: shown at once, revalidated in the background. */
  initialProducts?: ProductWithCategory[];
}

/** Catalog page: lane header, sticky search / lanes / sort toolbar, and the grid. */
export function CategoryBrowser({ slug, initialProducts }: CategoryBrowserProps) {
  const tab = findCatalogTab(slug) ?? findCatalogTab("all")!;

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("featured");

  useEffect(() => {
    const timer = window.setTimeout(
      () => setSearch(query.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, error, isLoading, isRefreshing, mutate } = useProducts(
    slug,
    search,
    // The prefetch only matches the unfiltered lane query.
    search ? undefined : initialProducts,
  );
  const products = useMemo(
    () => (data ? sortProducts(data, sort) : data),
    [data, sort],
  );
  const count = products?.length ?? 0;
  const busy = isLoading || isRefreshing;

  return (
    <>
      {/* Lane header */}
      <section
        aria-labelledby="catalog-heading"
        className="relative overflow-hidden"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {tab.image ? (
            <>
              <Image
                src={tab.image}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-40 motion-safe:animate-fade"
              />
              <div className="absolute inset-0 bg-linear-to-b from-background/40 via-background/75 to-background" />
            </>
          ) : (
            <>
              <div className="bg-grid-faint absolute inset-0" />
              <div className="absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            </>
          )}
        </div>

        <div className="container-page relative pt-8 pb-6 md:pt-12 md:pb-8">
          <p className="motion-safe:animate-fade-up text-sm font-semibold tracking-wide text-primary uppercase">
            Tonight&apos;s menu
          </p>
          <h1
            id="catalog-heading"
            className="motion-safe:animate-fade-up mt-2 flex items-center gap-3 text-3xl font-bold text-balance sm:text-4xl md:text-5xl"
            style={{ animationDelay: "0.06s" }}
          >
            {tab.emoji && (
              <span aria-hidden className="text-2xl sm:text-3xl md:text-4xl">
                {tab.emoji}
              </span>
            )}
            {tab.title}
          </h1>
          <p
            className="motion-safe:animate-fade-up mt-3 max-w-xl text-muted-foreground"
            style={{ animationDelay: "0.12s" }}
          >
            {tab.blurb}
          </p>
          <ul
            className="motion-safe:animate-fade-up mt-5 flex flex-wrap gap-2"
            style={{ animationDelay: "0.18s" }}
            aria-label="Service details"
          >
            {FACTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
              >
                <Icon className="size-3.5 text-primary" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sticky toolbar — tracks the header as it hides and returns */}
      <div className="sticky top-(--header-offset) z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg transition-[top] duration-200 ease-in-out">
        <div className="container-page flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
          <CategoryChips active={tab.slug} className="order-2 md:order-1" />
          <div className="order-1 flex items-center gap-2 md:order-2 md:w-auto">
            <SearchInput
              value={query}
              onValueChange={setQuery}
              className="flex-1 md:w-72"
            />
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as SortValue)}
            >
              <SelectTrigger
                aria-label="Sort products"
                className="h-10 shrink-0 rounded-full border-border/70 bg-card/60 pl-3 hover:bg-card"
              >
                <ArrowUpDown
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                <span className="hidden sm:inline">
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent align="end">
                {SORTS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container-page pt-5 pb-28 md:pb-16">
        <p
          className={cn(
            "text-sm text-muted-foreground tabular-nums transition-opacity",
            busy && "opacity-60",
          )}
          aria-live="polite"
        >
          {busy
            ? "Finding what's in stock…"
            : search
              ? `${count} ${count === 1 ? "result" : "results"} for “${search}”`
              : `${count} ${count === 1 ? "item" : "items"} available tonight`}
          {search && !busy && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="ml-1 h-auto px-1 text-primary"
              onClick={() => setQuery("")}
            >
              Clear
            </Button>
          )}
        </p>

        <div className={cn("mt-4 transition-opacity", isRefreshing && "opacity-60")}>
          <ProductGrid
            products={products}
            isLoading={isLoading}
            error={error}
            onRetry={() => void mutate()}
            emptyMessage={
              search
                ? `Nothing matches “${search}” in ${tab.title.toLowerCase()}. Try a shorter word or another lane.`
                : "This lane is being restocked — check back soon."
            }
          />
        </div>
      </div>

      <MobileCartBar />
    </>
  );
}

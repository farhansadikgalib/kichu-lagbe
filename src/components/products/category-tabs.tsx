import Link from "next/link";
import { cn } from "@/lib/utils";

/** Catalog navigation tabs — single source of truth for browsable slugs. */
export const CATALOG_TABS = [
  { slug: "all", label: "All" },
  { slug: "snacks", label: "Snacks" },
  { slug: "cigarettes", label: "Cigarettes" },
  { slug: "daily", label: "Daily Products" },
] as const;

export type CatalogSlug = (typeof CATALOG_TABS)[number]["slug"];

interface CategoryTabsProps {
  activeSlug: string;
  className?: string;
}

export function CategoryTabs({ activeSlug, className }: CategoryTabsProps) {
  return (
    <nav aria-label="Product categories" className={cn("flex flex-wrap gap-2", className)}>
      {CATALOG_TABS.map((tab) => {
        const active = tab.slug === activeSlug;
        return (
          <Link
            key={tab.slug}
            href={`/category/${tab.slug}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

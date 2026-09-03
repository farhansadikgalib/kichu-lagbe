/** Browsable catalog slugs — single source of truth (nav itself lives in the app bar). */
export const CATALOG_TABS = [
  { slug: "all", label: "All" },
  { slug: "snacks", label: "Snacks" },
  { slug: "cigarettes", label: "Cigarettes" },
  { slug: "daily", label: "Daily Products" },
] as const;

export type CatalogSlug = (typeof CATALOG_TABS)[number]["slug"];

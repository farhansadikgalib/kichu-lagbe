/**
 * Browsable catalog lanes — single source of truth for slugs, labels, and the
 * copy/imagery the category page header uses. Header nav lives in the app bar.
 */
export const CATALOG_TABS = [
  {
    slug: "all",
    label: "All",
    title: "All products",
    emoji: "✨",
    blurb:
      "Everything on the shelf tonight — snacks, smokes, and the essentials.",
    image: null,
  },
  {
    slug: "snacks",
    label: "Snacks",
    title: "Snacks",
    emoji: "🍔",
    blurb: "Quick bites and midnight cravings, restocked and ready.",
    image: "/images/categories/fdtest.jpg",
  },
  {
    slug: "cigarettes",
    label: "Cigarettes",
    title: "Cigarettes",
    emoji: "🚬",
    blurb: "All the major brands, at your door fast.",
    image: "/images/categories/cig.jpg",
  },
  {
    slug: "daily",
    label: "Daily Products",
    title: "Daily products",
    emoji: "🧃",
    blurb: "Milk, eggs, bread, and the everyday things you ran out of.",
    image: "/images/categories/daily.jpg",
  },
] as const;

export type CatalogSlug = (typeof CATALOG_TABS)[number]["slug"];
export type CatalogTab = (typeof CATALOG_TABS)[number];

export function findCatalogTab(slug: string): CatalogTab | undefined {
  return CATALOG_TABS.find((tab) => tab.slug === slug);
}

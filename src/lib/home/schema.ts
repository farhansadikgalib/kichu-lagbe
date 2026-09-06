import { z } from "zod";
import { SERVICE } from "@/lib/constants";
import { HOME_ICON_NAMES, type HomeIconName } from "./icons";

/* ------------------------------ Field schemas ------------------------------ */

const text = (max: number) => z.string().trim().max(max);
const href = z.string().trim().min(1, "Link is required").max(300);
const icon = z.enum(HOME_ICON_NAMES);
/** Relative path, uploaded media URL, or absolute URL; empty means "none". */
const image = z.string().trim().max(500);

/* ------------------------------ Section content ---------------------------- */

export const heroContentSchema = z.object({
  showStatusBadge: z.boolean(),
  title: text(80).min(1, "Title is required"),
  titleAccent: text(40),
  subtitle: text(240),
  ctaLabel: text(40).min(1),
  ctaHref: href,
  showInstallButton: z.boolean(),
  chips: z.array(z.object({ emoji: text(8), label: text(24).min(1), href })).max(6),
  footnote: text(120),
});

export const marqueeContentSchema = z.object({
  items: z.array(z.object({ icon, label: text(48).min(1) })).min(1).max(12),
});

export const statsContentSchema = z.object({
  items: z
    .array(z.object({ icon, value: text(24).min(1), label: text(48).min(1) }))
    .min(1)
    .max(4),
});

export const categoriesContentSchema = z.object({
  eyebrow: text(40),
  title: text(80).min(1),
  description: text(160),
  items: z
    .array(
      z.object({
        name: text(40).min(1),
        emoji: text(8),
        image,
        description: text(80),
        href,
      }),
    )
    .min(1)
    .max(6),
});

export const featuredContentSchema = z.object({
  eyebrow: text(40),
  title: text(80).min(1),
  description: text(160),
  count: z.number().int().min(1).max(24),
  ctaLabel: text(40).min(1),
  ctaHref: href,
});

export const howItWorksContentSchema = z.object({
  eyebrow: text(40),
  title: text(80).min(1),
  description: text(160),
  steps: z
    .array(z.object({ icon, title: text(40).min(1), description: text(160) }))
    .min(1)
    .max(6),
  facts: z.array(z.object({ icon, label: text(48).min(1) })).max(4),
  ctaLabel: text(40),
  ctaHref: href,
});

export const ctaContentSchema = z.object({
  badge: text(60),
  title: text(80).min(1),
  titleAccent: text(40),
  description: text(240),
  ctaLabel: text(40).min(1),
  ctaHref: href,
  showContactEmail: z.boolean(),
});

export const bannerContentSchema = z.object({
  eyebrow: text(40),
  title: text(80).min(1),
  description: text(240),
  image,
  imageAlt: text(120),
  imageSide: z.enum(["left", "right"]),
  ctaLabel: text(40),
  ctaHref: href,
});

/* --------------------------------- Sections -------------------------------- */

export const SECTION_TYPES = [
  "hero",
  "marquee",
  "stats",
  "categories",
  "featured",
  "howItWorks",
  "cta",
  "banner",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

const sectionId = z.string().trim().min(1).max(40);

function sectionOf<T extends SectionType, S extends z.ZodTypeAny>(type: T, content: S) {
  return z.object({ id: sectionId, type: z.literal(type), enabled: z.boolean(), content });
}

export const homeSectionSchema = z.discriminatedUnion("type", [
  sectionOf("hero", heroContentSchema),
  sectionOf("marquee", marqueeContentSchema),
  sectionOf("stats", statsContentSchema),
  sectionOf("categories", categoriesContentSchema),
  sectionOf("featured", featuredContentSchema),
  sectionOf("howItWorks", howItWorksContentSchema),
  sectionOf("cta", ctaContentSchema),
  sectionOf("banner", bannerContentSchema),
]);

export const MAX_HOME_SECTIONS = 20;

export const homeLayoutSchema = z.object({
  sections: z.array(homeSectionSchema).max(MAX_HOME_SECTIONS),
});

export type HomeLayout = z.infer<typeof homeLayoutSchema>;
export type HomeSection = z.infer<typeof homeSectionSchema>;
export type SectionContent<T extends SectionType> = Extract<HomeSection, { type: T }>["content"];

/* --------------------------------- Defaults -------------------------------- */

const minutes = `~${SERVICE.avgDeliveryMinutes} min`;

/** The shipped home page, section by section. Also fills gaps in stored layouts. */
export const DEFAULT_SECTION_CONTENT: { [T in SectionType]: SectionContent<T> } = {
  hero: {
    showStatusBadge: true,
    title: "Midnight cravings?",
    titleAccent: "Say less.",
    subtitle:
      "We deliver happiness — late-night home delivery of snacks, cigarettes, and daily essentials in Badda.",
    ctaLabel: "Start an order",
    ctaHref: "/category/all",
    showInstallButton: true,
    chips: [
      { emoji: "🍔", label: "Snacks", href: "/category/snacks" },
      { emoji: "🚬", label: "Smokes", href: "/category/cigarettes" },
      { emoji: "🧃", label: "Essentials", href: "/category/daily" },
    ],
    footnote: `At your door in ${minutes}. No minimum, no drama.`,
  },
  marquee: {
    items: [
      { icon: "bike", label: `${minutes} average delivery` },
      { icon: "moon", label: `Open ${SERVICE.window}` },
      { icon: "banknote", label: "Cash on delivery" },
      { icon: "map-pin", label: `Serving ${SERVICE.area}` },
      { icon: "clock-3", label: "Order in seconds" },
      { icon: "sparkles", label: "Fresh & sealed products" },
    ],
  },
  stats: {
    items: [
      { icon: "clock", value: minutes, label: "Average delivery time" },
      { icon: "moon", value: SERVICE.window, label: "Nightly delivery window" },
      { icon: "map-pin", value: SERVICE.area, label: "Full coverage area" },
    ],
  },
  categories: {
    eyebrow: "The lineup",
    title: "What's the vibe tonight?",
    description: "Pick a lane — we're already putting our shoes on.",
    items: [
      {
        name: "Snacks",
        emoji: "🍔",
        image: "/images/categories/fdtest.jpg",
        description: "Quick bites & midnight cravings",
        href: "/category/snacks",
      },
      {
        name: "Cigarettes",
        emoji: "🚬",
        image: "/images/categories/cig.jpg",
        description: "All major brands, delivered fast",
        href: "/category/cigarettes",
      },
      {
        name: "Daily Products",
        emoji: "🧃",
        image: "/images/categories/daily.jpg",
        description: "Milk, eggs, bread & everyday essentials",
        href: "/category/daily",
      },
    ],
  },
  featured: {
    eyebrow: "Hot right now",
    title: "On repeat in Badda",
    description: "What everyone's ordering tonight — restocked and ready.",
    count: 8,
    ctaLabel: "View all products",
    ctaHref: "/category/all",
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "Craving to doorstep in four taps",
    description: "No calls, no forms, no fuss. This is the whole process.",
    steps: [
      {
        icon: "search",
        title: "Browse",
        description: "Pick from snacks, cigarettes, and daily essentials — all in one place.",
      },
      {
        icon: "shopping-bag",
        title: "Order",
        description: "Add to cart and check out in seconds with cash on delivery.",
      },
      {
        icon: "map-pin",
        title: "Track",
        description: "Follow your order from confirmation to pickup in real time.",
      },
      {
        icon: "package-check",
        title: "Delivered",
        description: `At your door in ${minutes}utes on average.`,
      },
    ],
    facts: [
      { icon: "clock", label: `${minutes} average` },
      { icon: "banknote", label: "Cash on delivery" },
    ],
    ctaLabel: "Start an order",
    ctaHref: "/category/all",
  },
  cta: {
    badge: `Every night · ${SERVICE.window}`,
    title: "It's 2 AM and you're hungry.",
    titleAccent: "We're up.",
    description: `Snacks, smokes, and essentials at your door in ${minutes}utes, anywhere in ${SERVICE.area}. Ordering takes less time than choosing what to watch.`,
    ctaLabel: "Order now",
    ctaHref: "/category/all",
    showContactEmail: true,
  },
  banner: {
    eyebrow: "This week",
    title: "Something new on the shelf",
    description: "Tell customers about a promotion, a new range, or a change in hours.",
    image: "",
    imageAlt: "",
    imageSide: "right",
    ctaLabel: "Shop now",
    ctaHref: "/category/all",
  },
};

export const DEFAULT_HOME_LAYOUT: HomeLayout = {
  sections: (
    ["hero", "marquee", "stats", "categories", "featured", "howItWorks", "cta"] as const
  ).map((type) => ({
    id: type,
    type,
    enabled: true,
    content: DEFAULT_SECTION_CONTENT[type],
  })) as HomeSection[],
};

/* --------------------------------- Helpers --------------------------------- */

/** Unique, type-prefixed id — readable in JSON and safe as a DOM id fragment. */
export function newSectionId(type: SectionType) {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`;
}

/** New section instance with default copy and a unique id. */
export function createSection(type: SectionType): HomeSection {
  return {
    id: newSectionId(type),
    type,
    enabled: true,
    content: structuredClone(DEFAULT_SECTION_CONTENT[type]),
  } as HomeSection;
}

/** Deep copy of a section under a fresh id, for "Duplicate". */
export function duplicateSection(section: HomeSection): HomeSection {
  return { ...structuredClone(section), id: newSectionId(section.type) };
}

function isSectionType(value: unknown): value is SectionType {
  return typeof value === "string" && (SECTION_TYPES as readonly string[]).includes(value);
}

/**
 * Parses a stored layout leniently: fields added after a layout was saved are
 * filled from the defaults, so old JSON keeps rendering. Returns null when the
 * data is not a layout at all.
 */
export function normalizeHomeLayout(raw: unknown): HomeLayout | null {
  if (!raw || typeof raw !== "object") return null;
  const sections = (raw as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) return null;

  const merged = sections.map((section) => {
    if (!section || typeof section !== "object") return section;
    const { type, content } = section as { type?: unknown; content?: unknown };
    if (!isSectionType(type)) return section;
    return {
      enabled: true,
      ...section,
      content: {
        ...DEFAULT_SECTION_CONTENT[type],
        ...(content && typeof content === "object" ? content : {}),
      },
    };
  });

  const result = homeLayoutSchema.safeParse({ sections: merged });
  return result.success ? result.data : null;
}

/** Icon names as a list for select controls. */
export const HOME_ICON_OPTIONS = HOME_ICON_NAMES.map((name) => ({
  value: name,
  label: name.replace(/-/g, " "),
})) satisfies Array<{ value: HomeIconName; label: string }>;

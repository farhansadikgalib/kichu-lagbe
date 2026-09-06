import { DEFAULT_SECTION_CONTENT, HOME_ICON_OPTIONS, type SectionType } from "./schema";

/**
 * Editor metadata for the page builder — what each section is called and
 * which controls its inspector shows. Rendering lives in components/home;
 * validation lives in ./schema. Keys here must match the content schemas.
 */

export type FieldKind = "text" | "textarea" | "number" | "boolean" | "image" | "icon" | "select";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
}

export interface ListFieldDef {
  key: string;
  label: string;
  kind: "list";
  /** Singular noun for "Add …" and row headings. */
  itemLabel: string;
  fields: FieldDef[];
  min?: number;
  max: number;
  newItem: Record<string, unknown>;
}

export type SectionField = FieldDef | ListFieldDef;

export interface SectionMeta {
  label: string;
  description: string;
  fields: SectionField[];
}

const iconField = (key = "icon", label = "Icon"): FieldDef => ({
  key,
  label,
  kind: "icon",
  options: HOME_ICON_OPTIONS,
});

const linkFields = (label = "Button"): FieldDef[] => [
  { key: "ctaLabel", label: `${label} label`, kind: "text" },
  { key: "ctaHref", label: `${label} link`, kind: "text", placeholder: "/category/all" },
];

const headingFields: FieldDef[] = [
  { key: "eyebrow", label: "Eyebrow", kind: "text" },
  { key: "title", label: "Title", kind: "text" },
  { key: "description", label: "Description", kind: "textarea" },
];

export const SECTION_META: Record<SectionType, SectionMeta> = {
  hero: {
    label: "Hero",
    description: "Headline, tagline and the main call to action.",
    fields: [
      { key: "title", label: "Headline", kind: "text" },
      { key: "titleAccent", label: "Headline accent", kind: "text", help: "Highlighted tail of the headline." },
      { key: "subtitle", label: "Subtitle", kind: "textarea" },
      ...linkFields(),
      { key: "showInstallButton", label: "Show 'Install app' button", kind: "boolean" },
      { key: "showStatusBadge", label: "Show open / hours / area badge", kind: "boolean" },
      {
        key: "chips",
        label: "Quick links",
        kind: "list",
        itemLabel: "Quick link",
        max: 6,
        newItem: { emoji: "✨", label: "", href: "/category/all" },
        fields: [
          { key: "emoji", label: "Emoji", kind: "text" },
          { key: "label", label: "Label", kind: "text" },
          { key: "href", label: "Link", kind: "text" },
        ],
      },
      { key: "footnote", label: "Footnote", kind: "text" },
    ],
  },
  marquee: {
    label: "Ticker",
    description: "Scrolling strip of service highlights.",
    fields: [
      {
        key: "items",
        label: "Highlights",
        kind: "list",
        itemLabel: "Highlight",
        min: 1,
        max: 12,
        newItem: { icon: "sparkles", label: "" },
        fields: [iconField(), { key: "label", label: "Text", kind: "text" }],
      },
    ],
  },
  stats: {
    label: "Service stats",
    description: "Three big numbers about the service.",
    fields: [
      {
        key: "items",
        label: "Stats",
        kind: "list",
        itemLabel: "Stat",
        min: 1,
        max: 4,
        newItem: { icon: "sparkles", value: "", label: "" },
        fields: [
          iconField(),
          { key: "value", label: "Value", kind: "text", help: "A leading number counts up, e.g. ~30 min." },
          { key: "label", label: "Label", kind: "text" },
        ],
      },
    ],
  },
  categories: {
    label: "Category showcase",
    description: "Photo tiles linking into the catalog lanes.",
    fields: [
      ...headingFields,
      {
        key: "items",
        label: "Tiles",
        kind: "list",
        itemLabel: "Tile",
        min: 1,
        max: 6,
        newItem: { name: "", emoji: "✨", image: "", description: "", href: "/category/all" },
        fields: [
          { key: "name", label: "Name", kind: "text" },
          { key: "emoji", label: "Emoji", kind: "text" },
          { key: "image", label: "Photo", kind: "image" },
          { key: "description", label: "Description", kind: "text" },
          { key: "href", label: "Link", kind: "text" },
        ],
      },
    ],
  },
  featured: {
    label: "Featured products",
    description: "Live grid of the catalog's first products.",
    fields: [
      ...headingFields,
      { key: "count", label: "Number of products", kind: "number", min: 1, max: 24 },
      ...linkFields("View all"),
    ],
  },
  howItWorks: {
    label: "How it works",
    description: "Step-by-step walkthrough with a sticky intro.",
    fields: [
      ...headingFields,
      {
        key: "steps",
        label: "Steps",
        kind: "list",
        itemLabel: "Step",
        min: 1,
        max: 6,
        newItem: { icon: "sparkles", title: "", description: "" },
        fields: [
          iconField(),
          { key: "title", label: "Title", kind: "text" },
          { key: "description", label: "Description", kind: "textarea" },
        ],
      },
      {
        key: "facts",
        label: "Fact chips",
        kind: "list",
        itemLabel: "Fact",
        max: 4,
        newItem: { icon: "sparkles", label: "" },
        fields: [iconField(), { key: "label", label: "Text", kind: "text" }],
      },
      ...linkFields(),
    ],
  },
  cta: {
    label: "Closing call to action",
    description: "Glowing card with a final nudge to order.",
    fields: [
      { key: "badge", label: "Badge", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "titleAccent", label: "Title accent", kind: "text" },
      { key: "description", label: "Description", kind: "textarea" },
      ...linkFields(),
      { key: "showContactEmail", label: "Show contact email", kind: "boolean" },
    ],
  },
  banner: {
    label: "Image banner",
    description: "Promo panel with a photo, copy and a button.",
    fields: [
      ...headingFields,
      { key: "image", label: "Image", kind: "image" },
      { key: "imageAlt", label: "Image description", kind: "text", help: "Read by screen readers." },
      {
        key: "imageSide",
        label: "Image position",
        kind: "select",
        options: [
          { value: "right", label: "Right" },
          { value: "left", label: "Left" },
        ],
      },
      ...linkFields(),
    ],
  },
};

/** Section types offered by the "Add section" menu, in menu order. */
export const ADDABLE_SECTION_TYPES = Object.keys(DEFAULT_SECTION_CONTENT) as SectionType[];

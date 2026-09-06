import {
  Flame,
  Gauge,
  ImageIcon,
  LayoutGrid,
  ListOrdered,
  Megaphone,
  MousePointerClick,
  MoveHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { SectionType } from "@/lib/home/schema";

/** Builder-only glyph per section type (the list, the inspector header, the add dialog). */
export const SECTION_ICONS: Record<SectionType, LucideIcon> = {
  hero: Megaphone,
  marquee: MoveHorizontal,
  stats: Gauge,
  categories: LayoutGrid,
  featured: Flame,
  howItWorks: ListOrdered,
  cta: MousePointerClick,
  banner: ImageIcon,
};

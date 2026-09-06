import type { ReactNode } from "react";
import type { HomeLayout, HomeSection } from "@/lib/home/schema";
import type { ProductWithCategory } from "@/types";
import { Banner } from "./banner";
import { CategoryShowcase } from "./category-showcase";
import { CtaStrip } from "./cta-strip";
import { FeaturedProducts } from "./featured-products";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { MarqueeStrip } from "./marquee-strip";
import { ServiceStats } from "./service-stats";

interface HomeSectionsProps {
  layout: HomeLayout;
  /** Server-fetched catalog rows for the featured grid, when available. */
  initialProducts?: ProductWithCategory[];
  /** Hidden sections are skipped on the storefront; the builder can show them dimmed. */
  includeHidden?: boolean;
  /** Lets the admin preview wrap each section (selection outline, click target). */
  renderSection?: (section: HomeSection, node: ReactNode) => ReactNode;
}

/**
 * Renders a home layout section by section. Used by the public home page and
 * by the admin preview, so the builder shows exactly what customers get.
 */
export function HomeSections({
  layout,
  initialProducts,
  includeHidden = false,
  renderSection,
}: HomeSectionsProps) {
  return (
    <>
      {layout.sections
        .filter((section) => includeHidden || section.enabled)
        .map((section) => {
          const node = <SectionRenderer section={section} initialProducts={initialProducts} />;
          return (
            <SectionKey key={section.id}>
              {renderSection ? renderSection(section, node) : node}
            </SectionKey>
          );
        })}
    </>
  );
}

/** Keyed fragment so wrapped and unwrapped sections share one key strategy. */
function SectionKey({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function SectionRenderer({
  section,
  initialProducts,
}: {
  section: HomeSection;
  initialProducts?: ProductWithCategory[];
}) {
  const headingId = `${section.id}-heading`;
  switch (section.type) {
    case "hero":
      return <Hero content={section.content} />;
    case "marquee":
      return <MarqueeStrip content={section.content} />;
    case "stats":
      return <ServiceStats content={section.content} />;
    case "categories":
      return <CategoryShowcase content={section.content} headingId={headingId} />;
    case "featured":
      return (
        <FeaturedProducts
          content={section.content}
          headingId={headingId}
          initialProducts={initialProducts}
        />
      );
    case "howItWorks":
      return <HowItWorks content={section.content} headingId={headingId} />;
    case "cta":
      return <CtaStrip content={section.content} headingId={headingId} />;
    case "banner":
      return <Banner content={section.content} headingId={headingId} />;
  }
}

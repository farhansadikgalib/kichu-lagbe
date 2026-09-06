"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-catalog";
import type { SectionContent } from "@/lib/home/schema";
import type { ProductWithCategory } from "@/types";
import { SectionHeading } from "./section-heading";

/** DOM id of the "Hot right now" section — the header nav reveals once it scrolls into view. */
export const FEATURED_SECTION_ID = "featured";

interface FeaturedProductsProps {
  content: SectionContent<"featured">;
  headingId: string;
  /** Rows fetched on the server so the grid is in the first HTML instead of a skeleton. */
  initialProducts?: ProductWithCategory[];
}

export function FeaturedProducts({ content, headingId, initialProducts }: FeaturedProductsProps) {
  const { data, error, isLoading, mutate } = useProducts(undefined, undefined, initialProducts);
  const featured = data?.slice(0, content.count);

  return (
    <section
      id={FEATURED_SECTION_ID}
      aria-labelledby={headingId}
      className="container-page pb-16 md:pb-24"
    >
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          id={headingId}
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link href={content.ctaHref}>
            {content.ctaLabel} <ArrowRight aria-hidden />
          </Link>
        </Button>
      </Reveal>

      <div className="mt-8">
        <ProductGrid
          products={featured}
          isLoading={isLoading}
          error={error}
          onRetry={() => void mutate()}
          emptyMessage="Products are being restocked — check back soon."
          skeletonCount={content.count}
        />
      </div>

      <div className="mt-8 text-center sm:hidden">
        <Button asChild variant="outline">
          <Link href={content.ctaHref}>
            {content.ctaLabel} <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/use-catalog";
import type { ProductWithCategory } from "@/types";
import { SectionHeading } from "./section-heading";

const FEATURED_COUNT = 8;

/** DOM id of the "Hot right now" section — the header nav reveals once it scrolls into view. */
export const FEATURED_SECTION_ID = "featured";

interface FeaturedProductsProps {
  /** Rows fetched on the server so the grid is in the first HTML instead of a skeleton. */
  initialProducts?: ProductWithCategory[];
}

export function FeaturedProducts({ initialProducts }: FeaturedProductsProps) {
  const { data, error, isLoading, mutate } = useProducts(undefined, undefined, initialProducts);
  const featured = data?.slice(0, FEATURED_COUNT);

  return (
    <section
      id={FEATURED_SECTION_ID}
      aria-labelledby="featured-heading"
      className="container-page pb-16 md:pb-24"
    >
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          id="featured-heading"
          eyebrow="Hot right now"
          title="On repeat in Badda"
          description="What everyone's ordering tonight — restocked and ready."
        />
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link href="/category/all">
            View all products <ArrowRight aria-hidden />
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
          skeletonCount={FEATURED_COUNT}
        />
      </div>

      <div className="mt-8 text-center sm:hidden">
        <Button asChild variant="outline">
          <Link href="/category/all">
            View all products <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}

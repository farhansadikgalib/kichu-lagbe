"use client";

import type { ReactNode } from "react";
import {
  CircleAlert,
  PackageSearch,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProductWithCategory } from "@/types";
import { ProductCard } from "./product-card";

const GRID_CLASSES =
  "grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4";

interface ProductGridProps {
  products: ProductWithCategory[] | undefined;
  isLoading: boolean;
  error?: Error;
  onRetry?: () => void;
  emptyMessage?: string;
  skeletonCount?: number;
  className?: string;
}

/** Catalog grid with built-in loading (skeleton), error, and empty states. */
export function ProductGrid({
  products,
  isLoading,
  error,
  onRetry,
  emptyMessage = "No products found.",
  skeletonCount = 8,
  className,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(GRID_CLASSES, className)}
        aria-busy="true"
        aria-label="Loading products"
      >
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <GridStatus
        icon={CircleAlert}
        title="Couldn't load products"
        description={error.message}
        className={className}
      >
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw aria-hidden /> Try again
          </Button>
        )}
      </GridStatus>
    );
  }

  if (!products || products.length === 0) {
    return (
      <GridStatus
        icon={PackageSearch}
        title="Nothing here yet"
        description={emptyMessage}
        className={className}
      />
    );
  }

  return (
    <ul className={cn(GRID_CLASSES, className)} aria-label="Products">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} index={index} />
        </li>
      ))}
    </ul>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-3 sm:p-3.5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

interface GridStatusProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

function GridStatus({
  icon: Icon,
  title,
  description,
  className,
  children,
}: GridStatusProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

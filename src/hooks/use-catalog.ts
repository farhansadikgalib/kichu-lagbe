"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api/fetcher";
import type { Category, DeliverySettings, ProductWithCategory } from "@/types";

export function useProducts(
  categorySlug?: string,
  search?: string,
  /** Server-rendered rows for this same query: shown at once, revalidated in the background. */
  fallbackData?: ProductWithCategory[],
) {
  const params = new URLSearchParams();
  if (categorySlug && categorySlug !== "all") params.set("category", categorySlug);
  if (search) params.set("q", search);
  const qs = params.toString();
  const { data, error, isLoading, mutate } = useSWR<ProductWithCategory[]>(
    `/api/products${qs ? `?${qs}` : ""}`,
    swrFetcher,
    { fallbackData },
  );
  // SWR does not count fallback rows as loaded, so without this the grid would
  // show a skeleton over server-rendered products during the first revalidation.
  return { data, error, isLoading: isLoading && data === undefined, mutate };
}

export function useCategories() {
  return useSWR<Category[]>("/api/categories", swrFetcher);
}

/** Flat delivery charge applied to every order. */
export function useDeliveryCharge() {
  return useSWR<DeliverySettings>("/api/delivery", swrFetcher);
}

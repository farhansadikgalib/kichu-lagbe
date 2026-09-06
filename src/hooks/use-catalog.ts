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
    // Previous rows stay on screen while a new lane/search loads, so
    // switching tabs or typing never flashes a skeleton.
    { fallbackData, keepPreviousData: true },
  );
  return {
    data,
    error,
    // SWR does not count fallback/kept rows as loaded, so without this the
    // grid would show a skeleton over rows that are already on screen.
    isLoading: isLoading && data === undefined,
    /** A newer query is in flight while earlier rows stay visible. */
    isRefreshing: isLoading && data !== undefined,
    mutate,
  };
}

export function useCategories() {
  // Categories change rarely; don't refetch them on every window focus.
  return useSWR<Category[]>("/api/categories", swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}

/** Flat delivery charge applied to every order. */
export function useDeliveryCharge() {
  return useSWR<DeliverySettings>("/api/delivery", swrFetcher);
}

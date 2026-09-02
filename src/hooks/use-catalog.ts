"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api/fetcher";
import type { Category, DeliveryArea, ProductWithCategory } from "@/types";

export function useProducts(categorySlug?: string, search?: string) {
  const params = new URLSearchParams();
  if (categorySlug && categorySlug !== "all") params.set("category", categorySlug);
  if (search) params.set("q", search);
  const qs = params.toString();
  return useSWR<ProductWithCategory[]>(
    `/api/products${qs ? `?${qs}` : ""}`,
    swrFetcher,
  );
}

export function useCategories() {
  return useSWR<Category[]>("/api/categories", swrFetcher);
}

export function useDeliveryAreas() {
  return useSWR<DeliveryArea[]>("/api/areas", swrFetcher);
}

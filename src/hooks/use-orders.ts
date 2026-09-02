"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api/fetcher";
import type { OrderWithItems } from "@/types";

export function useMyOrders() {
  return useSWR<OrderWithItems[]>("/api/orders", swrFetcher);
}

export function useOrder(id: string | null) {
  return useSWR<OrderWithItems>(id ? `/api/orders/${id}` : null, swrFetcher, {
    refreshInterval: 15_000, // light polling so tracking stays fresh
  });
}

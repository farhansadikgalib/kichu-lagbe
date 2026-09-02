"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api/fetcher";
import type {
  AdminOrder,
  AdminStats,
  Coupon,
  DeliveryArea,
  OrderStatus,
  ProductWithCategory,
  User,
  UserRole,
} from "@/types";

/** SWR hooks for the admin API — one hook per resource, no scattered fetch calls. */

export function useAdminStats() {
  return useSWR<AdminStats>("/api/admin/stats", swrFetcher);
}

export function useAdminOrders(status?: OrderStatus) {
  return useSWR<AdminOrder[]>(
    status ? `/api/admin/orders?status=${status}` : "/api/admin/orders",
    swrFetcher,
  );
}

export function useAdminProducts() {
  return useSWR<ProductWithCategory[]>("/api/admin/products", swrFetcher);
}

export function useAdminCoupons() {
  return useSWR<Coupon[]>("/api/admin/coupons", swrFetcher);
}

export function useAdminUsers(role?: UserRole) {
  return useSWR<User[]>(
    role ? `/api/admin/users?role=${role}` : "/api/admin/users",
    swrFetcher,
  );
}

export function useAdminAreas() {
  return useSWR<DeliveryArea[]>("/api/admin/areas", swrFetcher);
}

/** Human-readable message for a failed mutation (FetchError or unknown). */
export function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Please try again.";
}

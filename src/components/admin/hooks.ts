"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api/fetcher";
import type { HomeLayout } from "@/lib/home/schema";
import type {
  AdminOrdersPage,
  AdminStats,
  Coupon,
  DeliverySettings,
  OrderStatus,
  Paginated,
  ProductWithCategory,
  StatsRange,
  User,
  UserRole,
} from "@/types";

/** SWR hooks for the admin API — one hook per resource, no scattered fetch calls. */

/** Dashboard reports for a window ending today; keeps the last window on screen while the next loads. */
export function useAdminStats(range: StatsRange = "30d") {
  return useSWR<AdminStats>(`/api/admin/stats?range=${range}`, swrFetcher, {
    keepPreviousData: true,
  });
}

export interface AdminOrdersQuery {
  status?: OrderStatus;
  search?: string;
  /** Dhaka calendar days, inclusive (YYYY-MM-DD). */
  from?: string;
  to?: string;
  sort?: "desc" | "asc";
  page?: number;
  pageSize?: number;
  /** Poll interval in ms — the orders board keeps itself fresh while it is open. */
  refreshInterval?: number;
}

/** Paginated orders with per-status counts; the previous page stays on screen while the next loads. */
export function useAdminOrders({ refreshInterval, ...query }: AdminOrdersQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return useSWR<AdminOrdersPage>(`/api/admin/orders${qs ? `?${qs}` : ""}`, swrFetcher, {
    refreshInterval,
    keepPreviousData: true,
  });
}

/** Every rider account, for assignment controls. */
export function useAdminRiders() {
  return useSWR<User[]>("/api/admin/users?role=rider&pageSize=100", async (url: string) => {
    const page = await swrFetcher<Paginated<User> | User[]>(url);
    return Array.isArray(page) ? page : page.items;
  });
}

interface AdminProductsOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminProducts({ search, page, pageSize }: AdminProductsOptions = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page) params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));
  const qs = params.toString();
  return useSWR<Paginated<ProductWithCategory>>(
    qs ? `/api/admin/products?${qs}` : "/api/admin/products",
    swrFetcher,
    { keepPreviousData: true },
  );
}

export function useAdminCoupons() {
  return useSWR<Coupon[]>("/api/admin/coupons", swrFetcher);
}

interface AdminUsersOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminUsers(role?: UserRole, { search, page, pageSize }: AdminUsersOptions = {}) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (search) params.set("search", search);
  if (page) params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));
  const qs = params.toString();
  return useSWR<Paginated<User>>(
    qs ? `/api/admin/users?${qs}` : "/api/admin/users",
    swrFetcher,
    { keepPreviousData: true },
  );
}

export function useAdminDelivery() {
  return useSWR<DeliverySettings>("/api/admin/delivery", swrFetcher);
}

/** Published home page layout (sections, order, copy, imagery). */
export function useAdminHomeLayout() {
  return useSWR<HomeLayout>("/api/admin/home", swrFetcher);
}

/** Human-readable message for a failed mutation (FetchError or unknown). */
export function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Please try again.";
}

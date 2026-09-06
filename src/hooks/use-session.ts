"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api/fetcher";
import type { SessionUser } from "@/types";

export const SESSION_KEY = "/api/auth/session";

/**
 * Client-side session state. `user` is null when logged out. The session
 * only changes through login / logout, which seed or clear the cache
 * themselves, so a cached value is trusted: no refetch on focus, on
 * reconnect, or when another header mounts after navigation.
 */
export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<SessionUser | null>(SESSION_KEY, swrFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 60_000,
  });
  return { user: data ?? null, error, isLoading, mutate };
}

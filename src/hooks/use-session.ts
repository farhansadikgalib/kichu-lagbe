"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api/fetcher";
import type { SessionUser } from "@/types";

/** Client-side session state. `user` is null when logged out. */
export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<SessionUser | null>(
    "/api/auth/session",
    swrFetcher,
  );
  return { user: data ?? null, error, isLoading, mutate };
}

"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/api/fetcher";
import type { AppNotification } from "@/types";

export function useNotifications(enabled: boolean) {
  return useSWR<AppNotification[]>(enabled ? "/api/notifications" : null, swrFetcher, {
    refreshInterval: 30_000,
  });
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { disablePush, enablePush, getPushStatus, syncPushSubscription, type PushStatus } from "@/lib/push/client";

/** Push notification state for the current device, plus enable / disable actions. */
export function usePush(enabled: boolean) {
  // `null` until the browser has been asked, so UI can hide rather than flicker.
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void getPushStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    // Keep the server pointed at this user for an already-subscribed device.
    void syncPushSubscription();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = status === "subscribed" ? await disablePush() : await enablePush();
      setStatus(next);
      if (next === "subscribed") toast.success("Notifications on for this device.");
      else if (next === "denied") toast.error("Notifications are blocked in your browser settings.");
      else if (status === "subscribed") toast("Notifications off for this device.");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Couldn't update notifications.");
    } finally {
      setBusy(false);
    }
  }, [busy, status]);

  return { status, busy, toggle };
}

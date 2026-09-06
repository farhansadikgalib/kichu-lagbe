"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  currentNotificationPermission,
  requestNotificationPermission,
} from "@/lib/browser-notifications";
import { subscribePermission } from "@/lib/permissions";

const CHANGE_EVENT = "notification-permission-change";

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  const unsubscribe = subscribePermission("notifications", () => callback());
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    unsubscribe();
  };
}

/**
 * Current system-notification permission plus a `request()` to prompt for it.
 * Reads "default" during SSR so the first client render matches, then tracks
 * both the prompt result and changes made in the browser's site settings.
 */
export function useNotificationPermission() {
  const permission = useSyncExternalStore(
    subscribe,
    currentNotificationPermission,
    () => "default" as const,
  );

  const request = useCallback(async () => {
    const next = await requestNotificationPermission();
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return next;
  }, []);

  return { permission, request };
}

// Once per page load: client-side navigation won't re-ask, a reload will.
// Chrome itself throttles prompts a user keeps dismissing, so this is enough.
let prompted = false;

/**
 * Ask for notification permission on mount, once per page load. Chrome
 * shows its prompt straight away; Firefox and Safari ignore a request that
 * isn't tied to a click, so those get a toast with an "Enable" button — a
 * real gesture — instead. Nothing happens when the user already decided.
 */
export function useNotificationPrompt(subject: string, enabled: boolean) {
  const { permission, request } = useNotificationPermission();

  useEffect(() => {
    if (!enabled || permission !== "default" || prompted) return;
    prompted = true;
    // The toast is global, so no cleanup guard: strict mode's double mount
    // would otherwise cancel it while the session flag blocks a retry.
    void request().then((result) => {
      if (result !== "default") return;
      toast(`Get alerts for ${subject}?`, {
        description: "We'll notify you even when this tab is in the background.",
        duration: 20_000,
        closeButton: true,
        action: {
          label: "Enable",
          onClick: () => {
            void request().then((next) => {
              if (next === "granted") toast.success(`You'll be alerted about ${subject}.`);
            });
          },
        },
      });
    });
  }, [enabled, permission, request, subject]);

  return permission;
}

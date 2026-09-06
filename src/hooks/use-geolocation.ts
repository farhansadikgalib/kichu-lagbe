"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { subscribePermission } from "@/lib/permissions";
import type { GeoPoint } from "@/lib/validation/order";

export type GeolocationStatus =
  | "idle"
  | "unsupported"
  | "locating"
  | "ready"
  | "denied"
  | "unavailable"
  | "timeout";

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 60_000,
};

type PermissionSnapshot = "unsupported" | "denied" | "prompt";

// Last known Permissions API state; the store snapshot is derived from it.
let permissionState: PermissionState | null = null;

function subscribe(callback: () => void) {
  return subscribePermission("geolocation", (status) => {
    permissionState = status.state;
    callback();
  });
}

function getSnapshot(): PermissionSnapshot {
  if (!("geolocation" in navigator)) return "unsupported";
  return permissionState === "denied" ? "denied" : "prompt";
}

interface GeolocationOptions {
  /**
   * Ask as soon as the hook mounts instead of waiting for `locate()`. The
   * browser shows its permission prompt on first use; a block is respected.
   */
  auto?: boolean;
}

/**
 * One-shot device location with the permission state surfaced so the UI can
 * explain a block instead of silently failing. `locate()` (or `auto`)
 * triggers the browser's permission prompt.
 */
export function useGeolocation({ auto = false }: GeolocationOptions = {}) {
  // Support and a block set in site settings, without prompting.
  const permission = useSyncExternalStore(subscribe, getSnapshot, () => "prompt" as const);
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [point, setPoint] = useState<GeoPoint | null>(null);

  const locate = useCallback(() => {
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPoint({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: Math.round(coords.accuracy),
        });
        setStatus("ready");
      },
      (err) => {
        setPoint(null);
        setStatus(
          err.code === err.PERMISSION_DENIED
            ? "denied"
            : err.code === err.TIMEOUT
              ? "timeout"
              : "unavailable",
        );
      },
      OPTIONS,
    );
  }, []);

  const clear = useCallback(() => {
    setPoint(null);
    setStatus("idle");
  }, []);

  // Prompt once on mount; the Permissions API can't be blocked from here
  // because the snapshot resolves after this effect, so let the prompt itself
  // report a denial.
  const autoRequested = useRef(false);
  useEffect(() => {
    if (!auto || autoRequested.current || !("geolocation" in navigator)) return;
    autoRequested.current = true;
    locate();
  }, [auto, locate]);

  return {
    // A block set in site settings wins over whatever the last attempt said.
    status: permission === "prompt" ? status : permission,
    point,
    locate,
    clear,
  };
}

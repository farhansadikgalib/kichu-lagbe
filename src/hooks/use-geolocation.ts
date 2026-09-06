"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { subscribePermission } from "@/lib/permissions";
import type { GeoPoint } from "@/lib/validation/order";

export type GeolocationStatus =
  | "idle"
  | "unsupported"
  | "insecure"
  | "locating"
  | "ready"
  | "denied"
  | "unavailable"
  | "timeout";

/** A fix at least this precise ends the search early. */
const GOOD_ACCURACY_M = 100;
/** How long to wait for a good high-accuracy fix before settling for the best seen. */
const HIGH_ACCURACY_WAIT_MS = 12_000;
/** Network/Wi-Fi positioning is fast but coarse; give it its own budget. */
const LOW_ACCURACY_TIMEOUT_MS = 15_000;

type PermissionSnapshot = "unsupported" | "insecure" | "denied" | "prompt";

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
  // Browsers only expose geolocation on HTTPS (and localhost); over plain
  // HTTP from a LAN address every request fails, so say so instead.
  if (!window.isSecureContext) return "insecure";
  return permissionState === "denied" ? "denied" : "prompt";
}

function toPoint({ coords }: GeolocationPosition): GeoPoint {
  return {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: Math.round(coords.accuracy),
  };
}

class GeoError extends Error {
  constructor(readonly status: Extract<GeolocationStatus, "denied" | "unavailable" | "timeout">) {
    super(status);
  }
}

function toGeoError(err: GeolocationPositionError) {
  return new GeoError(
    err.code === err.PERMISSION_DENIED
      ? "denied"
      : err.code === err.TIMEOUT
        ? "timeout"
        : "unavailable",
  );
}

/**
 * Watches for a high-accuracy (GPS) fix. Resolves with the first fix that is
 * precise enough, or with the best fix seen once the wait is over. Rejects
 * only when no fix arrived at all, so a cold GPS that reports "unavailable"
 * while warming up still gets its chance.
 */
function watchHighAccuracy(signal: AbortSignal) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    let best: GeolocationPosition | null = null;
    let watchId = 0;
    let timer = 0;

    const finish = (fn: () => void) => {
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      fn();
    };
    const onAbort = () => finish(() => reject(new GeoError("unavailable")));
    signal.addEventListener("abort", onAbort);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!best || position.coords.accuracy < best.coords.accuracy) best = position;
        if (position.coords.accuracy <= GOOD_ACCURACY_M) finish(() => resolve(position));
      },
      (err) => {
        // A denial is final; anything else is just "no fix yet". Wait for
        // the deadline unless nothing is ever going to arrive.
        if (err.code === err.PERMISSION_DENIED) finish(() => reject(toGeoError(err)));
        else if (!best && err.code === err.POSITION_UNAVAILABLE) finish(() => reject(toGeoError(err)));
      },
      { enableHighAccuracy: true, timeout: HIGH_ACCURACY_WAIT_MS, maximumAge: 0 },
    );

    timer = window.setTimeout(() => {
      finish(() => (best ? resolve(best) : reject(new GeoError("timeout"))));
    }, HIGH_ACCURACY_WAIT_MS);
  });
}

/** One coarse fix from Wi-Fi / cell / IP positioning; a recent cached one is fine. */
function getLowAccuracy(signal: AbortSignal) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    const onAbort = () => reject(new GeoError("unavailable"));
    signal.addEventListener("abort", onAbort);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        signal.removeEventListener("abort", onAbort);
        resolve(position);
      },
      (err) => {
        signal.removeEventListener("abort", onAbort);
        reject(toGeoError(err));
      },
      { enableHighAccuracy: false, timeout: LOW_ACCURACY_TIMEOUT_MS, maximumAge: 10 * 60_000 },
    );
  });
}

/**
 * Best-effort device position: GPS first, then the coarser network fix that
 * laptops and phones without a GPS lock can still provide. Throws a GeoError
 * naming the reason when both fail.
 */
async function acquirePosition(signal: AbortSignal): Promise<GeolocationPosition> {
  try {
    return await watchHighAccuracy(signal);
  } catch (err) {
    if (signal.aborted || (err instanceof GeoError && err.status === "denied")) throw err;
    return getLowAccuracy(signal);
  }
}

interface GeolocationOptions {
  /**
   * Try as soon as the hook mounts instead of waiting for `locate()`. A
   * failed automatic attempt stays quiet — the UI just keeps offering the
   * button — so only an explicit tap ever shows an error.
   */
  auto?: boolean;
}

/**
 * Device location with the permission state surfaced so the UI can explain a
 * block instead of silently failing. `locate()` (or `auto`) triggers the
 * browser's permission prompt.
 */
export function useGeolocation({ auto = false }: GeolocationOptions = {}) {
  // Support, secure context, and a block set in site settings, without prompting.
  const permission = useSyncExternalStore(subscribe, getSnapshot, () => "prompt" as const);
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const attempt = useRef<AbortController | null>(null);

  const run = useCallback(async (silent: boolean) => {
    if (!("geolocation" in navigator) || !window.isSecureContext) return;
    attempt.current?.abort();
    const controller = new AbortController();
    attempt.current = controller;
    setStatus("locating");
    try {
      const position = await acquirePosition(controller.signal);
      if (controller.signal.aborted) return;
      setPoint(toPoint(position));
      setStatus("ready");
    } catch (err) {
      if (controller.signal.aborted) return;
      setPoint(null);
      setStatus(!silent && err instanceof GeoError ? err.status : "idle");
    }
  }, []);

  const locate = useCallback(() => {
    void run(false);
  }, [run]);

  const clear = useCallback(() => {
    attempt.current?.abort();
    setPoint(null);
    setStatus("idle");
  }, []);

  // Cancel an in-flight search when the form goes away.
  useEffect(() => () => attempt.current?.abort(), []);

  // Try once on mount. The Permissions API can't block this because its
  // snapshot resolves after this effect, so the attempt reports for itself.
  // No once-ever guard: StrictMode's rehearsal unmount aborts the first
  // attempt, and the effect re-run must be free to start a fresh one.
  useEffect(() => {
    if (!auto) return;
    // `run` sets "locating" synchronously before its async position lookup —
    // a fetch-on-mount kickoff, not derived state; safe to run in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run(true);
  }, [auto, run]);

  return {
    // Missing support, an insecure page, or a block set in site settings
    // wins over whatever the last attempt said.
    status: permission === "prompt" ? status : permission,
    point,
    locate,
    clear,
  };
}

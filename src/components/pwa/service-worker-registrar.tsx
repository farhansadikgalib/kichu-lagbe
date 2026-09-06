"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker in production. In development it does the
 * opposite: a worker left behind by an earlier production build on the same
 * origin serves `/_next/static/` cache-first, and dev chunk names carry no
 * content hash, so it would keep handing out stale code after every change.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        if (registrations.length === 0) return;
        await Promise.all(registrations.map((r) => r.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
        console.warn("[sw] removed a stale service worker; reloading for fresh code");
        window.location.reload();
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("SW registration failed:", err);
    });
  }, []);

  return null;
}

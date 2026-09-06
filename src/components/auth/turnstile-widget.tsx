"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile script loaded without API"));
    };
    script.onerror = () => {
      scriptPromise = null; // allow a retry on remount
      reject(new Error("Failed to load Turnstile"));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

interface TurnstileWidgetProps {
  /** Called with a fresh token, and with `null` when the token expires/errors. */
  onToken: (token: string | null) => void;
}

/**
 * Cloudflare Turnstile bot check. Renders nothing when
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset (the server then skips
 * verification too). Remount with a new `key` to reset after a failed submit.
 */
export function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    const el = containerRef.current;
    if (!el) return;

    let widgetId: string | null = null;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return;
        widgetId = turnstile.render(el, {
          sitekey: SITE_KEY,
          theme: "dark",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        // Script blocked or offline — leave the form usable; the server
        // rejects the submit with a clear message if verification is required.
      });

    return () => {
      cancelled = true;
      if (widgetId !== null) window.turnstile?.remove(widgetId);
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className="flex min-h-16 justify-center" />;
}

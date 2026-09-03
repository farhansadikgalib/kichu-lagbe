"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Chrome fires `beforeinstallprompt` once, often before React finishes
// hydrating — a listener attached in useEffect can miss it and the native
// prompt is lost. Capture at module scope instead and let components
// subscribe to the stashed event.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function setDeferredPrompt(event: BeforeInstallPromptEvent | null) {
  deferredPrompt = event;
  promptListeners.forEach((notify) => notify());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    setDeferredPrompt(event as BeforeInstallPromptEvent);
  });
}

function subscribePrompt(onChange: () => void) {
  promptListeners.add(onChange);
  return () => promptListeners.delete(onChange);
}

function subscribeStandalone(onChange: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

/**
 * "Install app" CTA. Triggers the native PWA install prompt where the browser
 * supports `beforeinstallprompt`; otherwise shows add-to-home-screen guidance.
 * Renders nothing once the app is already installed (standalone display mode).
 */
export function InstallAppButton({
  size = "lg",
  variant = "default",
}: VariantProps<typeof buttonVariants>) {
  const standalone = useSyncExternalStore(subscribeStandalone, isStandalone, () => false);
  const installEvent = useSyncExternalStore(subscribePrompt, () => deferredPrompt, () => null);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    const onInstalled = () => {
      setDeferredPrompt(null);
      setJustInstalled(true);
      toast.success("KichuLagbe installed — find it on your home screen.");
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (standalone || justInstalled) return null;

  const handleClick = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
      return;
    }
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    toast.info(
      isIOS
        ? "Tap the Share button in Safari, then “Add to Home Screen”."
        : "Open your browser menu and choose “Install app” / “Add to Home screen”.",
    );
  };

  return (
    <Button size={size} variant={variant} onClick={handleClick}>
      Install app
    </Button>
  );
}

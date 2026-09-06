"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { NotificationPermissionButton } from "@/components/pwa/notification-permission-button";
import { Button } from "@/components/ui/button";
import { useNotificationPrompt } from "@/hooks/use-notification-permission";
import { useSession } from "@/hooks/use-session";
import { showBrowserNotification } from "@/lib/browser-notifications";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatBDT, formatOrderNumber } from "@/lib/format";
import type { OrderEvent } from "@/types";

const STREAM_URL = "/api/admin/events";
const MUTE_KEY = "admin:order-alerts-muted";
const MUTE_EVENT = "admin:order-alerts-muted-change";
const TOAST_MS = 12_000;

/** SWR keys that an order change makes stale. */
function isOrderData(key: unknown) {
  return (
    typeof key === "string" &&
    (key.startsWith("/api/admin/orders") ||
      key.startsWith("/api/admin/stats") ||
      key === "/api/notifications")
  );
}

/* ----------------------------- Mute preference ---------------------------- */

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeMuted(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(MUTE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(MUTE_EVENT, callback);
  };
}

function writeMuted(value: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* storage unavailable — the toggle still works for this page */
  }
  window.dispatchEvent(new Event(MUTE_EVENT));
}

/* --------------------------------- Chime ---------------------------------- */

/** Two rising tones, synthesised so there is no audio asset to load. */
function chime() {
  try {
    const ctx = new AudioContext();
    const start = ctx.currentTime;
    [880, 1320].forEach((frequency, i) => {
      const at = start + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.55);
    });
    void ctx.resume();
    setTimeout(() => void ctx.close(), 1500);
  } catch {
    /* autoplay blocked or no audio device — the toast still shows */
  }
}

/* ------------------------------- Component -------------------------------- */

/**
 * Keeps the admin console live: subscribes to the order event stream, toasts
 * new orders (with a chime and a tab-title flag while the tab is hidden),
 * and refreshes every orders, stats, and notifications query. Renders the
 * sound and desktop-alert toggles for the header.
 */
export function LiveOrderAlerts() {
  const { user } = useSession();
  const router = useRouter();
  const muted = useSyncExternalStore(subscribeMuted, readMuted, () => false);
  const userId = user?.role === "admin" ? user.id : null;
  useNotificationPrompt("new orders", userId !== null);

  useEffect(() => {
    if (!userId) return;

    const baseTitle = document.title;
    let unseen = 0;
    const flagTitle = () => {
      if (!document.hidden) return;
      unseen += 1;
      document.title = `(${unseen}) New order · ${baseTitle}`;
    };
    const clearTitle = () => {
      if (document.hidden || unseen === 0) return;
      unseen = 0;
      document.title = baseTitle;
    };
    document.addEventListener("visibilitychange", clearTitle);

    const refresh = () => void mutate(isOrderData);
    const view = { label: "View", onClick: () => router.push("/admin/orders") };

    const source = new EventSource(STREAM_URL);
    source.addEventListener("order.created", (message: MessageEvent<string>) => {
      const { order } = JSON.parse(message.data) as OrderEvent;
      refresh();
      const items = order.itemCount ?? 0;
      const title = `New order ${formatOrderNumber(order.orderNumber)}`;
      const body = `${order.customerName} · ${items} ${items === 1 ? "item" : "items"} · ${formatBDT(order.total)}${order.note ? ` · “${order.note}”` : ""}`;
      toast.success(title, { description: body, duration: TOAST_MS, action: view });
      // Read the preference at event time so the stream never has to reconnect on toggle.
      if (!readMuted()) chime();
      flagTitle();
      // The toast covers a visible tab; the system notification reaches a hidden one.
      if (document.hidden) {
        void showBrowserNotification({
          title,
          body,
          href: "/admin/orders",
          tag: `order-${order.id}`,
        });
      }
    });
    source.addEventListener("order.updated", (message: MessageEvent<string>) => {
      const event = JSON.parse(message.data) as OrderEvent;
      refresh();
      // This console already toasted its own action.
      if (event.actorId === userId) return;
      const { order } = event;
      toast.info(
        `${formatOrderNumber(order.orderNumber)} ${ORDER_STATUS_LABELS[order.status].toLowerCase()}`,
        {
          description: order.riderName
            ? `${order.riderName} · ${order.customerName}`
            : order.customerName,
          action: view,
        },
      );
    });

    return () => {
      source.close();
      document.removeEventListener("visibilitychange", clearTitle);
      document.title = baseTitle;
    };
  }, [userId, router]);

  if (!userId) return null;

  return (
    <>
      <NotificationPermissionButton subject="new orders" variant="icon" />
      <Button
        variant="ghost"
        size="icon"
        aria-label={muted ? "Unmute new order sound" : "Mute new order sound"}
        aria-pressed={muted}
        title={muted ? "New order sound is off" : "New order sound is on"}
        onClick={() => writeMuted(!muted)}
      >
        {muted ? <VolumeX /> : <Volume2 />}
      </Button>
    </>
  );
}

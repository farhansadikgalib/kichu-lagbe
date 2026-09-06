"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mutate } from "swr";
import { useSession } from "@/hooks/use-session";
import { showBrowserNotification } from "@/lib/browser-notifications";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatOrderNumber } from "@/lib/format";
import type { OrderEvent, OrderStatus } from "@/types";

const STREAM_URL = "/api/orders/events";
const TOAST_MS = 8_000;

/** SWR keys that a change to one of the customer's orders makes stale. */
function isMyOrderData(key: unknown) {
  return (
    typeof key === "string" && (key.startsWith("/api/orders") || key === "/api/notifications")
  );
}

/** Customer-facing wording for each step, matching the in-app notification text. */
const STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending: "is waiting to be confirmed",
  confirmed: "is confirmed and being prepared",
  picked_up: "is on its way",
  delivered: "has been delivered. Enjoy!",
  cancelled: "was cancelled",
};

/**
 * Keeps a signed-in customer's order pages live. Subscribes to their order
 * event stream (the same events the admin console and webhook receive), then
 * refreshes every order query, toasts the change, and — when the tab is in
 * the background and they've allowed it — raises a system notification.
 */
export function LiveOrderUpdates() {
  const { user } = useSession();
  const router = useRouter();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;

    const refresh = () => void mutate(isMyOrderData);
    const source = new EventSource(STREAM_URL);

    // Anything that changed while disconnected is picked up by revalidating.
    source.addEventListener("ready", refresh);

    source.addEventListener("order.updated", (message: MessageEvent<string>) => {
      const { order } = JSON.parse(message.data) as OrderEvent;
      refresh();

      const number = formatOrderNumber(order.orderNumber);
      const href = `/orders/${order.id}`;
      const title = `Order ${number} ${ORDER_STATUS_LABELS[order.status].toLowerCase()}`;
      const body = order.riderName
        ? `${order.riderName} is delivering it. Your order ${STATUS_MESSAGES[order.status]}.`
        : `Your order ${STATUS_MESSAGES[order.status]}.`;

      const notify = order.status === "cancelled" ? toast.error : toast.success;
      notify(title, {
        description: body,
        duration: TOAST_MS,
        action: { label: "Track", onClick: () => router.push(href) },
      });
      if (document.hidden) {
        void showBrowserNotification({ title, body, href, tag: `order-${order.id}`, renotify: true });
      }
    });

    return () => source.close();
  }, [userId, router]);

  return null;
}

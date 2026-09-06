import "server-only";
import { createHmac } from "node:crypto";
import type { OrderEvent } from "@/types";

const TIMEOUT_MS = 5_000;

/**
 * POST an order event to `ORDER_WEBHOOK_URL` (Slack/Telegram bridges, a
 * printer service, a second system). Signed with `ORDER_WEBHOOK_SECRET` when
 * set so the receiver can verify it. Fire-and-forget: failures are logged.
 */
export async function dispatchOrderWebhook(event: OrderEvent) {
  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) return;

  const body = JSON.stringify(event);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-KichuLagbe-Event": event.type,
    "X-KichuLagbe-Delivery": event.id,
  };
  const secret = process.env.ORDER_WEBHOOK_SECRET;
  if (secret) {
    headers["X-KichuLagbe-Signature"] =
      `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error(`[webhook] ${event.type} → ${res.status} ${res.statusText}`);
  } catch (err) {
    console.error(`[webhook] ${event.type} failed`, err);
  }
}

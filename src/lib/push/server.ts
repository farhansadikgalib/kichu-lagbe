import "server-only";
import { eq, inArray } from "drizzle-orm";
import webpush, { WebPushError } from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import type { PushPayload } from "./payload";

/** How long a push service should hold the message for an offline device. */
const TTL_SECONDS = 60 * 60;

let configured: boolean | null = null;

/** VAPID is optional: without keys, notifications simply stay in-app. */
export function isPushConfigured() {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@kichulagbe.com";
  configured = Boolean(publicKey && privateKey);
  if (configured) webpush.setVapidDetails(subject, publicKey!, privateKey!);
  return configured;
}

/**
 * Deliver a push message to every device of the given users. Dead
 * subscriptions (the browser revoked or rotated them) are pruned as they are
 * discovered. Never throws — push is best-effort on top of in-app notifications.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0 || !isPushConfigured()) return;
  try {
    const targets = await db.query.pushSubscriptions.findMany({
      where: inArray(pushSubscriptions.userId, userIds),
    });
    if (targets.length === 0) return;

    const body = JSON.stringify(payload);
    const dead: string[] = [];
    await Promise.all(
      targets.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
            { TTL: TTL_SECONDS, urgency: "high" },
          );
        } catch (err) {
          if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
            dead.push(sub.id);
          } else {
            console.error("[push] send failed", err instanceof Error ? err.message : err);
          }
        }
      }),
    );
    if (dead.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, dead));
  } catch (err) {
    console.error("[push]", err);
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  return sendPushToUsers([userId], payload);
}

/** Remove one device's subscription (on unsubscribe or when the browser reports it gone). */
export async function removePushSubscription(endpoint: string) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

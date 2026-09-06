"use client";

/**
 * Browser side of Web Push: permission, subscription, and keeping the server
 * in sync. Requires the service worker (production builds only).
 */
import { apiMutate } from "@/lib/api/fetcher";
import { requestNotificationPermission } from "@/lib/browser-notifications";
import { PUSH_SUBSCRIPTIONS_PATH } from "./payload";

export type PushStatus =
  /** No Push API here (or no VAPID key configured). */
  | "unsupported"
  /** iOS Safari: push only works once the app is on the home screen. */
  | "needs-install"
  | "denied"
  | "subscribed"
  | "unsubscribed";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    publicKey !== "" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** VAPID public keys are URL-safe base64; the Push API wants raw bytes. */
function applicationServerKey() {
  const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
  const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ?? null;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!pushSupported()) {
    return typeof navigator !== "undefined" && isIos() && !isStandalone() ? "needs-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "subscribed" : "unsubscribed";
}

/** Must run from a user gesture: asks permission, subscribes, and registers with the server. */
export async function enablePush(): Promise<PushStatus> {
  if (!pushSupported()) return getPushStatus();
  const permission = await requestNotificationPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "unsubscribed";
  const reg = (await registration()) ?? (await navigator.serviceWorker.ready);
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(),
    }));
  await apiMutate(PUSH_SUBSCRIPTIONS_PATH, { body: sub.toJSON() });
  return "subscribed";
}

export async function disablePush(): Promise<PushStatus> {
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await apiMutate(PUSH_SUBSCRIPTIONS_PATH, { method: "DELETE", body: { endpoint: sub.endpoint } }).catch(
      () => undefined,
    );
    await sub.unsubscribe();
  }
  return "unsubscribed";
}

/**
 * Re-register an existing subscription for the signed-in user. Cheap, and
 * it is what moves a shared device's subscription to whoever just logged in.
 */
export async function syncPushSubscription() {
  if (!pushSupported() || Notification.permission !== "granted") return;
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await apiMutate(PUSH_SUBSCRIPTIONS_PATH, { body: sub.toJSON() }).catch(() => undefined);
}

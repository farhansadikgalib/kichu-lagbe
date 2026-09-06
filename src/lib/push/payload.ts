/** What travels inside a push message; the service worker renders it. Safe for client code. */
export interface PushPayload {
  title: string;
  body: string;
  /** Same-origin path opened when the notification is tapped. */
  href?: string;
  /** Notifications with the same tag replace each other instead of stacking. */
  tag?: string;
}

/** Path of the endpoint the service worker re-registers with after a subscription rotates. */
export const PUSH_SUBSCRIPTIONS_PATH = "/api/push/subscriptions";

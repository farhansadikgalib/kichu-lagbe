/**
 * System (OS-level) notifications, shown even when the tab is in the
 * background. Goes through the service worker when one is registered so it
 * also works in the installed app on Android, where `new Notification` throws.
 */

export type BrowserNotificationPermission = NotificationPermission | "unsupported";

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function currentNotificationPermission(): BrowserNotificationPermission {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

/** Must be called from a user gesture or most browsers ignore it. */
export async function requestNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

interface ShowOptions {
  title: string;
  body: string;
  /** Same-origin path to open when the notification is clicked. */
  href: string;
  /** Replaces an earlier notification with the same tag instead of stacking. */
  tag?: string;
  /** Beep / vibrate even if the previous one with this tag is still showing. */
  renotify?: boolean;
}

export async function showBrowserNotification({ title, body, href, tag, renotify }: ShowOptions) {
  if (currentNotificationPermission() !== "granted") return;
  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    tag,
    renotify,
    icon: "/icon-192.png?v=5",
    badge: "/icon-192.png?v=5",
    data: { href },
  };
  try {
    const registration =
      "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (registration?.active) {
      await registration.showNotification(title, options);
      return;
    }
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      window.location.assign(href);
      notification.close();
    };
  } catch (err) {
    console.error("[notifications] could not show", err);
  }
}

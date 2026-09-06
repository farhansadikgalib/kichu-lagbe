import { BRAND } from "@/lib/constants";

/**
 * True when the page runs as an installed app (home-screen PWA) rather than
 * in a browser tab. `navigator.standalone` covers older iOS Safari, which
 * doesn't report the display-mode media query.
 */
export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

/** iPhone/iPad, including iPadOS 13+ which reports a Macintosh user agent. */
export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Which app is rendering the page on iOS. Every iOS browser is WebKit
 * underneath, but each hides "Add to Home Screen" behind a different button,
 * and embedded webviews (Facebook, Instagram, …) can't install at all.
 * Third-party browsers announce themselves with their own UA token; Brave
 * masks itself as Safari, so it is only found via the `navigator.brave` hook.
 */
export type IosBrowser =
  | "safari"
  | "chrome"
  | "brave"
  | "firefox"
  | "edge"
  | "opera"
  | "duckduckgo"
  | "in-app";

export function getIosBrowser(): IosBrowser {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  // Embedded webviews first: several of them keep the host browser's token.
  if (/FBAN|FBAV|FB_IAB|Instagram|Snapchat|TikTok|BytedanceWebview|MicroMessenger|Line\/|GSA\//i.test(ua)) {
    return "in-app";
  }
  if (/CriOS\//.test(ua)) return "chrome";
  if (/EdgiOS\//.test(ua)) return "edge";
  if (/FxiOS\//.test(ua)) return "firefox";
  if (/OPiOS\/|OPT\//.test(ua)) return "opera";
  if (/DuckDuckGo\//.test(ua)) return "duckduckgo";
  if ("brave" in navigator) return "brave";
  return "safari";
}

export interface InstallInstructions {
  title: string;
  description: string;
}

/**
 * Add-to-home-screen steps for browsers that give us no install prompt of our
 * own — every iOS browser, plus desktop/mobile browsers without
 * `beforeinstallprompt`. Never name Safari unless the user is actually in it.
 */
export function getInstallInstructions(): InstallInstructions {
  if (!isIosDevice()) {
    return {
      title: `Add ${BRAND.name} to your device`,
      description: "Open your browser menu and choose “Install app” or “Add to Home screen”.",
    };
  }

  const step = "then choose “Add to Home Screen”.";
  switch (getIosBrowser()) {
    case "in-app":
      return {
        title: "Open in your browser first",
        description:
          "In-app browsers can’t add apps to the Home Screen. Tap the ⋯ menu, choose “Open in browser”, then install from there.",
      };
    case "chrome":
      return {
        title: `Add ${BRAND.name} to your Home Screen`,
        description: `Tap the Share icon in Chrome’s address bar, ${step}`,
      };
    case "brave":
      return {
        title: `Add ${BRAND.name} to your Home Screen`,
        description: `Tap the Share icon in Brave’s address bar, ${step}`,
      };
    case "edge":
      return {
        title: `Add ${BRAND.name} to your Home Screen`,
        description: `Tap the ⋯ menu in Edge, choose Share, ${step}`,
      };
    case "firefox":
      return {
        title: `Add ${BRAND.name} to your Home Screen`,
        description: `Tap the ⋯ menu in Firefox, choose Share, ${step}`,
      };
    case "opera":
      return {
        title: `Add ${BRAND.name} to your Home Screen`,
        description: `Tap the ⋯ menu in Opera, choose Share, ${step}`,
      };
    case "duckduckgo":
      return {
        title: `Add ${BRAND.name} to your Home Screen`,
        description: `Tap the Share button in DuckDuckGo, ${step}`,
      };
    default:
      return {
        title: `Add ${BRAND.name} to your Home Screen`,
        description: `Tap the Share button at the bottom of Safari, ${step}`,
      };
  }
}

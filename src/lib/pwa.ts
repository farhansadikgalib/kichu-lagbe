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

export type InstallStepIcon = "share" | "menu" | "add" | "confirm" | "open";

export interface InstallStep {
  icon: InstallStepIcon;
  text: string;
}

export interface InstallGuide {
  title: string;
  /** The steps as one sentence, for tooltips and toasts. */
  description: string;
  steps: InstallStep[];
  /** Where this browser keeps its Share control, so the guide can point at it. */
  shareAt: "bottom" | "address-bar" | null;
  /** False inside embedded webviews: the page must be reopened in a real browser first. */
  canInstall: boolean;
}

const ADD_STEP: InstallStep = { icon: "add", text: "Scroll the sheet and tap “Add to Home Screen”" };
const CONFIRM_STEP: InstallStep = { icon: "confirm", text: "Tap “Add” in the top-right corner" };

function sentence(steps: InstallStep[]) {
  return steps
    .map((step, i) => (i === 0 ? step.text : step.text[0].toLowerCase() + step.text.slice(1)))
    .join(", then ")
    .concat(".");
}

function guide(
  title: string,
  steps: InstallStep[],
  extra: Pick<InstallGuide, "shareAt" | "canInstall">,
): InstallGuide {
  return { title, description: sentence(steps), steps, ...extra };
}

/**
 * Add-to-home-screen steps for browsers that give us no install prompt of our
 * own — every iOS browser (none of them expose `beforeinstallprompt`), plus
 * desktop/mobile browsers without it. Never name Safari unless the user is
 * actually in it.
 */
export function getInstallGuide(): InstallGuide {
  const title = `Add ${BRAND.name} to your Home Screen`;

  if (!isIosDevice()) {
    return guide(
      `Add ${BRAND.name} to your device`,
      [
        { icon: "menu", text: "Open your browser’s menu" },
        { icon: "add", text: "Choose “Install app” or “Add to Home screen”" },
      ],
      { shareAt: null, canInstall: true },
    );
  }

  switch (getIosBrowser()) {
    case "in-app":
      return guide(
        "Open in Safari first",
        [
          { icon: "menu", text: "Tap the ⋯ or ⋮ menu in the corner of this screen" },
          { icon: "open", text: "Choose “Open in browser” or “Open in Safari”" },
          { icon: "share", text: "There, tap Share and choose “Add to Home Screen”" },
        ],
        { shareAt: null, canInstall: false },
      );
    case "chrome":
    case "brave":
      return guide(
        title,
        [
          { icon: "share", text: "Tap the Share icon at the end of the address bar" },
          ADD_STEP,
          CONFIRM_STEP,
        ],
        { shareAt: "address-bar", canInstall: true },
      );
    case "edge":
    case "firefox":
    case "opera":
      return guide(
        title,
        [
          { icon: "menu", text: "Tap the ⋯ menu" },
          { icon: "share", text: "Choose “Share”" },
          ADD_STEP,
          CONFIRM_STEP,
        ],
        { shareAt: null, canInstall: true },
      );
    case "duckduckgo":
      return guide(
        title,
        [{ icon: "share", text: "Tap the Share button" }, ADD_STEP, CONFIRM_STEP],
        { shareAt: null, canInstall: true },
      );
    default:
      return guide(
        title,
        [
          { icon: "share", text: "Tap the Share button in the bar at the bottom of the screen" },
          ADD_STEP,
          CONFIRM_STEP,
        ],
        { shareAt: "bottom", canInstall: true },
      );
  }
}

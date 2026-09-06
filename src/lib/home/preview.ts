import type { HomeLayout } from "./schema";

/** Admin-only route that renders the home page from a layout sent by the builder. */
export const HOME_PREVIEW_PATH = "/preview/home";

/**
 * postMessage protocol between the builder (parent window) and the preview
 * iframe. Every message is same-origin and carries a `kl:` prefixed type.
 */
export const PREVIEW_READY = "kl:home-preview-ready" as const;
export const PREVIEW_LAYOUT = "kl:home-layout" as const;
export const PREVIEW_MODE = "kl:home-mode" as const;
export const PREVIEW_SELECT = "kl:home-select" as const;

export type PreviewMessage =
  /** Frame → builder: the preview is listening. */
  | { type: typeof PREVIEW_READY }
  /** Builder → frame: render this draft. */
  | { type: typeof PREVIEW_LAYOUT; layout: HomeLayout }
  /** Builder → frame: in edit mode clicks select sections instead of interacting. */
  | { type: typeof PREVIEW_MODE; editing: boolean }
  /** Both directions: the current selection. `scroll` asks the frame to bring it into view. */
  | { type: typeof PREVIEW_SELECT; id: string | null; scroll?: boolean };

export function isPreviewMessage(data: unknown): data is PreviewMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { type?: unknown }).type === "string" &&
    (data as { type: string }).type.startsWith("kl:home-")
  );
}

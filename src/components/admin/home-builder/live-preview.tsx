"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Monitor, MousePointerClick, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HOME_PREVIEW_PATH,
  isPreviewMessage,
  PREVIEW_LAYOUT,
  PREVIEW_MODE,
  PREVIEW_READY,
  PREVIEW_SELECT,
  type PreviewMessage,
} from "@/lib/home/preview";
import type { HomeLayout } from "@/lib/home/schema";
import { cn } from "@/lib/utils";

/** Debounce so typing in the inspector doesn't re-render the frame per keystroke. */
const POST_DELAY_MS = 120;

const DEVICES = [
  { value: "desktop", label: "Desktop", icon: Monitor, width: "w-full" },
  { value: "tablet", label: "Tablet", icon: Tablet, width: "w-[820px] max-w-full" },
  { value: "mobile", label: "Phone", icon: Smartphone, width: "w-[390px] max-w-full" },
] as const;
type Device = (typeof DEVICES)[number]["value"];

export interface PreviewSelection {
  id: string | null;
  /** True when the selection came from the outline, so the frame scrolls to it. */
  scroll: boolean;
}

interface LivePreviewProps {
  layout: HomeLayout;
  dirty: boolean;
  selection: PreviewSelection;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * The real storefront home rendered in an iframe and fed the draft layout via
 * postMessage — its own window scroll keeps every scroll-linked animation
 * behaving exactly as it does for customers. In select mode, clicking a
 * section in the frame selects it in the builder.
 */
export function LivePreview({ layout, dirty, selection, onSelect, className }: LivePreviewProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [editing, setEditing] = useState(true);
  const [ready, setReady] = useState(false);
  const [frameKey, setFrameKey] = useState(0);

  // Latest props for the ready handler, which is registered once.
  const latest = useRef({ layout, editing, selection });
  useEffect(() => {
    latest.current = { layout, editing, selection };
  }, [layout, editing, selection]);

  const post = useCallback((message: PreviewMessage) => {
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  // The frame announces itself once its React tree is listening; only then is
  // a message guaranteed to be received. Selection clicks flow back the same way.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || !isPreviewMessage(event.data)) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = event.data;
      if (message.type === PREVIEW_READY) {
        setReady(true);
        const { layout, editing, selection } = latest.current;
        post({ type: PREVIEW_LAYOUT, layout });
        post({ type: PREVIEW_MODE, editing });
        post({ type: PREVIEW_SELECT, id: selection.id, scroll: false });
      } else if (message.type === PREVIEW_SELECT && message.id) {
        onSelect(message.id);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post, onSelect]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => post({ type: PREVIEW_LAYOUT, layout }), POST_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [layout, ready, post]);

  useEffect(() => {
    if (ready) post({ type: PREVIEW_MODE, editing });
  }, [editing, ready, post]);

  useEffect(() => {
    if (ready) post({ type: PREVIEW_SELECT, id: selection.id, scroll: selection.scroll });
  }, [selection, ready, post]);

  function reload() {
    setReady(false);
    setFrameKey((k) => k + 1);
  }

  const widthClass = DEVICES.find((d) => d.value === device)?.width ?? "w-full";

  return (
    <section
      aria-label="Live preview"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Preview</h2>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              dirty ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400",
            )}
          >
            {dirty ? "Unpublished changes" : "Published"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={editing ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={editing}
            title="When on, clicking a section in the preview selects it. Turn off to use links and buttons."
            onClick={() => setEditing((v) => !v)}
          >
            <MousePointerClick data-icon="inline-start" aria-hidden />
            {editing ? "Select mode" : "Interact mode"}
          </Button>
          <Tabs value={device} onValueChange={(value) => setDevice(value as Device)}>
            <TabsList aria-label="Preview width">
              {DEVICES.map((d) => (
                <TabsTrigger key={d.value} value={d.value} aria-label={d.label} title={d.label}>
                  <d.icon aria-hidden />
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Reload preview" onClick={reload}>
            <RefreshCw />
          </Button>
          <Button asChild variant="ghost" size="icon-sm">
            <a
              href={HOME_PREVIEW_PATH}
              target="_blank"
              rel="noopener"
              aria-label="Open the published version in a new tab"
            >
              <ExternalLink />
            </a>
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-hidden bg-muted/40 p-3">
        <iframe
          key={frameKey}
          ref={frameRef}
          src={HOME_PREVIEW_PATH}
          title="Home page preview"
          className={cn(
            "h-[70dvh] rounded-lg bg-background ring-1 ring-foreground/10 transition-[width] duration-300 xl:h-full",
            widthClass,
          )}
        />
      </div>
    </section>
  );
}

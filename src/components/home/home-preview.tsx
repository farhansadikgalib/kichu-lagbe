"use client";

import { useEffect, useState, useSyncExternalStore, type MouseEvent } from "react";
import { EyeOff, MousePointerClick } from "lucide-react";
import { SECTION_META } from "@/lib/home/registry";
import { normalizeHomeLayout, type HomeLayout, type HomeSection } from "@/lib/home/schema";
import {
  isPreviewMessage,
  PREVIEW_LAYOUT,
  PREVIEW_MODE,
  PREVIEW_READY,
  PREVIEW_SELECT,
  type PreviewMessage,
} from "@/lib/home/preview";
import { ScrollTrigger } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";
import type { ProductWithCategory } from "@/types";
import { HomeSections } from "./home-sections";

interface HomePreviewProps {
  initialLayout: HomeLayout;
  initialProducts?: ProductWithCategory[];
}

const sectionSelector = (id: string) => `[data-section-id="${CSS.escape(id)}"]`;

const subscribeNever = () => () => {};
/** Whether this page runs inside the builder's iframe — false during SSR so hydration matches. */
const useEmbedded = () =>
  useSyncExternalStore(
    subscribeNever,
    () => window.parent !== window,
    () => false,
  );

/**
 * Home page driven by whatever layout the page builder posts into this frame.
 * In edit mode each section becomes a click target that reports its id back,
 * and the builder's selection is outlined and scrolled into view. Starts from
 * the published layout so it is useful even outside the builder.
 */
export function HomePreview({ initialLayout, initialProducts }: HomePreviewProps) {
  const [layout, setLayout] = useState(initialLayout);
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const embedded = useEmbedded();

  const post = (message: PreviewMessage) => {
    if (window.parent !== window) window.parent.postMessage(message, window.location.origin);
  };

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Same-origin only: the builder lives on this deployment.
      if (event.origin !== window.location.origin || !isPreviewMessage(event.data)) return;
      const message = event.data;
      switch (message.type) {
        case PREVIEW_LAYOUT: {
          const next = normalizeHomeLayout(message.layout);
          if (next) setLayout(next);
          break;
        }
        case PREVIEW_MODE:
          setEditing(message.editing);
          break;
        case PREVIEW_SELECT:
          setSelectedId(message.id);
          if (message.id && message.scroll) {
            // After the layout commit so a freshly added section exists in the DOM.
            requestAnimationFrame(() => {
              document
                .querySelector(sectionSelector(message.id!))
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }
          break;
      }
    }
    window.addEventListener("message", onMessage);
    post({ type: PREVIEW_READY });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Sections change height as copy is edited; scroll-linked motion must re-measure.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [layout]);

  function handleSelect(event: MouseEvent, section: HomeSection) {
    if (!editing) return;
    // In edit mode a click picks the section; links and buttons stay inert.
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(section.id);
    post({ type: PREVIEW_SELECT, id: section.id });
  }

  return (
    <>
      {!embedded && (
        <p
          role="status"
          className="pointer-events-none fixed top-20 left-1/2 z-50 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary/30 bg-background/90 px-3 py-1 text-xs font-medium text-primary shadow-lg backdrop-blur-md"
        >
          <MousePointerClick className="size-3.5" aria-hidden />
          Preview of the published home page
        </p>
      )}
      <HomeSections
        layout={layout}
        initialProducts={initialProducts}
        includeHidden={embedded}
        renderSection={(section, node) => {
          const selected = section.id === selectedId;
          return (
            <div
              data-section-id={section.id}
              onClickCapture={(event) => handleSelect(event, section)}
              className={cn(
                "group/section relative scroll-mt-16",
                editing &&
                  "cursor-pointer outline-2 -outline-offset-2 outline-transparent transition-[outline-color] duration-150 hover:outline-primary/50",
                editing && selected && "outline-primary hover:outline-primary",
                !section.enabled && "opacity-40 grayscale",
              )}
            >
              {editing && (
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute top-2 left-2 z-40 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-md transition-opacity duration-150",
                    selected ? "opacity-100" : "opacity-0 group-hover/section:opacity-100",
                  )}
                >
                  {SECTION_META[section.type].label}
                  {!section.enabled && <EyeOff className="size-3" />}
                </span>
              )}
              {node}
            </div>
          );
        }}
      />
    </>
  );
}

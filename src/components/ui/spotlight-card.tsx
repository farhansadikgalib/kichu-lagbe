"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Spotlight tile: an amber radial glow follows the cursor across the card
 * (21st.dev-style). Pointer position is written to CSS vars directly — no
 * re-renders. Touch devices simply never show the overlay (hover-gated).
 */
export function SpotlightCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn(
        "group/spot relative overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--spot-x, 50%) var(--spot-y, 50%), oklch(0.78 0.16 70 / 14%), transparent 65%)",
        }}
      />
      {children}
    </div>
  );
}

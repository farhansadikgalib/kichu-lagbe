"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";

/**
 * Thin page-scroll progress bar fixed to the top edge. Scrub-driven, so it
 * only moves with the user's own scrolling — safe for reduced motion.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: true },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed inset-x-0 top-0 z-60 h-0.5 origin-left scale-x-0 bg-primary"
    />
  );
}

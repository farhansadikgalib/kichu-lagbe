"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Vertical drift as a fraction of element height (0.05–0.15 recommended). */
  amount?: number;
}

/** Decorative scroll parallax. No-op for reduced-motion users. */
export function Parallax({ children, className, amount = 0.1 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          el,
          { yPercent: amount * 100 },
          {
            yPercent: -amount * 100,
            ease: "none",
            scrollTrigger: { trigger: el, scrub: true, start: "top bottom", end: "bottom top" },
          },
        );
      });
    },
    { scope: ref, dependencies: [amount] },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

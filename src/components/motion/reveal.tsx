"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { DURATION, EASE_GSAP, REVEAL } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in seconds before the reveal starts. */
  delay?: number;
  /** Stagger direct children instead of revealing as one block. */
  stagger?: boolean;
  as?: "div" | "section" | "span" | "li";
}

/**
 * Shared fade-up scroll reveal. Plays once when the element enters the
 * viewport; reduced-motion users get a simple fade.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  stagger = false,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = stagger ? Array.from(el.children) : el;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          targets,
          { opacity: 0, y: REVEAL.distance },
          {
            opacity: 1,
            y: 0,
            duration: DURATION.reveal,
            ease: EASE_GSAP.out,
            delay,
            stagger: stagger ? REVEAL.stagger : 0,
            scrollTrigger: { trigger: el, start: REVEAL.start, once: true },
          },
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.fromTo(
          targets,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DURATION.reveal,
            scrollTrigger: { trigger: el, start: REVEAL.start, once: true },
          },
        );
      });
    },
    { scope: ref, dependencies: [delay, stagger] },
  );

  const Comp = Tag as ElementType;
  return (
    <Comp ref={ref} className={cn(className)}>
      {children}
    </Comp>
  );
}

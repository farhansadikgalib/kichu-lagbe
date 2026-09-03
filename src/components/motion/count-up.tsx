"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion/gsap";

interface CountUpProps {
  /** Final value; renders immediately for reduced motion / no-JS. */
  value: number;
  /** Rendered before/after the number, animated as plain text. */
  prefix?: string;
  suffix?: string;
}

/** Number that counts from 0 to `value` when scrolled into view. */
export function CountUp({ value, prefix = "", suffix = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const counter = { n: 0 };
        el.textContent = `${prefix}0${suffix}`;
        gsap.to(counter, {
          n: value,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = `${prefix}${Math.round(counter.n)}${suffix}`;
          },
        });
      });
    },
    { scope: ref },
  );

  return <span ref={ref}>{`${prefix}${value}${suffix}`}</span>;
}

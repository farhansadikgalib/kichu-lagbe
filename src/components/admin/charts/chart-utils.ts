"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { animate, useReducedMotion } from "motion/react";
import { EASE_MOTION } from "@/lib/motion/tokens";

/** Width of a container element, updated on resize — charts render at real pixel size. */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/**
 * Clean axis ticks from 0 to a rounded upper bound that covers `max`
 * (1 / 2 / 2.5 / 5 × a power of ten), so labels read as 0 / 500 / 1,000.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return Array.from({ length: count + 1 }, (_, i) => i);
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  const step = factor * magnitude;
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}

/** Animates a number from its previous value to `target`; snaps when motion is reduced. */
export function useCountUp(target: number, duration = 1.1) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(target);
  const from = useRef(0);

  useEffect(() => {
    const controls = animate(from.current, target, {
      duration: reduce ? 0 : duration,
      ease: EASE_MOTION.out,
      onUpdate: (v) => setValue(v),
    });
    from.current = target;
    return () => controls.stop();
  }, [target, duration, reduce]);

  return value;
}

/**
 * Pointer + keyboard hover for charts with `count` evenly spaced X slots:
 * pointer snaps to the nearest slot, arrows move it, focus lands on the last.
 */
export function useSlotHover(count: number, left: number, slotWidth: number, centered = false) {
  const [active, setActive] = useState<number | null>(null);

  function fromPointer(event: PointerEvent<SVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - left;
    const raw = centered ? Math.floor(x / slotWidth) : Math.round(x / slotWidth);
    setActive(Math.max(0, Math.min(count - 1, raw)));
  }

  function fromKey(event: KeyboardEvent<SVGElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? -1 : 1;
    setActive((current) => Math.max(0, Math.min(count - 1, (current ?? count - 1) + delta)));
  }

  return {
    active,
    handlers: {
      onPointerMove: fromPointer,
      onPointerDown: fromPointer,
      onPointerLeave: () => setActive(null),
      onKeyDown: fromKey,
      onFocus: () => setActive(count - 1),
      onBlur: () => setActive(null),
    },
  };
}

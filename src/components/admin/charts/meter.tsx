"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_MOTION } from "@/lib/motion/tokens";

interface MeterProps {
  label: string;
  /** 0–100, or null when there is nothing to measure yet. */
  percent: number | null;
  /** Small print under the label, e.g. "6 of 6 timed deliveries". */
  detail: string;
}

/** A single ratio against a limit: accent fill on a lighter step of the same ramp. */
export function Meter({ label, percent, detail }: MeterProps) {
  const reduce = useReducedMotion();
  const value = percent === null ? 0 : Math.max(0, Math.min(100, percent));

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">
          {percent === null ? "—" : `${Math.round(percent)}%`}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent === null ? undefined : Math.round(percent)}
        className="h-2 w-full overflow-hidden rounded-full bg-primary/15"
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: EASE_MOTION.out }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

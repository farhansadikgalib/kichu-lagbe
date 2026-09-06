"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_MOTION, REVEAL } from "@/lib/motion/tokens";

export interface RankedRow {
  label: string;
  value: number;
  /** Secondary detail shown after the label, e.g. "12 sold". */
  detail?: string;
}

interface RankedBarsProps {
  rows: RankedRow[];
  formatValue: (value: number) => string;
  emptyMessage: string;
}

/** Horizontal single-hue bars, longest first, value at the tip; bars grow in with a stagger. */
export function RankedBars({ rows, formatValue, emptyMessage }: RankedBarsProps) {
  const reduce = useReducedMotion();
  const max = Math.max(...rows.map((r) => r.value), 1);

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="space-y-3">
      {/* Labels can collide (two customers with the same name); rank disambiguates. */}
      {rows.map((row, i) => (
        <li key={`${i}-${row.label}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {row.label}
              {row.detail ? (
                <span className="ml-1.5 text-xs text-muted-foreground">{row.detail}</span>
              ) : null}
            </span>
            <span className="shrink-0 font-medium tabular-nums">{formatValue(row.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${(row.value / max) * 100}%` }}
              transition={{ duration: 0.8, ease: EASE_MOTION.out, delay: i * REVEAL.stagger }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

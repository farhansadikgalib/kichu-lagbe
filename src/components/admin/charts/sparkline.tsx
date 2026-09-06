"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  className?: string;
}

const W = 96;
const H = 28;
const PAD = 4;

/** Twelve-point trend for a stat tile: de-emphasised line, current point in the accent. */
export function Sparkline({ values, className }: SparklineProps) {
  const reduce = useReducedMotion();
  if (values.length < 2) return null;

  const max = Math.max(...values, 1);
  const stepX = (W - PAD * 2) / (values.length - 1);
  const points = values.map((v, i) => ({
    x: PAD + i * stepX,
    y: PAD + (H - PAD * 2) * (1 - v / max),
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className={cn("shrink-0 overflow-visible", className)}
      aria-hidden
    >
      <motion.path
        d={path}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-muted-foreground/50"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <motion.circle
        cx={last.x}
        cy={last.y}
        r={3.5}
        className="fill-primary stroke-card"
        strokeWidth={2}
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      />
    </svg>
  );
}

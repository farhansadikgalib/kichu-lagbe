"use client";

import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_MOTION } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "./chart-tooltip";
import { niceTicks, useMeasure, useSlotHover } from "./chart-utils";

interface ColumnChartProps {
  values: number[];
  /** Axis label for slot `i`; return null to skip that tick. */
  label: (i: number) => string | null;
  /** Tooltip heading for slot `i`. */
  title: (i: number) => string;
  /** Singular noun for the tooltip readout, e.g. "order". */
  unit: string;
  ariaLabel: string;
  /** Slots that carry the accent; others fall back to grey (emphasis form). */
  emphasis?: (i: number) => boolean;
  /** Legend shown under the plot when `emphasis` is used. */
  legend?: ReactNode;
  height?: number;
}

const PAD = { top: 16, right: 8, bottom: 24, left: 28 };
const MAX_BAR = 24;

/**
 * Single-series columns over evenly spaced slots (hours, weekdays). Columns
 * rise on mount with a stagger; hover or arrow keys read out one slot; the
 * peak carries the only direct label. A hidden table mirrors the values.
 */
export function ColumnChart({
  values,
  label,
  title,
  unit,
  ariaLabel,
  emphasis,
  legend,
  height = 180,
}: ColumnChartProps) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const reduce = useReducedMotion();
  const clipId = useId();

  const n = values.length;
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const slotW = n ? innerW / n : 0;
  const barW = Math.min(MAX_BAR, Math.max(2, slotW - 4));
  const { active, handlers } = useSlotHover(n, PAD.left, slotW, true);

  const ticks = niceTicks(Math.max(...values, 0), 2);
  const yMax = ticks[ticks.length - 1];
  const baseline = PAD.top + innerH;
  const x = (i: number) => PAD.left + i * slotW + (slotW - barW) / 2;
  const h = (v: number) => (v / yMax) * innerH;

  const peakValue = Math.max(...values);
  const peak = peakValue > 0 ? values.indexOf(peakValue) : -1;

  return (
    <div className="space-y-3">
      <div ref={ref} className="relative w-full">
        {width > 0 ? (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={ariaLabel}
            tabIndex={0}
            className="block touch-none overflow-visible outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring/50"
            {...handlers}
          >
            <defs>
              {/* Bars extend past the baseline so only their tops are rounded. */}
              <clipPath id={clipId}>
                <rect x={0} y={0} width={width} height={baseline} />
              </clipPath>
            </defs>

            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={baseline - h(tick)}
                  y2={baseline - h(tick)}
                  className="stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 6}
                  y={baseline - h(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {tick}
                </text>
              </g>
            ))}

            {values.map((_, i) => {
              const text = label(i);
              return text ? (
                <text
                  key={i}
                  x={PAD.left + i * slotW + slotW / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {text}
                </text>
              ) : null;
            })}

            <g clipPath={`url(#${clipId})`}>
              {values.map((value, i) => (
                <motion.rect
                  key={i}
                  x={x(i)}
                  width={barW}
                  rx={3}
                  className={cn(
                    "transition-opacity",
                    !emphasis || emphasis(i) ? "fill-primary" : "fill-muted-foreground/40",
                    active !== null && active !== i && "opacity-60",
                  )}
                  initial={reduce ? false : { y: baseline, height: 0 }}
                  animate={{ y: baseline - h(value), height: h(value) + 4 }}
                  transition={{ duration: 0.8, ease: EASE_MOTION.out, delay: i * 0.02 }}
                />
              ))}
            </g>

            {peak >= 0 && active !== peak ? (
              <motion.text
                x={x(peak) + barW / 2}
                y={baseline - h(peakValue) - 6}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-medium tabular-nums"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                {peakValue}
              </motion.text>
            ) : null}
          </svg>
        ) : (
          <div style={{ height }} />
        )}

        {active !== null && width > 0 ? (
          <ChartTooltip
            x={x(active) + barW / 2}
            width={width}
            title={title(active)}
            rows={[{ label: values[active] === 1 ? unit : `${unit}s`, value: String(values[active]) }]}
          />
        ) : null}
      </div>

      {legend}

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <tbody>
          {values.map((value, i) => (
            <tr key={i}>
              <td>{title(i)}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

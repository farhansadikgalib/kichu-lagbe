"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatBDT, formatCompactBDT, formatDayLong, formatDayShort } from "@/lib/format";
import type { StatsPoint } from "@/types";
import { ChartTooltip } from "./chart-tooltip";
import { niceTicks, useMeasure, useSlotHover } from "./chart-utils";

export type TrendMetric = "revenue" | "orders";

interface TrendChartProps {
  series: StatsPoint[];
  metric: TrendMetric;
}

const HEIGHT = 240;
const PAD = { top: 20, right: 16, bottom: 28, left: 48 };

const METRIC = {
  revenue: { label: "Revenue", tick: formatCompactBDT, full: formatBDT },
  orders: { label: "Orders", tick: (n: number) => String(n), full: (n: number) => String(n) },
} as const;

/**
 * Single-series area chart of the reporting window. The line draws itself on
 * mount; a crosshair follows the pointer (or arrow keys) and reads out both
 * metrics for that day. A visually hidden table carries the same values.
 */
export function TrendChart({ series, metric }: TrendChartProps) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const reduce = useReducedMotion();
  const gradientId = useId();

  const n = series.length;
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const stepX = n > 1 ? innerW / (n - 1) : innerW;
  const { active, handlers } = useSlotHover(n, PAD.left, stepX);

  const values = series.map((p) => p[metric]);
  const ticks = niceTicks(Math.max(...values, 0));
  const yMax = ticks[ticks.length - 1];
  const x = (i: number) => PAD.left + (n > 1 ? i * stepX : innerW / 2);
  const y = (v: number) => PAD.top + innerH * (1 - v / yMax);

  const linePath = series.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p[metric])}`).join(" ");
  const areaPath = `${linePath} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  const peakValue = Math.max(...values);
  const peak = peakValue > 0 ? values.indexOf(peakValue) : -1;
  const labelEvery = Math.max(1, Math.ceil(n / 6));
  const format = METRIC[metric];

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 ? (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${format.label} by day`}
          tabIndex={0}
          className="block touch-none overflow-visible outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring/50"
          {...handlers}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="[stop-color:var(--primary)]" stopOpacity={0.22} />
              <stop offset="100%" className="[stop-color:var(--primary)]" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Gridlines + y ticks */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {format.tick(tick)}
              </text>
            </g>
          ))}

          {/* X labels — counted back from today so the last day is always labelled */}
          {series.map((p, i) =>
            (n - 1 - i) % labelEvery === 0 ? (
              <text
                key={p.date}
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                className="fill-muted-foreground text-[10px]"
              >
                {formatDayShort(p.date)}
              </text>
            ) : null,
          )}

          {/* Area wash + line */}
          <motion.path
            key={`area-${metric}-${n}`}
            d={areaPath}
            fill={`url(#${gradientId})`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          />
          <motion.path
            key={`line-${metric}-${n}`}
            d={linePath}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-primary"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />

          {/* Peak label — the one direct label */}
          {peak >= 0 && active !== peak ? (
            <motion.g
              key={`peak-${metric}-${n}`}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.4 }}
            >
              <circle cx={x(peak)} cy={y(peakValue)} r={4} className="fill-primary stroke-card" strokeWidth={2} />
              <text
                x={x(peak)}
                y={y(peakValue) - 10}
                textAnchor={peak === 0 ? "start" : peak === n - 1 ? "end" : "middle"}
                className="fill-foreground text-[11px] font-medium tabular-nums"
              >
                {format.full(peakValue)}
              </text>
            </motion.g>
          ) : null}

          {/* Crosshair */}
          {active !== null ? (
            <g>
              <line
                x1={x(active)}
                x2={x(active)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                className="stroke-foreground/30"
                strokeWidth={1}
              />
              <circle
                cx={x(active)}
                cy={y(series[active][metric])}
                r={5}
                className="fill-primary stroke-card"
                strokeWidth={2}
              />
            </g>
          ) : null}
        </svg>
      ) : (
        <div style={{ height: HEIGHT }} />
      )}

      {active !== null && width > 0 ? (
        <ChartTooltip
          x={x(active)}
          width={width}
          title={formatDayLong(series[active].date)}
          rows={[
            { label: "revenue", value: formatBDT(series[active].revenue), swatchClass: "bg-primary" },
            { label: "orders", value: String(series[active].orders), swatchClass: "bg-muted-foreground" },
          ]}
        />
      ) : null}

      <table className="sr-only">
        <caption>{format.label} by day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {series.map((p) => (
            <tr key={p.date}>
              <td>{formatDayLong(p.date)}</td>
              <td>{formatBDT(p.revenue)}</td>
              <td>{p.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

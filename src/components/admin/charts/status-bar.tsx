"use client";

import { motion, useReducedMotion } from "motion/react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatBDT } from "@/lib/format";
import { EASE_MOTION } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import type { AdminStats, OrderStatus } from "@/types";

/**
 * Mark colors for the status stack. Validated against the dark card surface
 * for colorblind separation; the legend and counts are the backup channel.
 */
const STATUS_MARK: Record<OrderStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-sky-400",
  picked_up: "bg-purple-500",
  delivered: "bg-emerald-400",
  cancelled: "bg-red-500",
};

interface StatusBarProps {
  byStatus: AdminStats["byStatus"];
}

/** Part-to-whole stack of the window's orders by status, with a legend of counts. */
export function StatusBar({ byStatus }: StatusBarProps) {
  const reduce = useReducedMotion();
  const total = byStatus.reduce((sum, s) => sum + s.count, 0);
  const share = (count: number) => (total ? (count / total) * 100 : 0);

  return (
    <div className="space-y-4">
      <div
        role="img"
        aria-label={`${total} orders by status`}
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted/60"
      >
        {byStatus
          .filter((s) => s.count > 0)
          .map((s, i) => (
            <motion.div
              key={s.status}
              title={`${ORDER_STATUS_LABELS[s.status]}: ${s.count} (${Math.round(share(s.count))}%)`}
              className={cn("h-full min-w-0.5 rounded-[2px] transition-opacity hover:opacity-80", STATUS_MARK[s.status])}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${share(s.count)}%` }}
              transition={{ duration: 0.9, ease: EASE_MOTION.out, delay: i * 0.06 }}
            />
          ))}
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {byStatus.map((s) => (
          <li key={s.status} className="flex items-center gap-2">
            <span className={cn("size-2.5 shrink-0 rounded-sm", STATUS_MARK[s.status])} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {ORDER_STATUS_LABELS[s.status]}
            </span>
            <span className="font-medium tabular-nums">{s.count}</span>
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
              {Math.round(share(s.count))}%
            </span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>Orders by status</caption>
        <tbody>
          {byStatus.map((s) => (
            <tr key={s.status}>
              <td>{ORDER_STATUS_LABELS[s.status]}</td>
              <td>{s.count}</td>
              <td>{formatBDT(s.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

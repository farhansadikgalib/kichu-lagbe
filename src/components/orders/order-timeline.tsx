"use client";

import { motion, useReducedMotion } from "motion/react";
import { Bike, CheckCircle2, PackageCheck, ReceiptText, XCircle } from "lucide-react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STEP_ICONS = {
  pending: ReceiptText,
  confirmed: CheckCircle2,
  picked_up: Bike,
  delivered: PackageCheck,
} as const;

interface OrderTimelineProps {
  status: OrderStatus;
}

/** Horizontal status stepper following ORDER_STATUS_FLOW, with a pulsing current step. */
export function OrderTimeline({ status }: OrderTimelineProps) {
  const reducedMotion = useReducedMotion();

  if (status === "cancelled") {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3"
      >
        <XCircle className="size-5 shrink-0 text-destructive" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-destructive">Order cancelled</p>
          <p className="text-xs text-muted-foreground">
            This order was cancelled and will not be delivered.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(
    status as (typeof ORDER_STATUS_FLOW)[number],
  );

  return (
    <ol className="flex" aria-label="Order progress">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const Icon = STEP_ICONS[step];
        const isDone = index < currentIndex || status === "delivered";
        const isCurrent = index === currentIndex;
        return (
          <li
            key={step}
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex flex-1 flex-col items-center gap-2"
          >
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-[18px] right-1/2 h-0.5 w-full",
                  index <= currentIndex ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-9 items-center justify-center rounded-full border transition-colors duration-200",
                isDone && "border-primary bg-primary text-primary-foreground",
                isCurrent &&
                  !isDone &&
                  "border-primary bg-primary/10 text-primary",
                !isDone && !isCurrent && "border-border bg-background text-muted-foreground",
              )}
            >
              {isCurrent && status !== "delivered" && !reducedMotion && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <Icon className="size-4" aria-hidden />
            </span>
            <span
              className={cn(
                "text-center text-xs font-medium",
                isDone || isCurrent ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {ORDER_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

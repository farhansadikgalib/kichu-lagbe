"use client";

import { SERVICE } from "@/lib/constants";
import { useCountUp } from "./chart-utils";
import { Meter } from "./meter";
import type { AdminStats } from "@/types";

interface DeliveryPerformanceProps {
  delivery: AdminStats["delivery"];
  delivered: number;
  cancelled: number;
}

/** Speed and reliability of fulfilment in the window: average time and two ratios. */
export function DeliveryPerformance({ delivery, delivered, cancelled }: DeliveryPerformanceProps) {
  const avg = useCountUp(delivery.avgMinutes ?? 0);
  const closed = delivered + cancelled;
  const onTimePct = delivery.timed ? (delivery.onTime / delivery.timed) * 100 : null;
  const fulfilmentPct = closed ? (delivered / closed) * 100 : null;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Average delivery time</p>
        <p className="mt-0.5 text-3xl font-semibold tracking-tight">
          {delivery.avgMinutes === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <>
              {Math.round(avg)} <span className="text-base font-normal text-muted-foreground">min</span>
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {delivery.timed
            ? `Across ${delivery.timed} timed ${delivery.timed === 1 ? "delivery" : "deliveries"}`
            : "No timed deliveries yet"}
        </p>
      </div>

      <Meter
        label={`Delivered within ${SERVICE.avgDeliveryMinutes} min`}
        percent={onTimePct}
        detail={
          delivery.timed
            ? `${delivery.onTime} of ${delivery.timed} timed deliveries`
            : "Needs at least one timed delivery"
        }
      />

      <Meter
        label="Fulfilment rate"
        percent={fulfilmentPct}
        detail={
          closed
            ? `${delivered} delivered · ${cancelled} cancelled`
            : "No orders closed in this window"
        }
      />
    </div>
  );
}

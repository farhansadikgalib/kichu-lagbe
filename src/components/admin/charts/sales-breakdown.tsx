"use client";

import { formatBDT } from "@/lib/format";
import { RankedBars } from "./ranked-bars";
import type { AdminStats } from "@/types";

interface SalesBreakdownProps {
  breakdown: AdminStats["breakdown"];
  delivered: number;
}

/** What delivered revenue is made of: items, delivery fees, and discounts taken off. */
export function SalesBreakdown({ breakdown, delivered }: SalesBreakdownProps) {
  const couponShare = delivered ? Math.round((breakdown.couponOrders / delivered) * 100) : 0;

  return (
    <div className="space-y-4">
      <RankedBars
        rows={[
          { label: "Items", value: breakdown.subtotal },
          { label: "Delivery charges", value: breakdown.deliveryCharges },
          {
            label: "Discounts",
            value: breakdown.discounts,
            detail: breakdown.couponOrders
              ? `${breakdown.couponOrders} ${breakdown.couponOrders === 1 ? "order" : "orders"} · ${couponShare}%`
              : undefined,
          },
        ]}
        formatValue={formatBDT}
        emptyMessage="Nothing delivered in this window yet."
      />
      <div className="flex items-baseline justify-between border-t border-border/60 pt-3 text-sm">
        <span className="text-muted-foreground">Items + delivery − discounts</span>
        <span className="font-semibold tabular-nums">{formatBDT(breakdown.total)}</span>
      </div>
    </div>
  );
}

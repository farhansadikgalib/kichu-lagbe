import type { OrderWithItems } from "@/types";
import { formatBDT } from "@/lib/format";

function isToday(value: string | Date) {
  return new Date(value).toDateString() === new Date().toDateString();
}

interface EarningsStripProps {
  /** The rider's order queue (available + mine) as returned by /api/rider/orders. */
  orders: OrderWithItems[];
}

/**
 * Today's collections summary, computed client-side from the orders this
 * rider delivered today (COD totals). Labelled as such — it is a quick
 * on-shift tally, not an accounting report.
 */
export function EarningsStrip({ orders }: EarningsStripProps) {
  const deliveredToday = orders.filter(
    (o) => o.status === "delivered" && o.riderId !== null && isToday(o.deliveredAt ?? o.createdAt),
  );
  const active = orders.filter(
    (o) => o.riderId !== null && (o.status === "confirmed" || o.status === "picked_up"),
  );
  const collected = deliveredToday.reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: "Collected today", value: formatBDT(collected), highlight: true },
    { label: "Delivered today", value: String(deliveredToday.length) },
    { label: "Active now", value: String(active.length) },
  ];

  return (
    <section aria-label="Today's earnings summary" className="rounded-xl border border-border/60 bg-card">
      <dl className="grid grid-cols-3 divide-x divide-border/60">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5 px-3 py-3 text-center sm:px-4">
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className={`text-lg font-bold tabular-nums ${stat.highlight ? "text-primary" : ""}`}>
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-border/60 px-3 py-1.5 text-center text-[11px] text-muted-foreground">
        Counted from your delivered orders today (COD totals).
      </p>
    </section>
  );
}

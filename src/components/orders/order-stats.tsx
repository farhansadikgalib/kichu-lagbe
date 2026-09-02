import { Package, Truck, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatBDT } from "@/lib/format";
import type { OrderWithItems } from "@/types";

const ACTIVE_STATUSES = ["pending", "confirmed", "picked_up"] as const;

interface OrderStatsProps {
  orders: OrderWithItems[];
}

/** Stats row: total orders, total spent (delivered orders), and active orders. */
export function OrderStats({ orders }: OrderStatsProps) {
  const delivered = orders.filter((o) => o.status === "delivered");
  const totalSpent = delivered.reduce((sum, o) => sum + o.total, 0);
  const activeCount = orders.filter((o) =>
    (ACTIVE_STATUSES as readonly string[]).includes(o.status),
  ).length;

  const stats = [
    { label: "Total orders", value: String(orders.length), icon: Package },
    { label: "Total spent", value: formatBDT(totalSpent), icon: Wallet },
    { label: "Active orders", value: String(activeCount), icon: Truck },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden />
            </span>
            <div>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-lg font-semibold tabular-nums">{value}</dd>
            </div>
          </CardContent>
        </Card>
      ))}
    </dl>
  );
}

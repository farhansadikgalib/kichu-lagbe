import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatBDT, formatDate, formatOrderNumber } from "@/lib/format";
import type { OrderWithItems } from "@/types";

interface OrderCardProps {
  order: OrderWithItems;
}

/** Compact order row card linking to the order detail page. */
export function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Order ${formatOrderNumber(order.orderNumber)}, ${formatBDT(order.total)}`}
    >
      <Card className="transition-colors duration-200 group-hover:border-primary/40">
        <CardContent className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{formatOrderNumber(order.orderNumber)}</p>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(order.createdAt)} · {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <p className="font-semibold tabular-nums">{formatBDT(order.total)}</p>
            <ChevronRight
              className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

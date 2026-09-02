import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  confirmed: "bg-sky-500/15 text-sky-400",
  picked_up: "bg-violet-500/15 text-violet-400",
  delivered: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-destructive/15 text-destructive",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

/** Status pill with a consistent per-status color, shared by list and detail views. */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge className={cn(STATUS_CLASSES[status], className)}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}

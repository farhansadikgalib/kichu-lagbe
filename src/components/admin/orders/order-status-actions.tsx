"use client";

import { useState } from "react";
import { Check, Loader2, MoreHorizontal, RotateCcw, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/form-dialog";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatOrderNumber } from "@/lib/format";
import { ADVANCE_LABELS, isClosedStatus, nextOrderStatus, ORDER_STATUSES } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { AdminOrder, OrderStatus } from "@/types";

interface OrderStatusActionsProps {
  order: AdminOrder;
  pending: boolean;
  onStatus: (status: OrderStatus) => Promise<void>;
  /** `lg` for the detail panel, `sm` for table rows. */
  size?: "sm" | "lg";
  className?: string;
}

/**
 * One-click "next step" button (Confirm → Picked up → Delivered) plus a menu
 * for the exceptions: cancel (with confirmation), step back, or jump to any
 * status. Closed orders only offer reopening.
 */
export function OrderStatusActions({
  order,
  pending,
  onStatus,
  size = "sm",
  className,
}: OrderStatusActionsProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = nextOrderStatus(order.status);
  const closed = isClosedStatus(order.status);
  const number = formatOrderNumber(order.orderNumber);

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {next ? (
        <Button
          type="button"
          size={size}
          disabled={pending}
          aria-busy={pending}
          onClick={() => void onStatus(next)}
          aria-label={`${ADVANCE_LABELS[order.status]} order ${number}`}
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
          {ADVANCE_LABELS[order.status]}
        </Button>
      ) : (
        closed && (
          <Button
            type="button"
            size={size}
            variant="outline"
            disabled={pending}
            onClick={() => void onStatus(order.status === "cancelled" ? "pending" : "picked_up")}
            aria-label={`Reopen order ${number}`}
          >
            <RotateCcw aria-hidden /> Reopen
          </Button>
        )
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size={size === "lg" ? "icon" : "icon-sm"}
            disabled={pending}
            aria-label={`More actions for order ${number}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!closed && (
            <>
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmCancel(true)}>
                <XCircle /> Cancel order
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel>Set status</DropdownMenuLabel>
          {ORDER_STATUSES.map((status) => (
            <DropdownMenuItem
              key={status}
              disabled={status === order.status}
              onSelect={() => {
                if (status === "cancelled") setConfirmCancel(true);
                else void onStatus(status);
              }}
            >
              <OrderStatusBadge status={status} />
              {status === order.status && <Check className="ml-auto" aria-hidden />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={`Cancel order ${number}?`}
        description={`${order.customerName} will be notified that the order was cancelled. You can reopen it later if needed.`}
        confirmLabel="Cancel order"
        isPending={pending}
        onConfirm={async () => {
          await onStatus("cancelled");
          setConfirmCancel(false);
        }}
      />
    </div>
  );
}

/** Compact label used where the button does not fit: what happens next. */
export function nextStepHint(status: OrderStatus) {
  const next = nextOrderStatus(status);
  return next ? `Next: ${ORDER_STATUS_LABELS[next].toLowerCase()}` : null;
}

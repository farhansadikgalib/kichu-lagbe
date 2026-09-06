"use client";

import type { ReactNode } from "react";
import { MapPinIcon, PhoneIcon, ReceiptTextIcon, StickyNoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatBDT, formatDate, formatLineName, formatOrderNumber } from "@/lib/format";
import type { OrderWithItems } from "@/types";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PriceSummary } from "@/components/orders/price-summary";

interface RiderOrderCardProps {
  order: OrderWithItems;
  /** Workflow buttons for this order's current state (omit for read-only cards). */
  actions?: ReactNode;
}

/**
 * Delivery card for the rider workboard: who, where, what, and how much cash
 * to collect — with the full item breakdown one tap away.
 */
export function RiderOrderCard({ order, actions }: RiderOrderCardProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsSummary = order.items.map((item) => `${formatLineName(item)} ×${item.quantity}`).join(", ");
  const collectCod = order.status === "confirmed" || order.status === "picked_up";

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{formatOrderNumber(order.orderNumber)}</p>
          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{order.customerName}</span>
          <a
            href={`tel:${order.phone}`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-secondary px-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            aria-label={`Call ${order.customerName} at ${order.phone}`}
          >
            <PhoneIcon aria-hidden className="size-3.5" />
            {order.phone}
          </a>
        </div>
        <p className="flex gap-1.5 text-muted-foreground">
          <MapPinIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>{order.addressDetails}</span>
        </p>
        {order.note && (
          <p className="flex gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-amber-400">
            <StickyNoteIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>{order.note}</span>
          </p>
        )}
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-2 text-sm">
        <p className="truncate text-muted-foreground">
          {itemCount} item{itemCount === 1 ? "" : "s"} · {itemsSummary}
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              <ReceiptTextIcon aria-hidden data-icon="inline-start" />
              Items
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order {formatOrderNumber(order.orderNumber)}</DialogTitle>
              <DialogDescription>
                {itemCount} item{itemCount === 1 ? "" : "s"} for {order.customerName}
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {formatLineName(item)}
                    <span className="text-muted-foreground">
                      {" "}
                      × {item.quantity} @ {formatBDT(item.unitPrice)}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">{formatBDT(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <Separator />
            <PriceSummary
              subtotal={order.subtotal}
              deliveryCharge={order.deliveryCharge}
              discount={order.discount}
              couponCode={order.couponCode}
              total={order.total}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Total</p>
        {collectCod ? (
          <p className="rounded-lg bg-primary/15 px-3 py-1.5 text-sm font-bold text-primary">
            Collect COD {formatBDT(order.total)}
          </p>
        ) : (
          <p className="text-sm font-bold tabular-nums">{formatBDT(order.total)}</p>
        )}
      </div>

      {actions && <div className="flex gap-2 pt-1">{actions}</div>}
    </Card>
  );
}

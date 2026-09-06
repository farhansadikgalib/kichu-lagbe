"use client";

import { Copy, ExternalLink, MapPin, Phone, StickyNote, Wallet } from "lucide-react";
import { toast } from "sonner";
import { OrderItemsTable } from "@/components/orders/order-items-table";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { PriceSummary } from "@/components/orders/price-summary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatDate, formatOrderNumber, formatRelativeTime } from "@/lib/format";
import { formatAccuracy, mapsViewUrl } from "@/lib/maps";
import type { AdminOrder, User } from "@/types";
import { OrderStatusActions } from "./order-status-actions";
import { RiderSelect } from "./rider-select";
import type { OrderActions } from "./use-order-actions";

interface OrderDetailSheetProps {
  /** The live row from the list, so mutations are reflected while open. */
  order: AdminOrder | null;
  riders: User[] | undefined;
  actions: OrderActions;
  onOpenChange: (open: boolean) => void;
}

async function copy(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied.`);
  } catch {
    toast.error(`Couldn't copy the ${label.toLowerCase()}.`);
  }
}

/**
 * Slide-over with everything about one order: progress, the next action,
 * rider, who and where (with call / copy), items and money.
 */
export function OrderDetailSheet({ order, riders, actions, onOpenChange }: OrderDetailSheetProps) {
  return (
    <Sheet open={order !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {order && <Detail order={order} riders={riders} actions={actions} />}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ order, riders, actions }: { order: AdminOrder; riders: User[] | undefined; actions: OrderActions }) {
  const pending = actions.pendingId === order.id;
  const number = formatOrderNumber(order.orderNumber);
  const paymentLabel =
    PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label ?? order.paymentMethod;

  return (
    <>
      <SheetHeader className="border-b border-border/60 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <SheetTitle className="text-lg">Order {number}</SheetTitle>
          <OrderStatusBadge status={order.status} />
        </div>
        <SheetDescription>
          Placed {formatRelativeTime(order.createdAt)} · {formatDate(order.createdAt)}
          {order.deliveredAt && ` · Delivered ${formatDate(order.deliveredAt)}`}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-5 py-5">
        <OrderTimeline status={order.status} />

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>Rider</Label>
            <RiderSelect
              order={order}
              riders={riders}
              pending={pending}
              size="default"
              onAssign={(riderId) => actions.assignRider(order, riderId)}
            />
          </div>
          <OrderStatusActions
            order={order}
            pending={pending}
            size="lg"
            onStatus={(status) => actions.setStatus(order, status)}
          />
        </div>

        <section aria-labelledby={`${order.id}-customer`} className="rounded-lg border border-border/60 bg-muted/30 p-4">
          <h3 id={`${order.id}-customer`} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Deliver to
          </h3>
          <p className="mt-2 font-medium">{order.customerName}</p>
          {order.user.name !== order.customerName && (
            <p className="text-xs text-muted-foreground">Account: {order.user.name} · {order.user.email}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${order.phone}`}>
                <Phone data-icon="inline-start" aria-hidden /> {order.phone}
              </a>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => void copy("Phone", order.phone)}>
              <Copy data-icon="inline-start" aria-hidden /> Copy
            </Button>
          </div>
          <div className="mt-3 flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p className="flex-1">{order.addressDetails}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Copy address"
              onClick={() => void copy("Address", order.addressDetails)}
            >
              <Copy />
            </Button>
          </div>
          {order.latitude != null && order.longitude != null && (
            <Button asChild variant="outline" size="sm" className="mt-2">
              <a href={mapsViewUrl(order.latitude, order.longitude)} target="_blank" rel="noreferrer">
                <ExternalLink data-icon="inline-start" aria-hidden />
                Pinned location
                {order.locationAccuracy != null && (
                  <span className="text-muted-foreground">{formatAccuracy(order.locationAccuracy)}</span>
                )}
              </a>
            </Button>
          )}
          {order.note && (
            <p className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
              <StickyNote className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
              <span>
                <span className="font-medium text-amber-400">Customer note: </span>
                {order.note}
              </span>
            </p>
          )}
        </section>

        <section aria-labelledby={`${order.id}-items`}>
          <h3 id={`${order.id}-items`} className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Items
          </h3>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <OrderItemsTable items={order.items} />
          </div>
        </section>

        <section aria-labelledby={`${order.id}-payment`} className="rounded-lg border border-border/60 p-4">
          <h3 id={`${order.id}-payment`} className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Wallet className="size-3.5" aria-hidden /> {paymentLabel}
          </h3>
          <PriceSummary
            subtotal={order.subtotal}
            deliveryCharge={order.deliveryCharge}
            discount={order.discount}
            couponCode={order.couponCode}
            total={order.total}
          />
        </section>
      </div>
    </>
  );
}

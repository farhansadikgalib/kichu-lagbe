"use client";

import Link from "next/link";
import { ArrowLeft, PackageSearch, Phone } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion";
import { OrderItemsTable } from "@/components/orders/order-items-table";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { PriceSummary } from "@/components/orders/price-summary";
import { NotificationPermissionButton } from "@/components/pwa/notification-permission-button";
import { useNotificationPrompt } from "@/hooks/use-notification-permission";
import { useOrder } from "@/hooks/use-orders";
import { isClosedStatus } from "@/lib/order-status";
import { FetchError } from "@/lib/api/fetcher";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatDate, formatOrderNumber } from "@/lib/format";

interface OrderDetailProps {
  id: string;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Order tracking page: live status timeline, items, price breakdown, and rider info. */
export function OrderDetail({ id }: OrderDetailProps) {
  const { data: order, error, isLoading, mutate } = useOrder(id);
  useNotificationPrompt("this order", Boolean(order && !isClosedStatus(order.status)));

  if (isLoading) {
    return (
      <div className="container-page py-8 md:py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-28 w-full" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-64 w-full" />
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    const notFound = error instanceof FetchError && error.status === 404;
    return (
      <div className="container-page py-8 md:py-12">
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <PackageSearch className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-semibold">
                {notFound ? "Order not found" : "Couldn't load this order"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {notFound
                  ? "This order doesn't exist or doesn't belong to your account."
                  : "Something went wrong while loading the order."}
              </p>
            </div>
            <div className="flex gap-2">
              {!notFound && (
                <Button variant="outline" size="sm" onClick={() => mutate()}>
                  Try again
                </Button>
              )}
              <Button asChild size="sm">
                <Link href="/orders">
                  <ArrowLeft /> Back to orders
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paymentLabel =
    PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label ??
    order.paymentMethod;

  return (
    <div className="container-page py-8 md:py-12">
      <Reveal>
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/orders">
            <ArrowLeft /> Back to orders
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Order {formatOrderNumber(order.orderNumber)}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Placed {formatDate(order.createdAt)}
          {order.deliveredAt ? ` · Delivered ${formatDate(order.deliveredAt)}` : ""}
        </p>
      </Reveal>

      <Reveal className="mt-6">
        <Card>
          <CardContent>
            <OrderTimeline status={order.status} />
            {!isClosedStatus(order.status) && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-sm text-muted-foreground">
                  This page updates live. Want a heads-up when you&apos;re on another tab?
                </p>
                <NotificationPermissionButton subject="this order" />
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderItemsTable items={order.items} />
            </CardContent>
          </Card>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={0.05}>
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>{paymentLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                <PriceSummary
                  subtotal={order.subtotal}
                  deliveryCharge={order.deliveryCharge}
                  discount={order.discount}
                  couponCode={order.couponCode}
                  total={order.total}
                />
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Delivery details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Recipient</dt>
                    <dd className="mt-0.5 font-medium">{order.customerName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Phone</dt>
                    <dd className="mt-0.5 font-medium">{order.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Address</dt>
                    <dd className="mt-0.5">{order.addressDetails}</dd>
                  </div>
                  {order.note && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Note</dt>
                      <dd className="mt-0.5">{order.note}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </Reveal>

          {order.rider && (
            <Reveal delay={0.15}>
              <Card>
                <CardHeader>
                  <CardTitle>Your rider</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Avatar className="size-10 border border-border">
                    <AvatarFallback className="bg-secondary text-xs font-semibold">
                      {initialsOf(order.rider.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{order.rider.name}</p>
                    <p className="text-xs text-muted-foreground">Delivering your order</p>
                  </div>
                  {order.rider.phone && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${order.rider.phone}`}>
                        <Phone /> Call
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}

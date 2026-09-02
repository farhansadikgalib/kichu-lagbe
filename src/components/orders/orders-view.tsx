"use client";

import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "@/components/motion";
import { OrderCard } from "@/components/orders/order-card";
import { OrderStats } from "@/components/orders/order-stats";
import { useMyOrders } from "@/hooks/use-orders";
import type { OrderWithItems } from "@/types";

const ACTIVE_STATUSES = ["pending", "confirmed", "picked_up"] as const;

function OrderList({
  orders,
  emptyMessage,
  showBrowseCta = false,
}: {
  orders: OrderWithItems[];
  emptyMessage: string;
  showBrowseCta?: boolean;
}) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PackageOpen className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {showBrowseCta && (
            <Button asChild size="sm">
              <Link href="/">
                Browse products <ArrowRight />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <OrderCard order={order} />
        </li>
      ))}
    </ul>
  );
}

/** Orders page: stats row plus Active / Completed / Cancelled tabs. */
export function OrdersView() {
  const { data: orders, error, isLoading, mutate } = useMyOrders();

  const active =
    orders?.filter((o) => (ACTIVE_STATUSES as readonly string[]).includes(o.status)) ?? [];
  const completed = orders?.filter((o) => o.status === "delivered") ?? [];
  const cancelled = orders?.filter((o) => o.status === "cancelled") ?? [];

  return (
    <div className="container-page py-8 md:py-12">
      <Reveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track active deliveries and revisit your order history.
        </p>
      </Reveal>

      {isLoading && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )}

      {!isLoading && error && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load your orders. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && orders && (
        <div className="mt-6 space-y-6">
          <Reveal>
            <OrderStats orders={orders} />
          </Reveal>

          <Reveal delay={0.1}>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-4">
                <OrderList
                  orders={active}
                  emptyMessage="No active orders right now."
                  showBrowseCta
                />
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                <OrderList orders={completed} emptyMessage="No delivered orders yet." />
              </TabsContent>
              <TabsContent value="cancelled" className="mt-4">
                <OrderList orders={cancelled} emptyMessage="No cancelled orders — great!" />
              </TabsContent>
            </Tabs>
          </Reveal>
        </div>
      )}
    </div>
  );
}

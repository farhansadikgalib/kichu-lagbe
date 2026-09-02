"use client";

import useSWR from "swr";
import { toast } from "sonner";
import { InboxIcon, PackageCheckIcon, PackageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ActionButton,
  EarningsStrip,
  QueueEmpty,
  QueueError,
  QueueSkeleton,
  RiderOrderCard,
} from "@/components/rider";
import { FetchError, apiMutate, swrFetcher } from "@/lib/api/fetcher";
import { formatOrderNumber } from "@/lib/format";
import type { OrderWithItems } from "@/types";

type OrderAction = "accept" | "picked_up" | "delivered";

export default function RiderDeliveriesPage() {
  const { data, error, isLoading, mutate } = useSWR<OrderWithItems[]>(
    "/api/rider/orders",
    swrFetcher,
    { refreshInterval: 10_000 },
  );

  async function runAction(order: OrderWithItems, action: OrderAction, success: string) {
    try {
      await apiMutate(`/api/rider/orders/${order.id}`, { method: "PATCH", body: { action } });
      toast.success(`${formatOrderNumber(order.orderNumber)} ${success}`);
      await mutate();
    } catch (err) {
      const conflict = err instanceof FetchError && err.status === 409;
      toast.error(err instanceof FetchError ? err.message : "Something went wrong. Try again.");
      // A 409 means the queue moved under us (e.g. another rider claimed it) — refresh.
      if (conflict) await mutate();
    }
  }

  const orders = data ?? [];
  const available = orders.filter((o) => o.status === "confirmed" && o.riderId === null);
  const active = orders.filter(
    (o) => o.riderId !== null && (o.status === "confirmed" || o.status === "picked_up"),
  );
  const completed = orders.filter(
    (o) => o.riderId !== null && (o.status === "delivered" || o.status === "cancelled"),
  );

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Deliveries workboard</h1>
      <EarningsStrip orders={orders} />

      <Tabs defaultValue="available">
        <TabsList className="sticky top-[6.5rem] z-40 h-11 w-full bg-muted shadow-md sm:top-14">
          <TabsTrigger value="available" className="min-h-9">
            Available{!isLoading && !error ? ` (${available.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="active" className="min-h-9">
            My active{!isLoading && !error ? ` (${active.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="completed" className="min-h-9">
            History
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <QueueSkeleton />
        ) : error ? (
          <QueueError
            message={error instanceof FetchError ? error.message : undefined}
            onRetry={() => void mutate()}
          />
        ) : (
          <>
            <TabsContent value="available" className="space-y-4">
              {available.length === 0 ? (
                <QueueEmpty
                  icon={<InboxIcon />}
                  title="No orders waiting"
                  hint="New confirmed orders show up here automatically."
                />
              ) : (
                available.map((order) => (
                  <RiderOrderCard
                    key={order.id}
                    order={order}
                    actions={
                      <ActionButton onAction={() => runAction(order, "accept", "is yours — go pick it up!")}>
                        Accept delivery
                      </ActionButton>
                    }
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {active.length === 0 ? (
                <QueueEmpty
                  icon={<PackageIcon />}
                  title="Nothing in progress"
                  hint="Accept an order from the Available tab to start delivering."
                />
              ) : (
                active.map((order) => (
                  <RiderOrderCard
                    key={order.id}
                    order={order}
                    actions={
                      order.status === "confirmed" ? (
                        <ActionButton onAction={() => runAction(order, "picked_up", "marked as picked up.")}>
                          Picked up
                        </ActionButton>
                      ) : (
                        <ActionButton onAction={() => runAction(order, "delivered", "delivered. Nice work!")}>
                          Delivered
                        </ActionButton>
                      )
                    }
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completed.length === 0 ? (
                <QueueEmpty
                  icon={<PackageCheckIcon />}
                  title="No completed deliveries yet"
                  hint="Orders you deliver will be listed here."
                />
              ) : (
                completed.map((order) => <RiderOrderCard key={order.id} order={order} />)
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

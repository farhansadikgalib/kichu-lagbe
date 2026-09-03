"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, TableShell, TableStateRows } from "@/components/admin/data-table";
import { errorMessage, useAdminOrders, useAdminUsers } from "@/components/admin/hooks";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PriceSummary } from "@/components/orders/price-summary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiMutate } from "@/lib/api/fetcher";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatBDT, formatDate, formatOrderNumber } from "@/lib/format";
import type { AdminOrder, OrderStatus } from "@/types";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "picked_up",
  "delivered",
  "cancelled",
];

type StatusFilter = "all" | OrderStatus;

const UNASSIGNED = "unassigned";
const COLUMN_COUNT = 8;

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const status = filter === "all" ? undefined : filter;
  const { data: orders, error, isLoading, mutate } = useAdminOrders(status);
  const { data: riders } = useAdminUsers("rider");
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function updateOrder(
    id: string,
    patch: { status?: OrderStatus; riderId?: string | null },
    successMessage: string,
  ) {
    setPendingId(id);
    try {
      await apiMutate(`/api/admin/orders/${id}`, { method: "PATCH", body: patch });
      toast.success(successMessage);
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track, update, and assign every customer order."
      />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as StatusFilter)}>
        <div className="overflow-x-auto">
          <TabsList aria-label="Filter orders by status">
            <TabsTrigger value="all">All</TabsTrigger>
            {ORDER_STATUSES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <TableShell>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Placed</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rider</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableStateRows
            colSpan={COLUMN_COUNT}
            isLoading={isLoading}
            error={error}
            isEmpty={!orders || orders.length === 0}
            emptyMessage={
              filter === "all"
                ? "No orders yet."
                : `No ${ORDER_STATUS_LABELS[filter].toLowerCase()} orders.`
            }
            skeletonRows={8}
          />
          {orders?.map((order) => {
            const orderNumber = formatOrderNumber(order.orderNumber);
            const pending = pendingId === order.id;
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{orderNumber}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell>
                  <span className="block">{order.user.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {order.phone}
                  </span>
                </TableCell>
                <TableCell>{order.items.length}</TableCell>
                <TableCell>{formatBDT(order.total)}</TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    disabled={pending}
                    onValueChange={(value) =>
                      void updateOrder(
                        order.id,
                        { status: value as OrderStatus },
                        `Order ${orderNumber} marked ${ORDER_STATUS_LABELS[value].toLowerCase()}.`,
                      )
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-32 border-transparent bg-transparent dark:bg-transparent"
                      aria-label={`Change status of order ${orderNumber}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <OrderStatusBadge status={s} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={order.riderId ?? UNASSIGNED}
                    disabled={pending}
                    onValueChange={(value) =>
                      void updateOrder(
                        order.id,
                        { riderId: value === UNASSIGNED ? null : value },
                        value === UNASSIGNED
                          ? `Rider removed from order ${orderNumber}.`
                          : `Rider assigned to order ${orderNumber}.`,
                      )
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-36"
                      aria-label={`Assign rider to order ${orderNumber}`}
                    >
                      <SelectValue placeholder="Assign rider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {riders?.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`View details of order ${orderNumber}`}
                    onClick={() => setDetailOrder(order)}
                  >
                    <Eye />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </TableShell>

      <Dialog
        open={detailOrder !== null}
        onOpenChange={(open) => {
          if (!open) setDetailOrder(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Order {formatOrderNumber(detailOrder.orderNumber)}
                </DialogTitle>
                <DialogDescription>
                  Placed {formatDate(detailOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={detailOrder.status} />
                  {detailOrder.rider ? (
                    <span className="text-muted-foreground">
                      Rider: {detailOrder.rider.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No rider assigned</span>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Items</h3>
                  <ul className="space-y-1.5">
                    {detailOrder.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span>
                          {item.productName}{" "}
                          <span className="text-muted-foreground">
                            × {item.quantity}
                          </span>
                        </span>
                        <span>{formatBDT(item.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="mb-2 font-semibold">Delivery</h3>
                  <p>
                    {detailOrder.customerName} · {detailOrder.phone}
                  </p>
                  <p className="text-muted-foreground">
                    {detailOrder.addressDetails}
                  </p>
                  {detailOrder.note && (
                    <p className="mt-1 text-muted-foreground">
                      Note: {detailOrder.note}
                    </p>
                  )}
                </div>

                <Separator />

                <PriceSummary
                  subtotal={detailOrder.subtotal}
                  deliveryCharge={detailOrder.deliveryCharge}
                  discount={detailOrder.discount}
                  couponCode={detailOrder.couponCode}
                  total={detailOrder.total}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

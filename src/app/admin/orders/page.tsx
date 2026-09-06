"use client";

import { useEffect, useState } from "react";
import { ArrowDownUp, RefreshCw, StickyNote } from "lucide-react";
import {
  PageHeader,
  TablePagination,
  TableSearchInput,
  TableShell,
  TableStateRows,
} from "@/components/admin/data-table";
import { useAdminOrders, useAdminRiders } from "@/components/admin/hooks";
import { ALL_TIME, DateRangeFilter, type DateRange } from "@/components/admin/orders/date-range-filter";
import { OrderDetailSheet } from "@/components/admin/orders/order-detail-sheet";
import { OrderStatusActions } from "@/components/admin/orders/order-status-actions";
import { RiderSelect } from "@/components/admin/orders/rider-select";
import { useOrderActions } from "@/components/admin/orders/use-order-actions";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatBDT, formatDate, formatLineName, formatOrderNumber, formatRelativeTime } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { AdminOrder, OrderStatus } from "@/types";

/** New orders show up without a reload while the board is open. */
const REFRESH_MS = 30_000;
const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;
const COLUMN_COUNT = 7;

type StatusFilter = "all" | OrderStatus;
type Sort = "desc" | "asc";

const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
];

function itemsSummary(order: AdminOrder) {
  const names = order.items.map((item) => `${item.quantity}× ${formatLineName(item)}`);
  return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2} more` : names.join(", ");
}

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DateRange>(ALL_TIME);
  const [sort, setSort] = useState<Sort>("desc");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Any filter change starts again from the first page.
  const changeFilter = (value: StatusFilter) => {
    setFilter(value);
    setPage(1);
  };
  const changeRange = (value: DateRange) => {
    setRange(value);
    setPage(1);
  };
  const changeSort = (value: Sort) => {
    setSort(value);
    setPage(1);
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, error, isLoading, isValidating, mutate } = useAdminOrders({
    status: filter === "all" ? undefined : filter,
    search,
    from: range.from,
    to: range.to,
    sort,
    page,
    pageSize: PAGE_SIZE,
    refreshInterval: REFRESH_MS,
  });
  const { data: riders } = useAdminRiders();
  const actions = useOrderActions(mutate, riders);

  const orders = data?.items ?? [];
  const counts = data?.counts;
  const totalInScope = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : 0;
  const filtered = search !== "" || range.preset !== "all";
  // Always render the live row so the sheet reflects optimistic updates.
  const detailOrder = orders.find((o) => o.id === detailId) ?? null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description={
          counts && counts.pending > 0
            ? `${counts.pending} ${counts.pending === 1 ? "order needs" : "orders need"} confirming${filtered ? " in this view" : ""}.`
            : "Nothing is waiting for confirmation. New orders appear here automatically."
        }
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void mutate()}
          disabled={isValidating}
          aria-label="Refresh orders"
        >
          <RefreshCw data-icon="inline-start" className={cn(isValidating && "animate-spin")} aria-hidden />
          Refresh
        </Button>
      </PageHeader>

      <div className="space-y-3">
        <Tabs value={filter} onValueChange={(value) => changeFilter(value as StatusFilter)}>
          <div className="scrollbar-none -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <TabsList aria-label="Filter orders by status">
              <TabsTrigger value="all">
                All <Count value={totalInScope} />
              </TabsTrigger>
              {ORDER_STATUSES.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                  <Count value={counts?.[s] ?? 0} highlight={s === "pending" && (counts?.[s] ?? 0) > 0} />
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <TableSearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search orders by #, name, phone, address"
            className="lg:max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter value={range} onChange={changeRange} />
            <Select value={sort} onValueChange={(value) => changeSort(value as Sort)}>
              <SelectTrigger aria-label="Sort orders" className="h-9">
                <ArrowDownUp className="size-4 text-muted-foreground" aria-hidden />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORTS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <TableShell>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rider</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isValidating && !isLoading && "opacity-70 transition-opacity")}>
            <TableStateRows
              colSpan={COLUMN_COUNT}
              isLoading={isLoading}
              error={error}
              isEmpty={orders.length === 0}
              emptyMessage={emptyMessage(filter, filtered)}
              skeletonRows={8}
            />
            {orders.map((order) => {
              const pending = actions.pendingId === order.id;
              return (
                <TableRow
                  key={order.id}
                  className={cn(
                    "cursor-pointer",
                    order.status === "pending" && "bg-amber-500/[0.04] shadow-[inset_3px_0_0_0] shadow-amber-500/70",
                  )}
                  onClick={() => setDetailId(order.id)}
                >
                  <TableCell>
                    <span className="block font-semibold tabular-nums">{formatOrderNumber(order.orderNumber)}</span>
                    <span className="block text-xs text-muted-foreground" title={formatDate(order.createdAt)}>
                      {formatRelativeTime(order.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      {order.customerName}
                      {order.note && (
                        <StickyNote className="size-3.5 text-amber-400" aria-label="Has a customer note" />
                      )}
                    </span>
                    <span className="block text-xs text-muted-foreground">{order.phone}</span>
                  </TableCell>
                  <TableCell className="max-w-64">
                    <span className="block truncate" title={order.items.map(formatLineName).join(", ")}>
                      {itemsSummary(order)}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground" title={order.addressDetails}>
                      {order.addressDetails}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatBDT(order.total)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RiderSelect
                      order={order}
                      riders={riders}
                      pending={pending}
                      className="w-36"
                      onAssign={(riderId) => actions.assignRider(order, riderId)}
                    />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <OrderStatusActions
                      order={order}
                      pending={pending}
                      onStatus={(status) => actions.setStatus(order, status)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </TableShell>
        {data && <TablePagination pageInfo={data.pageInfo} onPageChange={setPage} />}
      </div>

      {/* Phone: cards */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
        ) : error ? (
          <p className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-destructive">
            Couldn&apos;t load orders. Please check your connection and try again.
          </p>
        ) : orders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {emptyMessage(filter, filtered)}
          </p>
        ) : (
          orders.map((order) => {
            const pending = actions.pendingId === order.id;
            return (
              <article
                key={order.id}
                className={cn(
                  "space-y-3 rounded-xl border border-border/60 bg-card p-4",
                  order.status === "pending" && "border-amber-500/40",
                )}
              >
                <button
                  type="button"
                  className="w-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() => setDetailId(order.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold tabular-nums">{formatOrderNumber(order.orderNumber)}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{formatBDT(order.total)}</p>
                      <OrderStatusBadge status={order.status} className="mt-1" />
                    </div>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm">
                    {order.customerName} · {order.phone}
                    {order.note && <StickyNote className="size-3.5 text-amber-400" aria-label="Has a customer note" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{itemsSummary(order)}</p>
                  <p className="truncate text-xs text-muted-foreground">{order.addressDetails}</p>
                </button>
                <div className="flex items-center gap-2">
                  <RiderSelect
                    order={order}
                    riders={riders}
                    pending={pending}
                    className="flex-1"
                    onAssign={(riderId) => actions.assignRider(order, riderId)}
                  />
                  <OrderStatusActions
                    order={order}
                    pending={pending}
                    onStatus={(status) => actions.setStatus(order, status)}
                  />
                </div>
              </article>
            );
          })
        )}
        {data && (
          <div className="rounded-xl border border-border/60 bg-card">
            <TablePagination pageInfo={data.pageInfo} onPageChange={setPage} />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Refreshes every {REFRESH_MS / 1000}s · click an order for details, call and copy buttons.
      </p>

      <OrderDetailSheet
        order={detailOrder}
        riders={riders}
        actions={actions}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      />
    </div>
  );
}

function Count({ value, highlight = false }: { value: number; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "ml-1 rounded-full px-1.5 text-[11px] tabular-nums",
        highlight ? "bg-amber-500/20 text-amber-400" : "bg-foreground/10 text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

function emptyMessage(filter: StatusFilter, filtered: boolean) {
  const what = filter === "all" ? "orders" : `${ORDER_STATUS_LABELS[filter].toLowerCase()} orders`;
  return filtered ? `No ${what} match these filters.` : `No ${what} yet.`;
}

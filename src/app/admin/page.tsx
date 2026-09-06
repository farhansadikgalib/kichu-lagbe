"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Package, Receipt, UserPlus, XCircle } from "lucide-react";
import { Delta } from "@/components/admin/charts/delta";
import { useCountUp } from "@/components/admin/charts/chart-utils";
import { DeliveryPerformance } from "@/components/admin/charts/delivery-performance";
import { HourColumns } from "@/components/admin/charts/hour-columns";
import { RankedBars } from "@/components/admin/charts/ranked-bars";
import { SalesBreakdown } from "@/components/admin/charts/sales-breakdown";
import { StatusBar } from "@/components/admin/charts/status-bar";
import { TrendChart, type TrendMetric } from "@/components/admin/charts/trend-chart";
import { WeekdayColumns } from "@/components/admin/charts/weekday-columns";
import { PageHeader, TableShell, TableStateRows } from "@/components/admin/data-table";
import { useAdminOrders, useAdminStats } from "@/components/admin/hooks";
import { StatCard } from "@/components/admin/stat-card";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBDT, formatDate, formatOrderNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminStats, StatsRange } from "@/types";

const RECENT_COUNT = 5;
const RANGES: { value: StatsRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export default function AdminDashboardPage() {
  const [range, setRange] = useState<StatsRange>("30d");
  const [metric, setMetric] = useState<TrendMetric>("revenue");
  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
    isValidating,
  } = useAdminStats(range);
  const {
    data: orders,
    error: ordersError,
    isLoading: ordersLoading,
  } = useAdminOrders({ pageSize: RECENT_COUNT });

  const recent = orders?.items ?? [];
  const period = stats?.period;
  const previous = stats?.previous;
  const compare = `vs previous ${stats?.days ?? 30} days`;
  /* Range switches keep the last report on screen, dimmed, until the next lands. */
  const stale = isValidating && !!stats;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Sales, orders, and what's selling.">
        <Tabs value={range} onValueChange={(value) => setRange(value as StatsRange)}>
          <TabsList aria-label="Reporting window">
            {RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value} className="px-3">
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </PageHeader>

      {statsError ? (
        <div className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-destructive">
          Couldn&apos;t load reports. Please check your connection and try again.
        </div>
      ) : (
        <div className={cn("space-y-6 transition-opacity duration-300", stale && "opacity-60")}>
          {/* Headline numbers */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <RevenueHero stats={stats} isLoading={statsLoading} compare={compare} />
            <StatCard
              label="Orders placed"
              value={period?.orders ?? 0}
              icon={Package}
              delta={period && previous ? { current: period.orders, previous: previous.orders, compare } : undefined}
              trend={stats?.series.map((p) => p.orders)}
              isLoading={statsLoading}
            />
            <StatCard
              label="Average order value"
              value={formatBDT(period?.avgOrderValue ?? 0)}
              icon={Receipt}
              delta={
                period && previous
                  ? { current: period.avgOrderValue, previous: previous.avgOrderValue, compare }
                  : undefined
              }
              isLoading={statsLoading}
            />
            <StatCard
              label="New customers"
              value={period?.newCustomers ?? 0}
              icon={UserPlus}
              delta={
                period && previous
                  ? { current: period.newCustomers, previous: previous.newCustomers, compare }
                  : undefined
              }
              isLoading={statsLoading}
            />
            <StatCard
              label="Cancelled"
              value={period?.cancelled ?? 0}
              icon={XCircle}
              delta={
                period && previous
                  ? { current: period.cancelled, previous: previous.cancelled, compare, invert: true }
                  : undefined
              }
              isLoading={statsLoading}
            />
          </div>

          {/* Trend + what revenue is made of */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>{metric === "revenue" ? "Revenue" : "Orders"} by day</CardTitle>
                <CardDescription>
                  {metric === "revenue"
                    ? "Delivered order value per day."
                    : "Orders placed per day, any status."}
                </CardDescription>
                <CardAction>
                  <Tabs value={metric} onValueChange={(value) => setMetric(value as TrendMetric)}>
                    <TabsList aria-label="Chart metric">
                      <TabsTrigger value="revenue" className="px-3">
                        Revenue
                      </TabsTrigger>
                      <TabsTrigger value="orders" className="px-3">
                        Orders
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardAction>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <TrendChart series={stats.series} metric={metric} />
                ) : (
                  <Skeleton className="h-60 w-full" />
                )}
              </CardContent>
            </Card>

            <ReportCard
              title="Sales breakdown"
              description="Where delivered revenue comes from."
              stats={stats}
            >
              {(s) => <SalesBreakdown breakdown={s.breakdown} delivered={s.period.delivered} />}
            </ReportCard>
          </div>

          {/* What sells, and when */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ReportCard
              title="Top products"
              description="By sales value, excluding cancelled orders."
              stats={stats}
            >
              {(s) => (
                <RankedBars
                  rows={s.topProducts.map((p) => ({
                    label: p.name,
                    value: p.revenue,
                    detail: `${p.quantity} sold`,
                  }))}
                  formatValue={formatBDT}
                  emptyMessage="Nothing sold in this window yet."
                />
              )}
            </ReportCard>

            <ReportCard
              title="Top categories"
              description="By sales value, excluding cancelled orders."
              stats={stats}
            >
              {(s) => (
                <RankedBars
                  rows={s.topCategories.map((c) => ({
                    label: c.name,
                    value: c.revenue,
                    detail: `${c.quantity} sold`,
                  }))}
                  formatValue={formatBDT}
                  emptyMessage="Nothing sold in this window yet."
                />
              )}
            </ReportCard>

            <ReportCard
              title="Busiest hours"
              description="When orders come in, excluding cancelled."
              stats={stats}
              className="md:col-span-2 xl:col-span-1"
            >
              {(s) => <HourColumns byHour={s.byHour} />}
            </ReportCard>
          </div>

          {/* Fulfilment */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ReportCard
              title="Orders by status"
              description="Everything placed in this window."
              stats={stats}
            >
              {(s) => <StatusBar byStatus={s.byStatus} />}
            </ReportCard>

            <ReportCard
              title="Busiest days"
              description="Orders by weekday, excluding cancelled."
              stats={stats}
            >
              {(s) => <WeekdayColumns byWeekday={s.byWeekday} />}
            </ReportCard>

            <ReportCard
              title="Delivery performance"
              description="How fast and how reliably orders are fulfilled."
              stats={stats}
              className="md:col-span-2 xl:col-span-1"
            >
              {(s) => (
                <DeliveryPerformance
                  delivery={s.delivery}
                  delivered={s.period.delivered}
                  cancelled={s.period.cancelled}
                />
              )}
            </ReportCard>
          </div>

          {/* People */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ReportCard
              title="Top customers"
              description={
                stats
                  ? `${stats.customers.active} ordered · ${stats.customers.returning} returning`
                  : "Biggest spenders in this window."
              }
              stats={stats}
            >
              {(s) => (
                <RankedBars
                  rows={s.topCustomers.map((c) => ({
                    label: c.name,
                    value: c.spend,
                    detail: `${c.orders} ${c.orders === 1 ? "order" : "orders"}`,
                  }))}
                  formatValue={formatBDT}
                  emptyMessage="No orders in this window yet."
                />
              )}
            </ReportCard>

            <ReportCard
              title="Rider deliveries"
              description="Completed deliveries per rider."
              stats={stats}
            >
              {(s) => (
                <RankedBars
                  rows={s.riders.map((r) => ({
                    label: r.name,
                    value: r.delivered,
                    detail: r.avgMinutes === null ? undefined : `avg ${r.avgMinutes} min`,
                  }))}
                  formatValue={(n) => `${n} ${n === 1 ? "delivery" : "deliveries"}`}
                  emptyMessage="No deliveries completed in this window yet."
                />
              )}
            </ReportCard>

            <ReportCard
              title="Coupons used"
              description="Discount given per code, excluding cancelled."
              stats={stats}
              className="md:col-span-2 xl:col-span-1"
            >
              {(s) => (
                <RankedBars
                  rows={s.coupons.map((c) => ({
                    label: c.code,
                    value: c.discount,
                    detail: `${c.uses} ${c.uses === 1 ? "use" : "uses"}`,
                  }))}
                  formatValue={formatBDT}
                  emptyMessage="No coupons used in this window."
                />
              )}
            </ReportCard>
          </div>
        </div>
      )}

      <section aria-labelledby="recent-orders-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-orders-heading" className="text-base font-semibold">
            Recent orders
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">
              View all
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
        </div>

        <TableShell>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead className="hidden sm:table-cell">Placed</TableHead>
              <TableHead className="hidden md:table-cell">Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableStateRows
              colSpan={5}
              isLoading={ordersLoading}
              error={ordersError}
              isEmpty={recent.length === 0}
              emptyMessage="No orders yet."
            />
            {recent.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {formatOrderNumber(order.orderNumber)}
                  <span className="mt-0.5 block max-w-32 truncate text-xs font-normal text-muted-foreground md:hidden">
                    {order.user.name}
                  </span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell className="hidden md:table-cell">{order.user.name}</TableCell>
                <TableCell>{formatBDT(order.total)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableShell>
      </section>
    </div>
  );
}

interface ReportCardProps {
  title: string;
  description: string;
  stats?: AdminStats;
  className?: string;
  /** Rendered once the report has loaded. */
  children: (stats: AdminStats) => ReactNode;
}

/** Titled card for one report, with a skeleton until the stats arrive. */
function ReportCard({ title, description, stats, className, children }: ReportCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{stats ? children(stats) : <Skeleton className="h-40 w-full" />}</CardContent>
    </Card>
  );
}

interface RevenueHeroProps {
  stats?: AdminStats;
  isLoading: boolean;
  compare: string;
}

/** The one hero figure on the page: revenue for the window, counting up as it loads. */
function RevenueHero({ stats, isLoading, compare }: RevenueHeroProps) {
  const revenue = useCountUp(stats?.period.revenue ?? 0);
  const delivered = stats?.period.delivered ?? 0;

  return (
    <Card className="md:col-span-2 xl:row-span-2 justify-between">
      <CardHeader>
        <CardDescription>Revenue · last {stats?.days ?? 30} days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !stats ? (
          <Skeleton className="h-12 w-48" />
        ) : (
          <>
            <p className="font-sans text-5xl font-semibold tracking-tight">
              {formatBDT(Math.round(revenue))}
            </p>
            <Delta
              current={stats.period.revenue}
              previous={stats.previous.revenue}
              compare={compare}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              From {delivered} delivered {delivered === 1 ? "order" : "orders"}
            </p>
          </>
        )}
      </CardContent>
      <CardContent className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
        {stats ? (
          <>
            All time · {formatBDT(stats.lifetime.revenue)} · {stats.lifetime.orders} orders ·{" "}
            {stats.lifetime.pendingOrders} pending · {stats.lifetime.customers} customers ·{" "}
            {stats.lifetime.products} products
          </>
        ) : (
          <Skeleton className="h-4 w-64" />
        )}
      </CardContent>
    </Card>
  );
}

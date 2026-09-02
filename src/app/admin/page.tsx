"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Package,
  ShoppingBasket,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader, TableShell, TableStateRows } from "@/components/admin/data-table";
import { useAdminOrders, useAdminStats } from "@/components/admin/hooks";
import { StatCard } from "@/components/admin/stat-card";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBDT, formatDate, formatOrderNumber } from "@/lib/format";

const RECENT_COUNT = 10;

export default function AdminDashboardPage() {
  const { data: stats, error: statsError, isLoading: statsLoading } = useAdminStats();
  const {
    data: orders,
    error: ordersError,
    isLoading: ordersLoading,
  } = useAdminOrders();
  const recent = orders?.slice(0, RECENT_COUNT) ?? [];

  const statItems = [
    { label: "Total orders", value: stats?.totalOrders ?? 0, icon: Package },
    { label: "Pending orders", value: stats?.pendingOrders ?? 0, icon: Clock },
    { label: "Delivered", value: stats?.deliveredOrders ?? 0, icon: CheckCircle2 },
    { label: "Revenue", value: formatBDT(stats?.totalRevenue ?? 0), icon: Wallet },
    { label: "Customers", value: stats?.totalCustomers ?? 0, icon: Users },
    { label: "Products", value: stats?.totalProducts ?? 0, icon: ShoppingBasket },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of orders, revenue, and platform activity."
      />

      {statsError ? (
        <div className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-destructive">
          Couldn&apos;t load stats. Please check your connection and try again.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {statItems.map((item) => (
            <StatCard key={item.label} {...item} isLoading={statsLoading} />
          ))}
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
              <TableHead>Placed</TableHead>
              <TableHead>Customer</TableHead>
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
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell>{order.user.name}</TableCell>
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

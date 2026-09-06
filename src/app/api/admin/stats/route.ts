import { and, count, desc, eq, gte, isNotNull, lt, ne, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, orderItems, orders, products, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";
import { SERVICE } from "@/lib/constants";
import { DHAKA_TZ, shiftIsoDate, startOfDhakaDay, toDhakaDate } from "@/lib/dhaka-time";
import { ORDER_STATUSES } from "@/lib/order-status";
import type { AdminStats, StatsPeriod, StatsPoint, StatsRange } from "@/types";

/** Reports are bucketed by the Dhaka business day so late-night orders land where the admin expects. */
const RANGE_DAYS: Record<StatsRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

function parseRange(value: string | null): StatsRange {
  return value && value in RANGE_DAYS ? (value as StatsRange) : "30d";
}

function emptyPeriod(): StatsPeriod {
  return { revenue: 0, orders: 0, delivered: 0, cancelled: 0, avgOrderValue: 0, newCustomers: 0 };
}

export async function GET(request: Request) {
  try {
    await requireUser("admin");

    const range = parseRange(new URL(request.url).searchParams.get("range"));
    const days = RANGE_DAYS[range];
    const today = toDhakaDate();
    const startDate = shiftIsoDate(today, -(days - 1));
    const prevStartDate = shiftIsoDate(startDate, -days);
    const start = startOfDhakaDay(startDate);
    const prevStart = startOfDhakaDay(prevStartDate);

    /* The zone is inlined (not bound) so GROUP BY matches the SELECT expression exactly. */
    const localTime = sql`${orders.createdAt} at time zone ${sql.raw(`'${DHAKA_TZ}'`)}`;
    const dayExpr = sql<string>`to_char(${localTime}, 'YYYY-MM-DD')`;
    const hourExpr = sql<number>`extract(hour from ${localTime})::int`;
    const weekdayExpr = sql<number>`extract(dow from ${localTime})::int`;
    const inWindow = and(gte(orders.createdAt, start), ne(orders.status, "cancelled"));
    const deliveredInWindow = and(gte(orders.createdAt, start), eq(orders.status, "delivered"));
    const lineValue = sum(orderItems.lineTotal);
    const deliveryMinutes = sql<number>`extract(epoch from (${orders.deliveredAt} - ${orders.createdAt})) / 60`;

    const [
      [lifetimeOrders],
      [lifetimePending],
      [lifetimeDelivered],
      [lifetimeCustomers],
      [lifetimeProducts],
      daily,
      hourly,
      topProducts,
      topCategories,
      [newCustomers],
      [prevNewCustomers],
      weekly,
      [breakdown],
      [timing],
      [customerMix],
      topCustomers,
      riders,
      coupons,
    ] = await Promise.all([
      db.select({ value: count() }).from(orders),
      db.select({ value: count() }).from(orders).where(eq(orders.status, "pending")),
      db
        .select({ value: count(), revenue: sum(orders.total) })
        .from(orders)
        .where(eq(orders.status, "delivered")),
      db.select({ value: count() }).from(users).where(eq(users.role, "customer")),
      db.select({ value: count() }).from(products),
      /* Current + previous window in one pass, split in JS below. */
      db
        .select({ day: dayExpr, status: orders.status, count: count(), total: sum(orders.total) })
        .from(orders)
        .where(gte(orders.createdAt, prevStart))
        .groupBy(dayExpr, orders.status),
      db
        .select({ hour: hourExpr, count: count() })
        .from(orders)
        .where(inWindow)
        .groupBy(hourExpr),
      db
        .select({
          name: orderItems.productName,
          quantity: sum(orderItems.quantity),
          revenue: lineValue,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(inWindow)
        .groupBy(orderItems.productName)
        .orderBy(desc(lineValue))
        .limit(5),
      db
        .select({
          name: sql<string>`coalesce(${categories.name}, 'Other')`,
          quantity: sum(orderItems.quantity),
          revenue: lineValue,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(inWindow)
        .groupBy(categories.name)
        .orderBy(desc(lineValue))
        .limit(6),
      db
        .select({ value: count() })
        .from(users)
        .where(and(eq(users.role, "customer"), gte(users.createdAt, start))),
      db
        .select({ value: count() })
        .from(users)
        .where(
          and(
            eq(users.role, "customer"),
            gte(users.createdAt, prevStart),
            lt(users.createdAt, start),
          ),
        ),
      db
        .select({ dow: weekdayExpr, count: count() })
        .from(orders)
        .where(inWindow)
        .groupBy(weekdayExpr),
      db
        .select({
          subtotal: sum(orders.subtotal),
          deliveryCharges: sum(orders.deliveryCharge),
          discounts: sum(orders.discount),
          total: sum(orders.total),
          couponOrders: count(orders.couponCode),
        })
        .from(orders)
        .where(deliveredInWindow),
      db
        .select({
          avgMinutes: sql<string | null>`avg(${deliveryMinutes})`,
          timed: count(),
          onTime: sql<number>`count(*) filter (where ${deliveryMinutes} <= ${SERVICE.avgDeliveryMinutes})`,
        })
        .from(orders)
        .where(and(deliveredInWindow, isNotNull(orders.deliveredAt))),
      db
        .select({
          active: sql<number>`count(distinct ${orders.userId})`,
          returning: sql<number>`count(distinct ${orders.userId}) filter (where exists (
            select 1 from ${orders} earlier
            where earlier.user_id = ${orders.userId} and earlier.created_at < ${start}
          ))`,
        })
        .from(orders)
        .where(inWindow),
      db
        .select({ name: users.name, orders: count(), spend: sum(orders.total) })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .where(inWindow)
        .groupBy(users.id, users.name)
        .orderBy(desc(sum(orders.total)))
        .limit(5),
      db
        .select({
          name: users.name,
          delivered: count(),
          avgMinutes: sql<string | null>`avg(${deliveryMinutes})`,
        })
        .from(orders)
        .innerJoin(users, eq(orders.riderId, users.id))
        .where(deliveredInWindow)
        .groupBy(users.id, users.name)
        .orderBy(desc(count()))
        .limit(5),
      db
        .select({ code: orders.couponCode, uses: count(), discount: sum(orders.discount) })
        .from(orders)
        .where(and(inWindow, isNotNull(orders.couponCode)))
        .groupBy(orders.couponCode)
        .orderBy(desc(sum(orders.discount)))
        .limit(5),
    ]);

    /* Zero-filled day series so quiet days still draw. */
    const series: StatsPoint[] = Array.from({ length: days }, (_, i) => ({
      date: shiftIsoDate(startDate, i),
      revenue: 0,
      orders: 0,
    }));
    const pointByDate = new Map(series.map((p) => [p.date, p]));

    const period = emptyPeriod();
    const previous = emptyPeriod();
    const statusTotals = new Map(
      ORDER_STATUSES.map((status) => [status, { status, count: 0, total: 0 }]),
    );

    for (const row of daily) {
      const isCurrent = row.day >= startDate;
      const bucket = isCurrent ? period : previous;
      const n = Number(row.count);
      const total = Number(row.total ?? 0);

      bucket.orders += n;
      if (row.status === "delivered") {
        bucket.delivered += n;
        bucket.revenue += total;
      } else if (row.status === "cancelled") {
        bucket.cancelled += n;
      }

      if (!isCurrent) continue;
      const point = pointByDate.get(row.day);
      if (point) {
        point.orders += n;
        if (row.status === "delivered") point.revenue += total;
      }
      const status = statusTotals.get(row.status);
      if (status) {
        status.count += n;
        status.total += total;
      }
    }

    period.avgOrderValue = period.delivered ? Math.round(period.revenue / period.delivered) : 0;
    previous.avgOrderValue = previous.delivered
      ? Math.round(previous.revenue / previous.delivered)
      : 0;
    period.newCustomers = newCustomers.value;
    previous.newCustomers = prevNewCustomers.value;

    const byHour = Array.from({ length: 24 }, () => 0);
    for (const row of hourly) byHour[row.hour] = Number(row.count);
    const byWeekday = Array.from({ length: 7 }, () => 0);
    for (const row of weekly) byWeekday[row.dow] = Number(row.count);

    const minutes = (value: string | null) => (value === null ? null : Math.round(Number(value)));

    const stats: AdminStats = {
      range,
      days,
      lifetime: {
        orders: lifetimeOrders.value,
        pendingOrders: lifetimePending.value,
        deliveredOrders: lifetimeDelivered.value,
        revenue: Number(lifetimeDelivered.revenue ?? 0),
        customers: lifetimeCustomers.value,
        products: lifetimeProducts.value,
      },
      period,
      previous,
      series,
      byStatus: ORDER_STATUSES.map((status) => statusTotals.get(status)!),
      byHour,
      topProducts: topProducts.map((row) => ({
        name: row.name,
        quantity: Number(row.quantity ?? 0),
        revenue: Number(row.revenue ?? 0),
      })),
      topCategories: topCategories.map((row) => ({
        name: row.name,
        quantity: Number(row.quantity ?? 0),
        revenue: Number(row.revenue ?? 0),
      })),
      byWeekday,
      breakdown: {
        subtotal: Number(breakdown.subtotal ?? 0),
        deliveryCharges: Number(breakdown.deliveryCharges ?? 0),
        discounts: Number(breakdown.discounts ?? 0),
        total: Number(breakdown.total ?? 0),
        couponOrders: Number(breakdown.couponOrders),
      },
      delivery: {
        avgMinutes: minutes(timing.avgMinutes),
        timed: Number(timing.timed),
        onTime: Number(timing.onTime),
      },
      customers: {
        active: Number(customerMix.active),
        returning: Number(customerMix.returning),
      },
      topCustomers: topCustomers.map((row) => ({
        name: row.name,
        orders: Number(row.orders),
        spend: Number(row.spend ?? 0),
      })),
      riders: riders.map((row) => ({
        name: row.name,
        delivered: Number(row.delivered),
        avgMinutes: minutes(row.avgMinutes),
      })),
      coupons: coupons.map((row) => ({
        code: row.code ?? "",
        uses: Number(row.uses),
        discount: Number(row.discount ?? 0),
      })),
    };

    return ok(stats);
  } catch (err) {
    return handleApiError(err);
  }
}

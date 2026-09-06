import { and, asc, count, desc, eq, gte, ilike, lt, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";
import { paginate, parsePagination } from "@/lib/api/pagination";
import { endOfDhakaDay, isIsoDate, startOfDhakaDay } from "@/lib/dhaka-time";
import { ORDER_STATUSES } from "@/lib/order-status";
import type { AdminOrdersPage, OrderStatus } from "@/types";

/**
 * Orders board. Filters: `status`, `search` (name / phone / account / order
 * number), `from` / `to` (Dhaka calendar days, inclusive), `sort` (desc |
 * asc by placed time); paginated with `page` / `pageSize`. Also returns
 * per-status counts for the same search + date window so the status tabs
 * show what's waiting.
 */
export async function GET(request: Request) {
  try {
    await requireUser("admin");
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.trim();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const sort = url.searchParams.get("sort") === "asc" ? asc : desc;
    const { page, pageSize, offset } = parsePagination(url);

    // Everything except the status filter — the tab counts use this scope.
    const scope = [];
    if (search) {
      const numeric = Number(search.replace(/^#/, ""));
      scope.push(
        or(
          ilike(orders.customerName, `%${search}%`),
          ilike(orders.phone, `%${search}%`),
          ilike(orders.addressDetails, `%${search}%`),
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ...(Number.isInteger(numeric) && numeric > 0 ? [eq(orders.orderNumber, numeric)] : []),
        ),
      );
    }
    if (isIsoDate(from)) scope.push(gte(orders.createdAt, startOfDhakaDay(from)));
    if (isIsoDate(to)) scope.push(lt(orders.createdAt, endOfDhakaDay(to)));
    const scopeWhere = scope.length ? and(...scope) : undefined;

    const where =
      status && (ORDER_STATUSES as string[]).includes(status)
        ? and(scopeWhere, eq(orders.status, status as OrderStatus))
        : scopeWhere;

    const [countRows, matchedIds] = await Promise.all([
      db
        .select({ status: orders.status, total: count() })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .where(scopeWhere)
        .groupBy(orders.status),
      db
        .select({ id: orders.id })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .where(where)
        .orderBy(sort(orders.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
    for (const row of countRows) counts[row.status] = Number(row.total);
    const total = status && status in counts ? counts[status as OrderStatus] : countRows.reduce((sum, r) => sum + Number(r.total), 0);

    const rows = matchedIds.length
      ? await db.query.orders.findMany({
          where: (o, { inArray }) => inArray(o.id, matchedIds.map((r) => r.id)),
          orderBy: [sort(orders.createdAt)],
          with: {
            items: true,
            user: { columns: { id: true, name: true, email: true, phone: true } },
            rider: { columns: { id: true, name: true, phone: true } },
          },
        })
      : [];

    const body: AdminOrdersPage = { ...paginate(rows, total, page, pageSize), counts };
    return ok(body);
  } catch (err) {
    return handleApiError(err);
  }
}

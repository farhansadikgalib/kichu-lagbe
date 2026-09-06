import type { InferSelectModel } from "drizzle-orm";
import type {
  categories,
  coupons,
  media,
  notifications,
  orderItems,
  orders,
  products,
  productVariants,
  users,
} from "@/lib/db/schema";

/* ------------------------------ Domain models ------------------------------ */

export type UserRole = "customer" | "rider" | "admin";
export type OrderStatus = "pending" | "confirmed" | "picked_up" | "delivered" | "cancelled";
export type CouponType = "fixed" | "percent";

export type User = Omit<InferSelectModel<typeof users>, "passwordHash">;
export type Category = InferSelectModel<typeof categories>;
export type Product = InferSelectModel<typeof products>;
export type ProductVariant = InferSelectModel<typeof productVariants>;
/** Flat delivery settings — one charge for the whole coverage area. */
export interface DeliverySettings {
  charge: number;
}
export type Coupon = InferSelectModel<typeof coupons>;
export type Order = InferSelectModel<typeof orders>;
export type OrderItem = InferSelectModel<typeof orderItems>;
export type AppNotification = InferSelectModel<typeof notifications>;
/** Uploaded file metadata — the bytes themselves never leave the media route. */
export type MediaAsset = Omit<InferSelectModel<typeof media>, "data"> & { url: string };

export type ProductWithCategory = Product & {
  category: Category;
  /** Purchasable options in display order; empty when sold at the base price. */
  variants: ProductVariant[];
};

export type OrderWithItems = Order & {
  items: OrderItem[];
  rider?: Pick<User, "id" | "name" | "phone"> | null;
};

export type AdminOrder = OrderWithItems & {
  user: Pick<User, "id" | "name" | "email" | "phone">;
};

export interface CouponValidationResult {
  code: string;
  type: CouponType;
  value: number;
  discount: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/* -------------------------------- Pagination ------------------------------- */

export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pageInfo: PageInfo;
}

/** Orders board page: rows plus per-status totals for the active search / date window. */
export type AdminOrdersPage = Paginated<AdminOrder> & {
  counts: Record<OrderStatus, number>;
};

/* ------------------------------ Order events ------------------------------ */

export type OrderEventType = "order.created" | "order.updated";

/** Pushed to the admin console (and any configured webhook) when an order changes. */
export interface OrderEvent {
  id: string;
  type: OrderEventType;
  /** ISO timestamp; doubles as the SSE event id so reconnects can replay from it. */
  at: string;
  /** Who caused it — a console skips toasts for its own user's actions. */
  actorId: string | null;
  order: {
    id: string;
    orderNumber: number;
    /** Customer who placed it — the customer stream only forwards their own orders. */
    userId: string;
    status: OrderStatus;
    customerName: string;
    total: number;
    /** Units across all lines; only known when the order is created. */
    itemCount?: number;
    note: string | null;
    riderName?: string | null;
  };
}

/* ------------------------------ Admin reports ----------------------------- */

/** Reporting window for the admin dashboard, ending today (Asia/Dhaka). */
export type StatsRange = "7d" | "30d" | "90d";

/** One day of the dashboard time series. `date` is YYYY-MM-DD in Asia/Dhaka. */
export interface StatsPoint {
  date: string;
  /** Delivered order value that day (BDT). */
  revenue: number;
  /** Orders placed that day, any status. */
  orders: number;
}

/** Totals for one reporting window; `previous` on AdminStats is the window before it. */
export interface StatsPeriod {
  /** Delivered order value (BDT). */
  revenue: number;
  /** Orders placed, any status. */
  orders: number;
  delivered: number;
  cancelled: number;
  /** revenue / delivered, 0 when nothing was delivered. */
  avgOrderValue: number;
  newCustomers: number;
}

export interface AdminStats {
  range: StatsRange;
  days: number;
  lifetime: {
    orders: number;
    pendingOrders: number;
    deliveredOrders: number;
    revenue: number;
    customers: number;
    products: number;
  };
  period: StatsPeriod;
  previous: StatsPeriod;
  /** One point per day of the window, oldest first, zero-filled. */
  series: StatsPoint[];
  /** Orders placed in the window, in status flow order (every status present). */
  byStatus: { status: OrderStatus; count: number; total: number }[];
  /** Non-cancelled orders placed in the window by hour of day (24 entries, Asia/Dhaka). */
  byHour: number[];
  /** Best-selling products in the window (non-cancelled orders), by value. */
  topProducts: { name: string; quantity: number; revenue: number }[];
  /** Best-selling categories in the window (non-cancelled orders), by value. */
  topCategories: { name: string; quantity: number; revenue: number }[];
  /** Non-cancelled orders placed in the window by weekday (7 entries, Sunday first). */
  byWeekday: number[];
  /** What delivered revenue in the window is made of. */
  breakdown: {
    subtotal: number;
    deliveryCharges: number;
    discounts: number;
    total: number;
    /** Delivered orders that used a coupon. */
    couponOrders: number;
  };
  /** Delivery timing for orders delivered in the window that have a delivered-at stamp. */
  delivery: {
    avgMinutes: number | null;
    /** Deliveries with a timing stamp. */
    timed: number;
    /** Of those, delivered within the promised window. */
    onTime: number;
  };
  /** Customers who ordered in the window, and how many had ordered before it. */
  customers: { active: number; returning: number };
  /** Biggest spenders in the window (non-cancelled orders). */
  topCustomers: { name: string; orders: number; spend: number }[];
  /** Deliveries completed per rider in the window. */
  riders: { name: string; delivered: number; avgMinutes: number | null }[];
  /** Coupons used on non-cancelled orders in the window, by discount given. */
  coupons: { code: string; uses: number; discount: number }[];
}

import type { InferSelectModel } from "drizzle-orm";
import type {
  categories,
  coupons,
  deliveryAreas,
  notifications,
  orderItems,
  orders,
  products,
  users,
} from "@/lib/db/schema";

/* ------------------------------ Domain models ------------------------------ */

export type UserRole = "customer" | "rider" | "admin";
export type OrderStatus = "pending" | "confirmed" | "picked_up" | "delivered" | "cancelled";
export type CouponType = "fixed" | "percent";

export type User = Omit<InferSelectModel<typeof users>, "passwordHash">;
export type Category = InferSelectModel<typeof categories>;
export type Product = InferSelectModel<typeof products>;
export type DeliveryArea = InferSelectModel<typeof deliveryAreas>;
export type Coupon = InferSelectModel<typeof coupons>;
export type Order = InferSelectModel<typeof orders>;
export type OrderItem = InferSelectModel<typeof orderItems>;
export type AppNotification = InferSelectModel<typeof notifications>;

export type ProductWithCategory = Product & { category: Category };

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

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
}

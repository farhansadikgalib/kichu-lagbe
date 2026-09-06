import {
  boolean,
  customType,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/** Raw binary column — Drizzle has no built-in bytea. */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/* ---------------------------------- Enums --------------------------------- */

export const userRole = pgEnum("user_role", ["customer", "rider", "admin"]);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "picked_up",
  "delivered",
  "cancelled",
]);

export const couponType = pgEnum("coupon_type", ["fixed", "percent"]);

/* ---------------------------------- Users --------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("customer"),
    avatarUrl: text("avatar_url"),
    emailVerified: boolean("email_verified").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

/* --------------------------------- Catalog -------------------------------- */

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    /** Price in BDT (whole taka). */
    price: integer("price").notNull(),
    imageUrl: text("image_url"),
    isAvailable: boolean("is_available").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("products_slug_idx").on(t.slug)],
);

/**
 * Purchasable options of a product (size, pack, flavour…) each with its own
 * price. A product with no variants is sold at its base price.
 */
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Price in BDT (whole taka). */
    price: integer("price").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_variants_product_idx").on(t.productId)],
);

/* ---------------------------------- Media --------------------------------- */

/**
 * Admin-uploaded images (products, home page sections). Stored in Postgres so
 * uploads need no extra infrastructure; served through /api/media/[id].
 */
export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------------- Coupons -------------------------------- */

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    type: couponType("type").notNull(),
    /** Fixed: BDT amount. Percent: 0–100. */
    value: integer("value").notNull(),
    minOrder: integer("min_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("coupons_code_idx").on(t.code)],
);

/* --------------------------------- Orders --------------------------------- */

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: serial("order_number").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  riderId: uuid("rider_id").references(() => users.id),
  status: orderStatus("status").notNull().default("pending"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  addressDetails: text("address_details").notNull(),
  note: text("note"),
  subtotal: integer("subtotal").notNull(),
  deliveryCharge: integer("delivery_charge").notNull(),
  discount: integer("discount").notNull().default(0),
  total: integer("total").notNull(),
  couponCode: text("coupon_code"),
  paymentMethod: text("payment_method").notNull().default("cod"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  variantId: uuid("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }),
  /** Snapshots so history survives catalog edits. */
  productName: text("product_name").notNull(),
  variantName: text("variant_name"),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: integer("line_total").notNull(),
});

/* ------------------------------ Notifications ------------------------------ */

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------------- Settings -------------------------------- */

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------- Relations -------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders, { relationName: "customerOrders" }),
  notifications: many(notifications),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
    relationName: "customerOrders",
  }),
  rider: one(users, {
    fields: [orders.riderId],
    references: [users.id],
    relationName: "riderOrders",
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

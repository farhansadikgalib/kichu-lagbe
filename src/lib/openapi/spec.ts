import { z, type ZodType } from "zod";
import { BRAND } from "@/lib/constants";
import { homeLayoutSchema } from "@/lib/home/schema";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "@/lib/validation/auth";
import {
  couponPatchSchema,
  couponSchema,
  deliverySettingsSchema,
  productSchema,
} from "@/lib/validation/catalog";
import { checkoutSchema, validateCouponSchema } from "@/lib/validation/order";
import { pushSubscriptionSchema, pushUnsubscribeSchema } from "@/lib/validation/push";

/**
 * OpenAPI 3.1 description of the public HTTP API, served at /api/openapi.json
 * and rendered by Swagger UI at /api-docs.
 *
 * Request bodies are derived from the same zod schemas the route handlers
 * parse with, so the documented input is by construction what the API
 * accepts. Response shapes mirror `@/types`; keep both in step when a
 * model changes.
 */

type Schema = Record<string, unknown>;

/* --------------------------------- Helpers -------------------------------- */

/** JSON Schema for what a client sends (transforms/defaults applied server-side). */
function fromZod(schema: ZodType): Schema {
  const json = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as Schema;
  delete json.$schema;
  return json;
}

const ref = (name: string): Schema => ({ $ref: `#/components/schemas/${name}` });
const array = (items: Schema): Schema => ({ type: "array", items });
const nullable = (schema: Schema): Schema => ({ anyOf: [schema, { type: "null" }] });
const obj = (properties: Record<string, Schema>, required?: string[]): Schema => ({
  type: "object",
  properties,
  ...(required && { required }),
});
const str = (extra: Schema = {}): Schema => ({ type: "string", ...extra });
const int = (extra: Schema = {}): Schema => ({ type: "integer", ...extra });
const num = (extra: Schema = {}): Schema => ({ type: "number", ...extra });
const bool: Schema = { type: "boolean" };
const uuid = str({ format: "uuid" });
const dateTime = str({ format: "date-time" });
/** Money is whole BDT (taka), never fractional. */
const bdt = int({ description: "Amount in whole BDT (৳)." });

/** The success envelope every JSON route returns: `{ data }`. */
function dataResponse(schema: Schema, description = "OK"): Schema {
  return {
    description,
    content: {
      "application/json": {
        schema: obj({ data: schema }, ["data"]),
      },
    },
  };
}

function errorResponse(description: string): Schema {
  return { description, content: { "application/json": { schema: ref("Error") } } };
}

function jsonBody(schema: Schema, description?: string): Schema {
  return { required: true, ...(description && { description }), content: { "application/json": { schema } } };
}

function pathId(description: string): Schema {
  return { name: "id", in: "path", required: true, schema: uuid, description };
}

function query(name: string, schema: Schema, description: string): Schema {
  return { name, in: "query", required: false, schema, description };
}

const paginationParams = [
  query("page", int({ minimum: 1, default: 1 }), "1-indexed page."),
  query("pageSize", int({ minimum: 1, maximum: 100, default: 20 }), "Rows per page (max 100)."),
];

const paginated = (item: Schema): Schema =>
  obj({ items: array(item), pageInfo: ref("PageInfo") }, ["items", "pageInfo"]);

const E = {
  400: errorResponse("Malformed request."),
  401: errorResponse("Not signed in, or the credentials are wrong."),
  403: errorResponse("Signed in, but not allowed to do this."),
  404: errorResponse("Not found."),
  409: errorResponse("Conflict with the current state."),
  410: errorResponse("Gone — no longer active or expired."),
  422: errorResponse("Validation failed (`error` names the first bad field)."),
  503: errorResponse("A required integration is not configured."),
};

/** Session-cookie security requirement, with the accepted roles in the summary. */
const session = [{ session: [] }];

/* -------------------------------- Components ------------------------------ */

const ORDER_STATUS = str({ enum: ["pending", "confirmed", "picked_up", "delivered", "cancelled"] });
const USER_ROLE = str({ enum: ["customer", "rider", "admin"] });

const schemas: Record<string, Schema> = {
  Error: obj({ error: str({ description: "Human-readable message, safe to show users." }) }, ["error"]),
  PageInfo: obj({ page: int(), pageSize: int(), total: int(), totalPages: int() }, [
    "page",
    "pageSize",
    "total",
    "totalPages",
  ]),
  SessionUser: obj({ id: uuid, name: str(), email: str({ format: "email" }), role: USER_ROLE }, [
    "id",
    "name",
    "email",
    "role",
  ]),
  User: obj(
    {
      id: uuid,
      name: str(),
      email: str({ format: "email" }),
      phone: nullable(str({ example: "01700000000" })),
      role: USER_ROLE,
      avatarUrl: nullable(str({ format: "uri" })),
      emailVerified: bool,
      isActive: bool,
      createdAt: dateTime,
    },
    ["id", "name", "email", "role", "emailVerified", "isActive", "createdAt"],
  ),
  Category: obj(
    { id: int(), slug: str(), name: str(), imageUrl: nullable(str()), sortOrder: int() },
    ["id", "slug", "name", "sortOrder"],
  ),
  ProductVariant: obj(
    { id: uuid, productId: uuid, name: str(), price: bdt, isAvailable: bool, sortOrder: int() },
    ["id", "productId", "name", "price", "isAvailable", "sortOrder"],
  ),
  Product: obj(
    {
      id: uuid,
      categoryId: int(),
      name: str(),
      slug: str(),
      description: nullable(str()),
      price: { ...bdt, description: "Base price; the “from” price once variants exist." },
      imageUrl: nullable(str()),
      isAvailable: bool,
      createdAt: dateTime,
      updatedAt: dateTime,
      category: ref("Category"),
      variants: {
        ...array(ref("ProductVariant")),
        description: "Purchasable options in display order; empty when sold at the base price.",
      },
    },
    ["id", "categoryId", "name", "slug", "price", "isAvailable", "category", "variants"],
  ),
  DeliverySettings: obj({ charge: { ...bdt, description: "Flat delivery charge in BDT." } }, ["charge"]),
  Coupon: obj(
    {
      id: uuid,
      code: str({ example: "WELCOME10" }),
      type: str({ enum: ["fixed", "percent"] }),
      value: int({ description: "Fixed: BDT amount. Percent: 0–100." }),
      minOrder: bdt,
      isActive: bool,
      expiresAt: nullable(dateTime),
      createdAt: dateTime,
    },
    ["id", "code", "type", "value", "minOrder", "isActive", "createdAt"],
  ),
  CouponValidation: obj(
    {
      code: str(),
      type: str({ enum: ["fixed", "percent"] }),
      value: int(),
      discount: { ...bdt, description: "Discount for the given subtotal." },
    },
    ["code", "type", "value", "discount"],
  ),
  OrderItem: obj(
    {
      id: uuid,
      orderId: uuid,
      productId: nullable(uuid),
      variantId: nullable(uuid),
      productName: str({ description: "Snapshot at order time." }),
      variantName: nullable(str()),
      unitPrice: bdt,
      quantity: int(),
      lineTotal: bdt,
    },
    ["id", "orderId", "productName", "unitPrice", "quantity", "lineTotal"],
  ),
  Order: obj(
    {
      id: uuid,
      orderNumber: int({ description: "Human-facing sequential number." }),
      userId: uuid,
      riderId: nullable(uuid),
      status: ORDER_STATUS,
      customerName: str(),
      phone: str(),
      addressDetails: str(),
      latitude: nullable(num()),
      longitude: nullable(num()),
      locationAccuracy: nullable(int({ description: "GPS accuracy radius in metres." })),
      note: nullable(str()),
      subtotal: bdt,
      deliveryCharge: bdt,
      discount: bdt,
      total: bdt,
      couponCode: nullable(str()),
      paymentMethod: str({ example: "cod" }),
      createdAt: dateTime,
      deliveredAt: nullable(dateTime),
    },
    ["id", "orderNumber", "userId", "status", "customerName", "phone", "addressDetails", "subtotal", "deliveryCharge", "discount", "total", "paymentMethod", "createdAt"],
  ),
  OrderWithItems: {
    allOf: [
      ref("Order"),
      obj({
        items: array(ref("OrderItem")),
        rider: nullable(obj({ id: uuid, name: str(), phone: nullable(str()) }, ["id", "name"])),
      }),
    ],
  },
  AdminOrder: {
    allOf: [
      ref("OrderWithItems"),
      obj({
        user: obj({ id: uuid, name: str(), email: str(), phone: nullable(str()) }, ["id", "name", "email"]),
      }),
    ],
  },
  AdminOrdersPage: {
    allOf: [
      paginated(ref("AdminOrder")),
      obj({
        counts: {
          type: "object",
          description: "Orders per status for the same search / date window (every status present).",
          additionalProperties: int(),
        },
      }),
    ],
  },
  Notification: obj(
    {
      id: uuid,
      userId: uuid,
      title: str(),
      body: str(),
      href: nullable(str({ description: "In-app link, e.g. /orders/{id}." })),
      isRead: bool,
      createdAt: dateTime,
    },
    ["id", "userId", "title", "body", "isRead", "createdAt"],
  ),
  MediaAsset: obj(
    {
      id: uuid,
      filename: str(),
      mimeType: str({ example: "image/webp" }),
      size: int({ description: "Bytes." }),
      createdAt: dateTime,
      url: str({ description: "Public, immutable URL (/api/media/{id})." }),
    },
    ["id", "filename", "mimeType", "size", "createdAt", "url"],
  ),
  OrderEvent: obj(
    {
      id: uuid,
      type: str({ enum: ["order.created", "order.updated"] }),
      at: { ...dateTime, description: "Also the SSE event id, for Last-Event-ID replay." },
      actorId: nullable(uuid),
      order: obj(
        {
          id: uuid,
          orderNumber: int(),
          userId: uuid,
          status: ORDER_STATUS,
          customerName: str(),
          total: bdt,
          itemCount: int(),
          note: nullable(str()),
          riderName: nullable(str()),
        },
        ["id", "orderNumber", "userId", "status", "customerName", "total"],
      ),
    },
    ["id", "type", "at", "actorId", "order"],
  ),
  StatsPeriod: obj(
    {
      revenue: bdt,
      orders: int(),
      delivered: int(),
      cancelled: int(),
      avgOrderValue: bdt,
      newCustomers: int(),
    },
    ["revenue", "orders", "delivered", "cancelled", "avgOrderValue", "newCustomers"],
  ),
  AdminStats: obj(
    {
      range: str({ enum: ["7d", "30d", "90d"] }),
      days: int(),
      lifetime: obj({
        orders: int(),
        pendingOrders: int(),
        deliveredOrders: int(),
        revenue: bdt,
        customers: int(),
        products: int(),
      }),
      period: ref("StatsPeriod"),
      previous: { ...ref("StatsPeriod"), description: "The window immediately before `period`." },
      series: array(obj({ date: str({ example: "2026-09-06" }), revenue: bdt, orders: int() })),
      byStatus: array(obj({ status: ORDER_STATUS, count: int(), total: bdt })),
      byHour: { ...array(int()), description: "24 entries, Asia/Dhaka hour of day." },
      byWeekday: { ...array(int()), description: "7 entries, Sunday first." },
      topProducts: array(obj({ name: str(), quantity: int(), revenue: bdt })),
      topCategories: array(obj({ name: str(), quantity: int(), revenue: bdt })),
      breakdown: obj({
        subtotal: bdt,
        deliveryCharges: bdt,
        discounts: bdt,
        total: bdt,
        couponOrders: int(),
      }),
      delivery: obj({ avgMinutes: nullable(int()), timed: int(), onTime: int() }),
      customers: obj({ active: int(), returning: int() }),
      topCustomers: array(obj({ name: str(), orders: int(), spend: bdt })),
      riders: array(obj({ name: str(), delivered: int(), avgMinutes: nullable(int()) })),
      coupons: array(obj({ code: str(), uses: int(), discount: bdt })),
    },
    ["range", "days", "lifetime", "period", "previous", "series"],
  ),
  HomeLayout: fromZod(homeLayoutSchema),
};

const sseResponse = (description: string): Schema => ({
  description,
  content: {
    "text/event-stream": {
      schema: str({
        description:
          "SSE frames: `event: ready` on connect, then `event: order.created` / `event: order.updated` with an OrderEvent JSON body; `: ping` comments every 25s. Streams close after 4 minutes — reconnect with `Last-Event-ID`.",
      }),
    },
  },
});

/* ---------------------------------- Paths --------------------------------- */

const paths: Record<string, Schema> = {
  /* ------------------------------- Auth ---------------------------------- */
  "/api/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Create a customer account and sign in",
      description:
        "Starts a session (sets the `dl_session` cookie). `turnstileToken` is required only when Cloudflare Turnstile is configured on the server.",
      requestBody: jsonBody(fromZod(registerSchema)),
      responses: { 200: dataResponse(ref("SessionUser"), "Signed in."), 403: E[403], 409: errorResponse("An account with this email already exists."), 422: E[422] },
    },
  },
  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Sign in with email and password",
      description: "Works for every role. Staff normally use the `/console` page, customers `/login`. Sets the `dl_session` cookie.",
      requestBody: jsonBody(fromZod(loginSchema)),
      responses: { 200: dataResponse(ref("SessionUser"), "Signed in."), 401: E[401], 403: errorResponse("Account disabled, or the bot check failed."), 422: E[422] },
    },
  },
  "/api/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Sign out",
      responses: { 200: dataResponse(obj({ loggedOut: bool })) },
    },
  },
  "/api/auth/session": {
    get: {
      tags: ["Auth"],
      summary: "Current session",
      description: "`data` is `null` when nobody is signed in — never an error.",
      responses: { 200: dataResponse(nullable(ref("SessionUser"))) },
    },
  },
  "/api/auth/profile": {
    get: {
      tags: ["Auth"],
      summary: "Own account",
      security: session,
      responses: { 200: dataResponse(ref("User")), 401: E[401], 404: E[404] },
    },
    patch: {
      tags: ["Auth"],
      summary: "Update own name, phone or avatar",
      security: session,
      requestBody: jsonBody(fromZod(updateProfileSchema)),
      responses: { 200: dataResponse(ref("User")), 401: E[401], 422: E[422] },
    },
  },
  "/api/auth/change-password": {
    post: {
      tags: ["Auth"],
      summary: "Change own password",
      security: session,
      requestBody: jsonBody(fromZod(changePasswordSchema)),
      responses: { 200: dataResponse(obj({ changed: bool })), 401: errorResponse("Not signed in, or the current password is wrong."), 422: E[422] },
    },
  },
  "/api/auth/firebase": {
    post: {
      tags: ["Auth"],
      summary: "Sign in with a Firebase (Google popup) ID token",
      description: "Verifies the token against Google's keys, upserts the user by email and starts a session.",
      requestBody: jsonBody(obj({ idToken: str() }, ["idToken"])),
      responses: { 200: dataResponse(ref("SessionUser"), "Signed in."), 401: E[401], 422: E[422], 503: E[503] },
    },
  },
  "/api/auth/google": {
    get: {
      tags: ["Auth"],
      summary: "Start the Google OAuth redirect flow",
      parameters: [query("next", str(), "Same-origin path to return to after sign-in.")],
      responses: { 302: { description: "Redirects to Google (or to `/login?error=google-unavailable` when not configured)." } },
    },
  },
  "/api/auth/google/callback": {
    get: {
      tags: ["Auth"],
      summary: "Google OAuth callback",
      parameters: [query("code", str(), "Authorization code from Google."), query("state", str(), "Opaque state issued by /api/auth/google.")],
      responses: { 302: { description: "Starts a session and redirects to the role's home (or `/login?error=…`)." } },
    },
  },

  /* ------------------------------ Catalog -------------------------------- */
  "/api/products": {
    get: {
      tags: ["Catalog"],
      summary: "Available products",
      description: "Storefront list in category-then-name order. Browse lists (no `q`) are cached and served stale-while-revalidate; searches are live.",
      parameters: [
        query("category", str({ example: "snacks" }), "Category slug. Omit (or `all`) for everything."),
        query("q", str(), "Case-insensitive name search."),
      ],
      responses: { 200: dataResponse(array(ref("Product"))) },
    },
  },
  "/api/categories": {
    get: { tags: ["Catalog"], summary: "Categories in display order", responses: { 200: dataResponse(array(ref("Category"))) } },
  },
  "/api/delivery": {
    get: { tags: ["Catalog"], summary: "Public delivery terms", responses: { 200: dataResponse(ref("DeliverySettings")) } },
  },
  "/api/media/{id}": {
    get: {
      tags: ["Catalog"],
      summary: "Uploaded image bytes",
      description: "Ids are random UUIDs, so responses are immutable and cached for a year.",
      parameters: [pathId("Media asset id.")],
      responses: {
        200: { description: "The image.", content: { "image/webp": { schema: str({ format: "binary" }) } } },
        404: E[404],
      },
    },
  },
  "/api/coupons/validate": {
    post: {
      tags: ["Catalog"],
      summary: "Check a coupon against a cart subtotal",
      requestBody: jsonBody(fromZod(validateCouponSchema)),
      responses: { 200: dataResponse(ref("CouponValidation")), 404: errorResponse("Invalid coupon code."), 410: E[410], 422: errorResponse("Subtotal is below the coupon's minimum order.") },
    },
  },

  /* ------------------------------- Orders -------------------------------- */
  "/api/orders": {
    get: {
      tags: ["Orders"],
      summary: "Own orders, newest first",
      security: session,
      responses: { 200: dataResponse(array(ref("OrderWithItems"))), 401: E[401] },
    },
    post: {
      tags: ["Orders"],
      summary: "Place an order (cash on delivery)",
      description:
        "Prices, the delivery charge and any coupon discount are always recomputed server-side; the client's numbers are never trusted. A coupon that no longer applies fails the order rather than being silently dropped.",
      security: session,
      requestBody: jsonBody(fromZod(checkoutSchema)),
      responses: { 201: dataResponse(ref("Order"), "Order placed."), 401: E[401], 422: errorResponse("Validation failed, an item is unavailable, or the coupon no longer applies.") },
    },
  },
  "/api/orders/{id}": {
    get: {
      tags: ["Orders"],
      summary: "One order",
      description: "Visible to its customer, its assigned rider, and admins; anyone else gets 404.",
      security: session,
      parameters: [pathId("Order id.")],
      responses: { 200: dataResponse(ref("OrderWithItems")), 401: E[401], 404: E[404] },
    },
  },
  "/api/orders/events": {
    get: {
      tags: ["Orders"],
      summary: "Live updates for own orders (SSE)",
      description: "`order.updated` whenever staff move one of the caller's orders along. No replay — revalidate on (re)connect.",
      security: session,
      responses: { 200: sseResponse("Event stream."), 401: E[401] },
    },
  },
  "/api/geocode/reverse": {
    get: {
      tags: ["Orders"],
      summary: "Address for a GPS point",
      description: "Reverse-geocodes via OpenStreetMap Nominatim for checkout autofill; `address` is `null` when nothing useful resolves.",
      security: session,
      parameters: [
        { name: "lat", in: "query", required: true, schema: num({ minimum: -90, maximum: 90 }) },
        { name: "lng", in: "query", required: true, schema: num({ minimum: -180, maximum: 180 }) },
      ],
      responses: { 200: dataResponse(obj({ address: nullable(str()) }, ["address"])), 401: E[401], 422: E[422] },
    },
  },

  /* --------------------------- Notifications ----------------------------- */
  "/api/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "Latest 30 notifications",
      security: session,
      responses: { 200: dataResponse(array(ref("Notification"))), 401: E[401] },
    },
    patch: {
      tags: ["Notifications"],
      summary: "Mark all read",
      security: session,
      responses: { 200: dataResponse(obj({ read: bool })), 401: E[401] },
    },
  },
  "/api/push/subscriptions": {
    post: {
      tags: ["Notifications"],
      summary: "Register this device for Web Push",
      description: "Body is `PushSubscription.toJSON()` from the browser. Re-registering an endpoint moves it to the caller.",
      security: session,
      requestBody: jsonBody(fromZod(pushSubscriptionSchema)),
      responses: { 200: dataResponse(obj({ subscribed: bool })), 401: E[401], 422: E[422], 503: E[503] },
    },
    delete: {
      tags: ["Notifications"],
      summary: "Remove a push subscription",
      security: session,
      requestBody: jsonBody(fromZod(pushUnsubscribeSchema)),
      responses: { 200: dataResponse(obj({ subscribed: bool })), 401: E[401], 422: E[422] },
    },
  },

  /* -------------------------------- Rider -------------------------------- */
  "/api/rider/orders": {
    get: {
      tags: ["Rider"],
      summary: "Work queue",
      description: "Unassigned confirmed orders (available to accept) plus the rider's own orders, newest first (max 100). Roles: rider, admin.",
      security: session,
      responses: { 200: dataResponse(array(ref("OrderWithItems"))), 401: E[401], 403: E[403] },
    },
  },
  "/api/rider/orders/{id}": {
    patch: {
      tags: ["Rider"],
      summary: "Accept, pick up or deliver an order",
      description:
        "`accept` claims an unassigned confirmed order atomically. `picked_up` requires the caller's order to be confirmed; `delivered` requires picked_up. Roles: rider, admin.",
      security: session,
      parameters: [pathId("Order id.")],
      requestBody: jsonBody(obj({ action: str({ enum: ["accept", "picked_up", "delivered"] }) }, ["action"])),
      responses: { 200: dataResponse(ref("Order")), 401: E[401], 403: E[403], 409: errorResponse("Already taken, or not in a valid state for this action."), 422: E[422] },
    },
  },

  /* -------------------------------- Admin -------------------------------- */
  "/api/admin/stats": {
    get: {
      tags: ["Admin"],
      summary: "Dashboard reports",
      description: "Windows end today in Asia/Dhaka. Role: admin.",
      security: session,
      parameters: [query("range", str({ enum: ["7d", "30d", "90d"], default: "30d" }), "Reporting window.")],
      responses: { 200: dataResponse(ref("AdminStats")), 401: E[401], 403: E[403] },
    },
  },
  "/api/admin/orders": {
    get: {
      tags: ["Admin"],
      summary: "Orders board",
      description: "Filtered, paginated orders plus per-status counts for the same search / date window. Role: admin.",
      security: session,
      parameters: [
        query("status", ORDER_STATUS, "Only this status."),
        query("search", str(), "Customer name, phone, address, account name/email, or order number (e.g. `#42`)."),
        query("from", str({ format: "date" }), "Dhaka calendar day, inclusive."),
        query("to", str({ format: "date" }), "Dhaka calendar day, inclusive."),
        query("sort", str({ enum: ["desc", "asc"], default: "desc" }), "By placed time."),
        ...paginationParams,
      ],
      responses: { 200: dataResponse(ref("AdminOrdersPage")), 401: E[401], 403: E[403] },
    },
  },
  "/api/admin/orders/{id}": {
    patch: {
      tags: ["Admin"],
      summary: "Set an order's status and/or rider",
      description: "Notifies the customer (and the rider when assigned) and publishes a live event. Role: admin.",
      security: session,
      parameters: [pathId("Order id.")],
      requestBody: jsonBody(obj({ status: ORDER_STATUS, riderId: nullable(uuid) })),
      responses: { 200: dataResponse(ref("Order")), 401: E[401], 403: E[403], 404: E[404], 422: errorResponse("Validation failed, or `riderId` is not a rider.") },
    },
  },
  "/api/admin/products": {
    get: {
      tags: ["Admin"],
      summary: "All products (including unavailable), most recently edited first",
      security: session,
      parameters: [query("search", str(), "Case-insensitive name search."), ...paginationParams],
      responses: { 200: dataResponse(paginated(ref("Product"))), 401: E[401], 403: E[403] },
    },
    post: {
      tags: ["Admin"],
      summary: "Create a product",
      description: "Invalidates the storefront catalog cache. Role: admin.",
      security: session,
      requestBody: jsonBody(fromZod(productSchema)),
      responses: { 201: dataResponse(ref("Product"), "Created."), 401: E[401], 403: E[403], 422: E[422] },
    },
  },
  "/api/admin/products/{id}": {
    patch: {
      tags: ["Admin"],
      summary: "Update a product",
      description: "Any subset of fields. Sending `variants` replaces the full option list; omitting it leaves options untouched. Role: admin.",
      security: session,
      parameters: [pathId("Product id.")],
      requestBody: jsonBody(fromZod(productSchema.partial())),
      responses: { 200: dataResponse(ref("Product")), 401: E[401], 403: E[403], 404: E[404], 422: E[422] },
    },
    delete: {
      tags: ["Admin"],
      summary: "Delete a product",
      description: "Permanent. Options cascade; order lines keep their name/price snapshots. Role: admin.",
      security: session,
      parameters: [pathId("Product id.")],
      responses: { 200: dataResponse(obj({ deleted: bool })), 401: E[401], 403: E[403], 404: E[404] },
    },
  },
  "/api/admin/coupons": {
    get: { tags: ["Admin"], summary: "All coupons, newest first", security: session, responses: { 200: dataResponse(array(ref("Coupon"))), 401: E[401], 403: E[403] } },
    post: {
      tags: ["Admin"],
      summary: "Create a coupon",
      security: session,
      requestBody: jsonBody(fromZod(couponSchema)),
      responses: { 201: dataResponse(ref("Coupon"), "Created."), 401: E[401], 403: E[403], 422: E[422] },
    },
  },
  "/api/admin/coupons/{id}": {
    patch: {
      tags: ["Admin"],
      summary: "Update a coupon",
      security: session,
      parameters: [pathId("Coupon id.")],
      requestBody: jsonBody(fromZod(couponPatchSchema)),
      responses: { 200: dataResponse(ref("Coupon")), 401: E[401], 403: E[403], 404: E[404], 422: E[422] },
    },
    delete: {
      tags: ["Admin"],
      summary: "Delete a coupon",
      security: session,
      parameters: [pathId("Coupon id.")],
      responses: { 200: dataResponse(obj({ deleted: bool })), 401: E[401], 403: E[403], 404: E[404] },
    },
  },
  "/api/admin/users": {
    get: {
      tags: ["Admin"],
      summary: "Accounts, newest first",
      security: session,
      parameters: [query("role", USER_ROLE, "Only this role."), query("search", str(), "Name, email or phone."), ...paginationParams],
      responses: { 200: dataResponse(paginated(ref("User"))), 401: E[401], 403: E[403] },
    },
  },
  "/api/admin/users/{id}": {
    patch: {
      tags: ["Admin"],
      summary: "Change an account's role or active flag",
      description: "Admins cannot modify their own account. Role: admin.",
      security: session,
      parameters: [pathId("User id.")],
      requestBody: jsonBody(obj({ role: USER_ROLE, isActive: bool })),
      responses: { 200: dataResponse(ref("User")), 401: E[401], 403: E[403], 404: E[404], 422: E[422] },
    },
  },
  "/api/admin/delivery": {
    get: { tags: ["Admin"], summary: "Delivery settings", security: session, responses: { 200: dataResponse(ref("DeliverySettings")), 401: E[401], 403: E[403] } },
    patch: {
      tags: ["Admin"],
      summary: "Set the flat delivery charge",
      description: "Applies to the next order placed — no deploy needed. Role: admin.",
      security: session,
      requestBody: jsonBody(fromZod(deliverySettingsSchema)),
      responses: { 200: dataResponse(ref("DeliverySettings")), 401: E[401], 403: E[403], 422: E[422] },
    },
  },
  "/api/admin/home": {
    get: { tags: ["Admin"], summary: "Published home page layout", security: session, responses: { 200: dataResponse(ref("HomeLayout")), 401: E[401], 403: E[403] } },
    put: {
      tags: ["Admin"],
      summary: "Publish a home page layout",
      description: "Full replacement. The static home page regenerates on its next visit. Role: admin.",
      security: session,
      requestBody: jsonBody(ref("HomeLayout")),
      responses: { 200: dataResponse(ref("HomeLayout")), 401: E[401], 403: E[403], 422: E[422] },
    },
  },
  "/api/admin/media": {
    post: {
      tags: ["Admin"],
      summary: "Upload an image",
      description: "Resized to its display shape and stored as WebP. Role: admin.",
      security: session,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: obj(
              {
                file: str({ format: "binary" }),
                fit: str({ enum: ["square", "wide"], default: "square", description: "Display shape to resize for." }),
              },
              ["file"],
            ),
          },
        },
      },
      responses: { 201: dataResponse(ref("MediaAsset"), "Stored."), 400: errorResponse("Expected a multipart form upload."), 401: E[401], 403: E[403], 422: E[422] },
    },
  },
  "/api/admin/events": {
    get: {
      tags: ["Admin"],
      summary: "Live order events (SSE)",
      description: "Every `order.created` / `order.updated`. On reconnect, orders placed since `Last-Event-ID` (or `since`) are replayed as `order.created`. Role: admin.",
      security: session,
      parameters: [
        { name: "Last-Event-ID", in: "header", required: false, schema: dateTime, description: "Set automatically by EventSource on reconnect." },
        query("since", dateTime, "Fallback for clients that can't send Last-Event-ID."),
      ],
      responses: { 200: sseResponse("Event stream with replay."), 401: E[401], 403: E[403] },
    },
  },
};

/* -------------------------------- Document -------------------------------- */

export function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: `${BRAND.name} API`,
      version: "1.0.0",
      description: [
        `HTTP API behind the ${BRAND.name} storefront, rider app and admin console.`,
        "",
        "**Envelope.** Every JSON route returns `{ \"data\": … }` on success and `{ \"error\": \"message\" }` with a 4xx/5xx status on failure. Validation errors are 422 and name the first bad field.",
        "",
        "**Auth.** Sign in with `POST /api/auth/login` (or register); the server sets an HttpOnly `dl_session` cookie that the browser sends automatically. In this UI, click **Try it out** on a login request first — the cookie then applies to every other request. Role requirements are noted per operation.",
        "",
        "**Money.** All amounts are whole BDT (৳) integers.",
      ].join("\n"),
    },
    servers: [{ url: "/", description: "This deployment" }],
    tags: [
      { name: "Auth", description: "Sessions, registration, profile" },
      { name: "Catalog", description: "Public products, categories, coupons, media" },
      { name: "Orders", description: "Customer checkout and order tracking" },
      { name: "Notifications", description: "In-app bell and Web Push" },
      { name: "Rider", description: "Rider work queue and delivery actions" },
      { name: "Admin", description: "Console: reports, orders, catalog, users, settings" },
    ],
    components: {
      securitySchemes: {
        session: {
          type: "apiKey",
          in: "cookie",
          name: "dl_session",
          description: "HttpOnly JWT session cookie set by the login/register routes (7 days).",
        },
      },
      schemas,
    },
    paths,
  };
}

export type OpenApiSpec = ReturnType<typeof buildOpenApiSpec>;

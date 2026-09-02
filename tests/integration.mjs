/**
 * DeliveryLagbe integration test suite.
 * Drives the real HTTP API against a running server (dev or prod).
 *
 *   node tests/integration.mjs [baseUrl]
 *
 * Covers auth, catalog, coupons, orders (lifecycle + math), role guards,
 * ownership checks, rider flow, notifications, and abuse cases.
 */
const BASE = process.argv[2] ?? "http://localhost:3000";

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push({ name, detail });
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Minimal cookie-jar client. */
function client() {
  let cookies = {};
  return {
    async call(method, path, body) {
      const res = await fetch(BASE + path, {
        method,
        redirect: "manual",
        headers: {
          ...(body !== undefined && { "Content-Type": "application/json" }),
          cookie: Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; "),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      for (const sc of res.headers.getSetCookie?.() ?? []) {
        const [pair] = sc.split(";");
        const eq = pair.indexOf("=");
        const name = pair.slice(0, eq).trim();
        const value = pair.slice(eq + 1).trim();
        if (value === "" || /Max-Age=0/i.test(sc)) delete cookies[name];
        else cookies[name] = value;
      }
      let json = null;
      try {
        json = await res.json();
      } catch {
        /* non-JSON */
      }
      return { status: res.status, json, headers: res.headers };
    },
    get(path) {
      return this.call("GET", path);
    },
    post(path, body) {
      return this.call("POST", path, body);
    },
    patch(path, body) {
      return this.call("PATCH", path, body);
    },
    clearCookies() {
      cookies = {};
    },
  };
}

const PASSWORD = "Password123!";
const admin = client();
const rider = client();
const customer = client();
const anon = client();

async function section(title, fn) {
  console.log(`\n== ${title} ==`);
  try {
    await fn();
  } catch (err) {
    failed++;
    failures.push({ name: `${title} (threw)`, detail: String(err) });
    console.log(`  ✗ section threw: ${err}`);
  }
}

/* ------------------------------- Auth tests -------------------------------- */

const stamp = Date.now();
const newUser = {
  name: "Test User",
  email: `it-${stamp}@test.deliverylagbe.com`,
  phone: "+8801711111111",
  password: PASSWORD,
};

await section("Auth", async () => {
  let r = await anon.post("/api/auth/register", newUser);
  check("register new user", r.status === 200 && r.json?.data?.role === "customer");

  r = await anon.get("/api/auth/session");
  check("session after register", r.json?.data?.email === newUser.email);

  r = await anon.post("/api/auth/register", newUser);
  check("duplicate register rejected (409)", r.status === 409);

  r = await anon.post("/api/auth/logout");
  check("logout", r.status === 200);
  r = await anon.get("/api/auth/session");
  check("session null after logout", r.status === 200 && r.json?.data === null);

  r = await anon.post("/api/auth/login", { email: newUser.email, password: "wrong-pass" });
  check("wrong password rejected (401)", r.status === 401);

  r = await anon.post("/api/auth/login", { email: "nobody@x.com", password: PASSWORD });
  check("unknown email rejected (401)", r.status === 401);

  r = await anon.post("/api/auth/register", { ...newUser, email: "bad", phone: "123" });
  check("invalid input rejected (422)", r.status === 422);

  r = await customer.post("/api/auth/login", {
    email: "customer@deliverylagbe.com",
    password: PASSWORD,
  });
  check("demo customer login", r.status === 200);
  r = await admin.post("/api/auth/login", {
    email: "admin@deliverylagbe.com",
    password: PASSWORD,
  });
  check("demo admin login", r.status === 200 && r.json?.data?.role === "admin");
  r = await rider.post("/api/auth/login", {
    email: "rider@deliverylagbe.com",
    password: PASSWORD,
  });
  check("demo rider login", r.status === 200 && r.json?.data?.role === "rider");
});

/* ------------------------------ Catalog tests ------------------------------ */

let products = [];
let areas = [];

await section("Catalog", async () => {
  let r = await anon.get("/api/products");
  products = r.json?.data ?? [];
  check("products list non-empty", r.status === 200 && products.length > 0);
  check(
    "products carry category + price int",
    products.every((p) => p.category?.slug && Number.isInteger(p.price)),
  );

  r = await anon.get("/api/products?category=snacks");
  check(
    "category filter works",
    r.status === 200 &&
      r.json.data.length > 0 &&
      r.json.data.every((p) => p.category.slug === "snacks"),
  );

  r = await anon.get("/api/products?category=nope");
  check("unknown category returns empty list", r.status === 200 && r.json.data.length === 0);

  const needle = products[0].name.slice(0, 4);
  r = await anon.get(`/api/products?q=${encodeURIComponent(needle)}`);
  check("search filter returns matches", r.status === 200 && r.json.data.length > 0);

  r = await anon.get("/api/categories");
  check("categories list", r.status === 200 && r.json.data.length >= 3);

  r = await anon.get("/api/areas");
  areas = r.json?.data ?? [];
  check("areas list non-empty, active only", r.status === 200 && areas.length > 0 && areas.every((a) => a.isActive));
});

/* ------------------------------ Coupon tests ------------------------------- */

await section("Coupons", async () => {
  let r = await anon.post("/api/coupons/validate", { code: "WELCOME10", subtotal: 500 });
  check(
    "WELCOME10 valid: 10% of 500 = 50",
    r.status === 200 && r.json.data.discount === 50,
    JSON.stringify(r.json),
  );

  r = await anon.post("/api/coupons/validate", { code: "welcome10", subtotal: 500 });
  check("coupon code case-insensitive", r.status === 200 && r.json.data.discount === 50);

  r = await anon.post("/api/coupons/validate", { code: "WELCOME10", subtotal: 100 });
  check("below min order rejected (422)", r.status === 422);

  r = await anon.post("/api/coupons/validate", { code: "NOPE123", subtotal: 500 });
  check("unknown coupon rejected (404)", r.status === 404);

  r = await anon.post("/api/coupons/validate", { code: "FORMULA", subtotal: 500 });
  check("expired coupon rejected (410)", r.status === 410, `status ${r.status}`);
});

/* ------------------------------- Order tests ------------------------------- */

let orderId = null;

await section("Orders", async () => {
  const area = areas[0];
  const p0 = products[0];
  const p1 = products[1];

  let r = await anon.post("/api/orders", {});
  check("anonymous order rejected (401)", r.status === 401);

  const base = {
    customerName: "Test User",
    phone: "01711111111",
    areaId: area.id,
    addressDetails: "House 1, Road 2, Test Block",
    items: [
      { productId: p0.id, quantity: 2 },
      { productId: p1.id, quantity: 1 },
    ],
  };

  r = await customer.post("/api/orders", { ...base, items: [] });
  check("empty cart rejected (422)", r.status === 422);

  r = await customer.post("/api/orders", { ...base, areaId: 99999 });
  check("invalid area rejected (422)", r.status === 422);

  r = await customer.post("/api/orders", {
    ...base,
    items: [{ productId: "00000000-0000-4000-8000-000000000000", quantity: 1 }],
  });
  check("unknown product rejected (422)", r.status === 422);

  r = await customer.post("/api/orders", { ...base, couponCode: "WELCOME10" });
  const order = r.json?.data;
  const expectedSubtotal = p0.price * 2 + p1.price;
  const expectedDiscount =
    expectedSubtotal >= 200 ? Math.floor(expectedSubtotal * 0.1) : 0;
  const expectedTotal = expectedSubtotal + area.charge - expectedDiscount;
  orderId = order?.id;
  check("order created (201)", r.status === 201 && Boolean(orderId));
  check(
    "server math correct",
    order?.subtotal === expectedSubtotal &&
      order?.deliveryCharge === area.charge &&
      order?.discount === expectedDiscount &&
      order?.total === expectedTotal,
    JSON.stringify({ got: order, expectedSubtotal, expectedDiscount, expectedTotal }),
  );
  check("order starts pending", order?.status === "pending");

  r = await customer.get("/api/orders");
  check(
    "my orders lists new order with items",
    r.status === 200 &&
      r.json.data.some((o) => o.id === orderId && Array.isArray(o.items) && o.items.length === 2),
  );

  r = await customer.get(`/api/orders/${orderId}`);
  check("order detail readable by owner", r.status === 200 && r.json.data.id === orderId);

  // Ownership: another customer must NOT see it.
  r = await anon.post("/api/auth/login", { email: newUser.email, password: PASSWORD });
  r = await anon.get(`/api/orders/${orderId}`);
  check("other customer cannot read order (404)", r.status === 404, `status ${r.status}`);
});

/* ----------------------------- Role guard tests ---------------------------- */

await section("Role guards", async () => {
  let r = await customer.get("/api/admin/stats");
  check("customer blocked from admin API (403)", r.status === 403);
  r = await customer.get("/api/rider/orders");
  check("customer blocked from rider API (403)", r.status === 403);
  r = await anon.clearCookies?.() ?? null;
  r = await anon.get("/api/admin/stats");
  check("anonymous blocked from admin API (401)", r.status === 401);
  r = await rider.get("/api/admin/stats");
  check("rider blocked from admin API (403)", r.status === 403);

  // Page-level middleware
  r = await anon.get("/admin");
  check("anonymous /admin redirected", r.status === 307 || r.status === 302);
  r = await customer.get("/admin");
  check("customer /admin redirected", r.status === 307 || r.status === 302);
});

/* --------------------------- Order lifecycle tests -------------------------- */

await section("Order lifecycle (admin + rider)", async () => {
  let r = await rider.patch(`/api/rider/orders/${orderId}`, { action: "accept" });
  check("rider cannot accept pending order (409)", r.status === 409);

  r = await admin.patch(`/api/admin/orders/${orderId}`, { status: "confirmed" });
  check("admin confirms order", r.status === 200 && r.json.data.status === "confirmed");

  r = await rider.get("/api/rider/orders");
  check(
    "confirmed order appears in rider queue",
    r.status === 200 && r.json.data.some((o) => o.id === orderId),
  );

  r = await rider.patch(`/api/rider/orders/${orderId}`, { action: "delivered" });
  check("cannot deliver before pickup (409)", r.status === 409);

  r = await rider.patch(`/api/rider/orders/${orderId}`, { action: "accept" });
  check("rider accepts", r.status === 200);
  r = await rider.patch(`/api/rider/orders/${orderId}`, { action: "accept" });
  check("double-accept blocked (409)", r.status === 409);

  r = await rider.patch(`/api/rider/orders/${orderId}`, { action: "picked_up" });
  check("rider picks up", r.status === 200 && r.json.data.status === "picked_up");
  r = await rider.patch(`/api/rider/orders/${orderId}`, { action: "delivered" });
  check(
    "rider delivers, deliveredAt set",
    r.status === 200 && r.json.data.status === "delivered" && Boolean(r.json.data.deliveredAt),
  );

  r = await customer.get(`/api/orders/${orderId}`);
  check(
    "customer sees delivered + rider contact",
    r.status === 200 && r.json.data.status === "delivered" && r.json.data.rider?.phone,
  );

  r = await customer.get("/api/notifications");
  const notifs = r.json?.data ?? [];
  check(
    "customer notified through lifecycle",
    notifs.filter((n) => n.href === `/orders/${orderId}`).length >= 3,
    `got ${notifs.length}`,
  );

  r = await customer.patch("/api/notifications");
  check("mark notifications read", r.status === 200);
  r = await customer.get("/api/notifications");
  check("all read after PATCH", (r.json?.data ?? []).every((n) => n.isRead));
});

/* ------------------------------ Profile tests ------------------------------ */

await section("Profile", async () => {
  let r = await customer.get("/api/auth/profile");
  check("profile readable", r.status === 200 && r.json.data.email === "customer@deliverylagbe.com");
  check("profile does NOT leak passwordHash", !("passwordHash" in (r.json?.data ?? {})));

  r = await customer.patch("/api/auth/profile", { name: "Demo Customer" });
  check("profile update", r.status === 200 && r.json.data.name === "Demo Customer");

  r = await customer.post("/api/auth/change-password", {
    currentPassword: "totally-wrong",
    newPassword: "NewPass12345",
  });
  check("wrong current password rejected (401)", r.status === 401);
});

/* ---------------------------- Admin CRUD smoke ----------------------------- */

await section("Admin CRUD", async () => {
  let r = await admin.get("/api/admin/stats");
  check("stats shape", r.status === 200 && typeof r.json.data.totalRevenue === "number");

  r = await admin.post("/api/admin/products", {
    name: `IT Product ${stamp}`,
    slug: `it-product-${stamp}`,
    categoryId: 1,
    price: 123,
  });
  const prodId = r.json?.data?.id;
  check("create product", r.status === 201 && Boolean(prodId));

  r = await admin.patch(`/api/admin/products/${prodId}`, { price: 150 });
  check("update product price", r.status === 200 && r.json.data.price === 150);

  r = await admin.call("DELETE", `/api/admin/products/${prodId}`);
  check("soft-delete product", r.status === 200);
  r = await anon.get(`/api/products?q=IT Product ${stamp}`);
  check("deleted product hidden from storefront", r.json.data.length === 0);

  r = await admin.post("/api/admin/coupons", {
    code: `IT${stamp.toString().slice(-6)}`,
    type: "fixed",
    value: 30,
    minOrder: 100,
    isActive: true,
  });
  const couponId = r.json?.data?.id;
  check("create coupon", r.status === 201 && Boolean(couponId));
  r = await anon.post("/api/coupons/validate", {
    code: `IT${stamp.toString().slice(-6)}`,
    subtotal: 200,
  });
  check("new coupon validates (fixed 30)", r.status === 200 && r.json.data.discount === 30);
  r = await admin.call("DELETE", `/api/admin/coupons/${couponId}`);
  check("delete coupon", r.status === 200);

  r = await admin.get("/api/admin/users?role=rider");
  check("users filter by role", r.status === 200 && r.json.data.every((u) => u.role === "rider"));
  check(
    "admin user list does NOT leak passwordHash",
    (r.json?.data ?? []).every((u) => !("passwordHash" in u)),
  );
});

/* --------------------------------- Report ---------------------------------- */

console.log(`\n${"=".repeat(50)}`);
console.log(`PASSED: ${passed}  FAILED: ${failed}`);
if (failures.length) {
  console.log("\nFailures:");
  for (const f of failures) console.log(` - ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
  process.exit(1);
}

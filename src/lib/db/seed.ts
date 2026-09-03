/**
 * Seed script — idempotent. Run with: npm run db:seed
 * Populates categories, products, coupons, demo users, and app settings.
 */
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  appSettings,
  categories,
  coupons,
  products,
  users,
} from "./schema";
import seedData from "./seed-data.json";
import { DEFAULT_DELIVERY_CHARGE } from "@/lib/constants";

async function seed() {
  console.log("Seeding KichuLagbe database…");

  /* Categories */
  const categoryRows = await db
    .insert(categories)
    .values(
      seedData.categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        imageUrl: c.image,
        sortOrder: c.sortOrder,
      })),
    )
    .onConflictDoNothing()
    .returning();
  const allCategories = categoryRows.length
    ? categoryRows
    : await db.select().from(categories);
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));
  console.log(`categories: ${allCategories.length}`);

  /* Products */
  const productValues = seedData.products.map((p) => {
    const categoryId = categoryBySlug.get(p.category);
    if (!categoryId) throw new Error(`Unknown category: ${p.category}`);
    return {
      categoryId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      imageUrl: `/images/products/${p.image}`,
    };
  });
  const insertedProducts = await db
    .insert(products)
    .values(productValues)
    .onConflictDoNothing()
    .returning({ id: products.id });
  console.log(`products: ${insertedProducts.length} inserted`);

  /* Coupons — reference coupon plus a live demo one */
  await db
    .insert(coupons)
    .values([
      ...seedData.coupons.map((c) => ({
        code: c.code,
        type: c.type as "fixed" | "percent",
        value: c.value,
        minOrder: c.minOrder ?? 0,
        isActive: c.isActive,
        expiresAt: c.expiry ? new Date(c.expiry) : null,
      })),
      {
        code: "WELCOME10",
        type: "percent" as const,
        value: 10,
        minOrder: 200,
        isActive: true,
        expiresAt: null,
      },
    ])
    .onConflictDoNothing();
  console.log("coupons seeded");

  /* Demo users (password: Password123!) */
  const passwordHash = await bcrypt.hash("Password123!", 10);
  await db
    .insert(users)
    .values([
      {
        name: "Admin",
        email: "admin@kichulagbe.com",
        phone: "+8801700000000",
        passwordHash,
        role: "admin",
        emailVerified: true,
      },
      {
        name: "Demo Rider",
        email: "rider@kichulagbe.com",
        phone: "+8801700000001",
        passwordHash,
        role: "rider",
        emailVerified: true,
      },
      {
        name: "Demo Customer",
        email: "customer@kichulagbe.com",
        phone: "+8801700000002",
        passwordHash,
        role: "customer",
        emailVerified: true,
      },
    ])
    .onConflictDoNothing();
  console.log("demo users seeded (password: Password123!)");

  /* App settings — delivery mode from the reference product, one flat delivery charge */
  await db
    .insert(appSettings)
    .values([
      { key: "deliveryMode", value: "night" },
      { key: "deliveryCharge", value: String(DEFAULT_DELIVERY_CHARGE) },
    ])
    .onConflictDoNothing();
  console.log("app settings seeded");

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

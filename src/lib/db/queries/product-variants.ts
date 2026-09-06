import "server-only";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { productVariants } from "@/lib/db/schema";
import type { ProductVariantInput } from "@/lib/validation/catalog";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Replaces a product's options with `input`, keeping the ids of options that
 * are still present. Ids matter: carts in customers' browsers reference them,
 * and order history links back through them.
 */
export async function syncVariants(tx: Tx, productId: string, input: ProductVariantInput[]) {
  const keepIds = input.flatMap((v) => (v.id ? [v.id] : []));
  await tx
    .delete(productVariants)
    .where(
      keepIds.length
        ? and(eq(productVariants.productId, productId), notInArray(productVariants.id, keepIds))
        : eq(productVariants.productId, productId),
    );

  // Only ids that already belong to this product may be updated — anything
  // else (a stale or foreign id) is treated as a new option.
  const owned = keepIds.length
    ? new Set(
        (
          await tx
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(
              and(eq(productVariants.productId, productId), inArray(productVariants.id, keepIds)),
            )
        ).map((r) => r.id),
      )
    : new Set<string>();

  for (const [sortOrder, variant] of input.entries()) {
    const values = {
      name: variant.name,
      price: variant.price,
      isAvailable: variant.isAvailable ?? true,
      sortOrder,
    };
    if (variant.id && owned.has(variant.id)) {
      await tx.update(productVariants).set(values).where(eq(productVariants.id, variant.id));
    } else {
      await tx.insert(productVariants).values({ ...values, productId });
    }
  }
}

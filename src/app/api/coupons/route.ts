import { and, asc, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";
import type { AvailableCoupon } from "@/types";

/**
 * Coupons a signed-in customer can use right now: active and not yet
 * expired. Shown as a picker at checkout so nobody has to remember a code.
 * Whether one applies to a given cart (minimum order) is still decided by
 * `POST /api/coupons/validate` and again at order time.
 */
export async function GET() {
  try {
    await requireUser();
    const rows: AvailableCoupon[] = await db
      .select({
        code: coupons.code,
        type: coupons.type,
        value: coupons.value,
        minOrder: coupons.minOrder,
        expiresAt: coupons.expiresAt,
      })
      .from(coupons)
      .where(
        and(
          eq(coupons.isActive, true),
          or(isNull(coupons.expiresAt), gt(coupons.expiresAt, new Date())),
        ),
      )
      // Cheapest to unlock first, so the ones that already apply lead.
      .orderBy(asc(coupons.minOrder), asc(coupons.code));
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

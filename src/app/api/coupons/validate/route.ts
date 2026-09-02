import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { couponDiscount } from "@/lib/pricing";
import { validateCouponSchema } from "@/lib/validation/order";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const input = validateCouponSchema.parse(await request.json());

    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.code, input.code.toUpperCase()),
    });
    if (!coupon) throw new ApiError("Invalid coupon code.", 404);
    if (!coupon.isActive) throw new ApiError("This coupon is no longer active.", 410);
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new ApiError("This coupon has expired.", 410);
    }
    if (input.subtotal < coupon.minOrder) {
      throw new ApiError(`Minimum order for this coupon is ৳${coupon.minOrder}.`, 422);
    }

    const discount = couponDiscount(coupon, input.subtotal);
    return ok({ code: coupon.code, type: coupon.type, value: coupon.value, discount });
  } catch (err) {
    return handleApiError(err);
  }
}

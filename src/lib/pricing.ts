import type { Coupon, ProductVariant } from "@/types";

/**
 * Coupon discount for a given subtotal (BDT). Returns 0 when the coupon
 * cannot apply. Shared by the validate endpoint and order placement so the
 * two can never disagree.
 */
export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (!coupon.isActive) return 0;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return 0;
  if (subtotal < coupon.minOrder) return 0;
  const discount =
    coupon.type === "fixed" ? coupon.value : Math.floor((subtotal * coupon.value) / 100);
  return Math.min(discount, subtotal);
}

/** Short customer-facing label for what a coupon gives: "৳50 off" or "10% off". */
export function describeCoupon(coupon: Pick<Coupon, "type" | "value">): string {
  return coupon.type === "fixed" ? `৳${coupon.value} off` : `${coupon.value}% off`;
}

/** Lowest purchasable price — the base price, or the cheapest option on sale. */
export function startingPrice(product: {
  price: number;
  variants: Pick<ProductVariant, "price" | "isAvailable">[];
}) {
  const onSale = product.variants.filter((v) => v.isAvailable);
  return onSale.length ? Math.min(...onSale.map((v) => v.price)) : product.price;
}

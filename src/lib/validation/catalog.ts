import { z } from "zod";

/** Upper bound on options per product — keeps the picker and the form sane. */
export const MAX_VARIANTS = 20;

export const productVariantSchema = z.object({
  /** Present when editing an existing option so its id (and carts holding it) survive. */
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Option name is required").max(60),
  price: z.number().int().min(1, "Price must be at least ৳1"),
  isAvailable: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only")
    .max(140),
  categoryId: z.number().int().positive(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  /** Base price; the "from" price once variants exist. */
  price: z.number().int().min(1, "Price must be at least ৳1"),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  isAvailable: z.boolean().optional(),
  /** Full replacement list — omitted on PATCH leaves variants untouched. */
  variants: z.array(productVariantSchema).max(MAX_VARIANTS).optional(),
});

const couponBaseSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, "Uppercase letters and numbers only")
    .min(3)
    .max(40),
  type: z.enum(["fixed", "percent"]),
  value: z.number().int().min(1),
  minOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().nullable().optional(),
});

const percentCapCheck = (c: { type?: "fixed" | "percent"; value?: number }) =>
  c.type !== "percent" || c.value === undefined || c.value <= 100;

export const couponSchema = couponBaseSchema.refine(percentCapCheck, {
  message: "Percent coupons cannot exceed 100",
  path: ["value"],
});

/** Partial variant for PATCH — keeps the percent ≤ 100 rule. */
export const couponPatchSchema = couponBaseSchema.partial().refine(percentCapCheck, {
  message: "Percent coupons cannot exceed 100",
  path: ["value"],
});

export const deliverySettingsSchema = z.object({
  /** Flat delivery charge in BDT. */
  charge: z.number().int().min(0).max(1000),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type DeliverySettingsInput = z.infer<typeof deliverySettingsSchema>;

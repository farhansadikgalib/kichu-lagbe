import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only")
    .max(140),
  categoryId: z.number().int().positive(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  price: z.number().int().min(1, "Price must be at least ৳1"),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  isAvailable: z.boolean().optional(),
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

export const deliveryAreaSchema = z.object({
  name: z.string().trim().min(1).max(80),
  charge: z.number().int().min(0),
  isActive: z.boolean().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type DeliveryAreaInput = z.infer<typeof deliveryAreaSchema>;

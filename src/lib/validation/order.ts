import { z } from "zod";
import { phoneSchema } from "./common";

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** Accuracy radius in metres, as reported by the Geolocation API. */
  accuracy: z.number().min(0).max(100_000).optional(),
});

export type GeoPoint = z.infer<typeof geoPointSchema>;

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Name is required").max(80),
  phone: phoneSchema,
  addressDetails: z.string().trim().min(5, "Enter your full address").max(500),
  /** Device location pinned at checkout; optional so the address alone still works. */
  location: geoPointSchema.nullable().optional(),
  note: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().max(40).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        /** Chosen option; null/omitted buys the product at its base price. */
        variantId: z.string().uuid().nullable().optional(),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1, "Your cart is empty"),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "picked_up", "delivered", "cancelled"]),
});

export const assignRiderSchema = z.object({
  riderId: z.string().uuid().nullable(),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code").max(40),
  subtotal: z.number().int().min(0),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

import { z } from "zod";
import { phoneSchema } from "./common";

/** Cloudflare Turnstile response token — present only when the widget is configured. */
const turnstileToken = z.string().max(2048).optional();

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: phoneSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  turnstileToken,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  turnstileToken,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phoneSchema.optional(),
  avatarUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

import { z } from "zod";

/** Bangladeshi phone number (+880XXXXXXXXXX or 0XXXXXXXXXX), shared by auth and checkout. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?880\d{10}$|^0\d{10}$/, "Enter a valid Bangladeshi phone number");

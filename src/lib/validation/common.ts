import { z } from "zod";

/** Exact length of a Bangladeshi mobile number written locally (01XXXXXXXXX). */
export const PHONE_LENGTH = 11;

/** Keep digits only and fold a +880 / 880 country prefix back to the local 0. */
export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("880") ? `0${digits.slice(3)}` : digits;
}

/** Bangladeshi mobile number: 11 digits starting with 01, shared by auth, profile, and checkout. */
export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .pipe(
    z
      .string()
      .length(PHONE_LENGTH, `Phone number must be ${PHONE_LENGTH} digits`)
      .regex(/^01\d{9}$/, "Phone number must start with 01"),
  );

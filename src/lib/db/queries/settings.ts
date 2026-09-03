import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { DEFAULT_DELIVERY_CHARGE } from "@/lib/constants";

export const SETTING_KEYS = {
  deliveryMode: "deliveryMode",
  deliveryCharge: "deliveryCharge",
} as const;

/**
 * Flat delivery charge in BDT — one rate for the whole coverage area. Falls
 * back to the default when the setting is missing or malformed so checkout
 * never breaks on an unseeded database.
 */
export async function getDeliveryCharge(): Promise<number> {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, SETTING_KEYS.deliveryCharge),
  });
  const parsed = row ? Number(row.value) : NaN;
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_DELIVERY_CHARGE;
}

export async function setDeliveryCharge(charge: number): Promise<number> {
  await db
    .insert(appSettings)
    .values({ key: SETTING_KEYS.deliveryCharge, value: String(charge) })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: String(charge), updatedAt: new Date() },
    });
  return charge;
}

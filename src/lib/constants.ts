/** Brand + service facts shared across the app (single source of truth). */

export const BRAND = {
  name: "KichuLagbe",
  tagline: "We deliver happiness",
  description:
    "Late-night home delivery of snacks, cigarettes, and daily essentials in Bashundhara R/A.",
} as const;

export const SERVICE = {
  area: "Bashundhara R/A, Dhaka",
  window: "11:30 PM – 3:30 AM",
  /** Delivery window in minutes from local midnight; closes past midnight. */
  openMinutes: 23 * 60 + 30,
  closeMinutes: 3 * 60 + 30,
  avgDeliveryMinutes: 30,
  riderHours: "24/7",
} as const;

/** Whether the delivery window is currently open (window spans midnight). */
export function isServiceOpen(date = new Date()): boolean {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= SERVICE.openMinutes || minutes < SERVICE.closeMinutes;
}

export const CONTACT = {
  phone: "+8801647506948",
  email: "deliveryhobeofficial@gmail.com",
  address: "Bashundhara R/A, Dhaka, Bangladesh",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  picked_up: "Picked up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_FLOW = ["pending", "confirmed", "picked_up", "delivered"] as const;

export const PAYMENT_METHODS = [{ id: "cod", label: "Cash on delivery" }] as const;

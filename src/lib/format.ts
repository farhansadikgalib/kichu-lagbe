/** Formatting helpers — use these everywhere; never inline currency/date logic. */

export function formatBDT(amount: number) {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export function formatDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "12 Sep" from an ISO timestamp or Date. */
export function formatDay(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatOrderNumber(n: number) {
  return `#${String(n).padStart(4, "0")}`;
}

/** "Product · Option" for a cart line or order item; just the product when there is no option. */
export function formatLineName(item: { name: string; variantName?: string | null }): string;
export function formatLineName(item: { productName: string; variantName?: string | null }): string;
export function formatLineName(item: {
  name?: string;
  productName?: string;
  variantName?: string | null;
}) {
  const base = item.name ?? item.productName ?? "";
  return item.variantName ? `${base} · ${item.variantName}` : base;
}

/** Compact currency for chart ticks and stat tiles: ৳950, ৳12.9K, ৳4.2M. */
export function formatCompactBDT(amount: number) {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `৳${trimDecimal(amount / 1_000_000)}M`;
  if (abs >= 1_000) return `৳${trimDecimal(amount / 1_000)}K`;
  return `৳${Math.round(amount)}`;
}

function trimDecimal(n: number) {
  return n.toFixed(1).replace(/\.0$/, "");
}

/** "6 Sep" from a YYYY-MM-DD string (no timezone shift). */
export function formatDayShort(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "Sat, 6 Sep" from a YYYY-MM-DD string (no timezone shift). */
export function formatDayLong(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Hour of day (0–23) as "8 PM" / "12 AM". */
export function formatHour(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
}

/**
 * "just now", "12 min ago", "3 h ago", "Yesterday 21:14", otherwise the full
 * date — for activity lists where recency matters more than the calendar.
 */
export function formatRelativeTime(value: string | Date, now = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24 && date.getDate() === now.getDate()) return `${hours} h ago`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return formatDate(date);
}

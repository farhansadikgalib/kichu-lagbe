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

export function formatOrderNumber(n: number) {
  return `#${String(n).padStart(4, "0")}`;
}

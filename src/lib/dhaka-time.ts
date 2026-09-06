/**
 * Business-day helpers. Reports and filters are bucketed by the calendar day
 * in Dhaka (no DST, fixed +06:00) regardless of where the server runs.
 * Safe to import from client code.
 */

export const DHAKA_TZ = "Asia/Dhaka";
export const DHAKA_OFFSET = "+06:00";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string | null | undefined): value is string {
  return typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));
}

/** A moment's date in Dhaka as YYYY-MM-DD (en-CA formats ISO order). */
export function toDhakaDate(at: Date = new Date()) {
  return at.toLocaleDateString("en-CA", { timeZone: DHAKA_TZ });
}

/** YYYY-MM-DD shifted by whole days (calendar arithmetic, no timezone drift). */
export function shiftIsoDate(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The instant a Dhaka calendar day begins. */
export function startOfDhakaDay(isoDate: string) {
  return new Date(`${isoDate}T00:00:00${DHAKA_OFFSET}`);
}

/** The instant just after a Dhaka calendar day ends (exclusive upper bound). */
export function endOfDhakaDay(isoDate: string) {
  return startOfDhakaDay(shiftIsoDate(isoDate, 1));
}

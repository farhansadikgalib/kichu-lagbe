import { ORDER_STATUS_FLOW } from "@/lib/constants";
import type { OrderStatus } from "@/types";

/** Every status, in the order the admin console lists them. */
export const ORDER_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, "cancelled"];

/** The step after `status` in the happy path, or null when there is none. */
export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);
  return index >= 0 && index < ORDER_STATUS_FLOW.length - 1 ? ORDER_STATUS_FLOW[index + 1] : null;
}

/** Verb for advancing an order from `status`, e.g. pending → "Confirm". */
export const ADVANCE_LABELS: Partial<Record<OrderStatus, string>> = {
  pending: "Confirm",
  confirmed: "Mark picked up",
  picked_up: "Mark delivered",
};

/** Delivered and cancelled orders are closed; nothing further should happen to them. */
export function isClosedStatus(status: OrderStatus) {
  return status === "delivered" || status === "cancelled";
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { KeyedMutator } from "swr";
import { errorMessage } from "@/components/admin/hooks";
import { apiMutate } from "@/lib/api/fetcher";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatOrderNumber } from "@/lib/format";
import type { AdminOrder, AdminOrdersPage, OrderStatus, User } from "@/types";

interface OrderPatch {
  status?: OrderStatus;
  riderId?: string | null;
}

/**
 * Status and rider mutations for the orders board. The row updates
 * optimistically, then the page revalidates so server-side effects (delivery
 * timestamp, notifications, tab counts) are reflected.
 */
export function useOrderActions(mutate: KeyedMutator<AdminOrdersPage>, riders: User[] | undefined) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function update(order: AdminOrder, patch: OrderPatch) {
    const number = formatOrderNumber(order.orderNumber);
    const rider =
      patch.riderId === undefined
        ? undefined
        : patch.riderId === null
          ? null
          : (riders?.find((r) => r.id === patch.riderId) ?? undefined);

    setPendingId(order.id);
    await mutate(
      (current) =>
        current && {
          ...current,
          items: current.items.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  ...(patch.status !== undefined && { status: patch.status }),
                  ...(patch.riderId !== undefined && { riderId: patch.riderId }),
                  ...(rider !== undefined && {
                    rider: rider ? { id: rider.id, name: rider.name, phone: rider.phone } : null,
                  }),
                }
              : o,
          ),
        },
      { revalidate: false },
    );
    try {
      await apiMutate(`/api/admin/orders/${order.id}`, { method: "PATCH", body: patch });
      if (patch.status) {
        toast.success(`${number} marked ${ORDER_STATUS_LABELS[patch.status].toLowerCase()}.`);
      } else if (patch.riderId !== undefined) {
        toast.success(
          patch.riderId ? `${rider?.name ?? "Rider"} assigned to ${number}.` : `Rider removed from ${number}.`,
        );
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      await mutate();
      setPendingId(null);
    }
  }

  return {
    pendingId,
    setStatus: (order: AdminOrder, status: OrderStatus) => update(order, { status }),
    assignRider: (order: AdminOrder, riderId: string | null) => update(order, { riderId }),
  };
}

export type OrderActions = ReturnType<typeof useOrderActions>;

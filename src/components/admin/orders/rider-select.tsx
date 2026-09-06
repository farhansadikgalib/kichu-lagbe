"use client";

import { Bike } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AdminOrder, User } from "@/types";

const UNASSIGNED = "unassigned";

interface RiderSelectProps {
  order: AdminOrder;
  riders: User[] | undefined;
  pending: boolean;
  onAssign: (riderId: string | null) => Promise<void>;
  size?: "sm" | "default";
  className?: string;
}

/** Assign or clear the rider for an order. Highlights unassigned active orders. */
export function RiderSelect({ order, riders, pending, onAssign, size = "sm", className }: RiderSelectProps) {
  const needsRider = order.riderId === null && (order.status === "confirmed" || order.status === "picked_up");
  return (
    <Select
      value={order.riderId ?? UNASSIGNED}
      disabled={pending}
      onValueChange={(value) => void onAssign(value === UNASSIGNED ? null : value)}
    >
      <SelectTrigger
        size={size}
        className={cn(
          "w-full min-w-36",
          needsRider && "border-amber-500/50 text-amber-400 dark:bg-amber-500/10",
          className,
        )}
        aria-label={`Assign rider to order #${order.orderNumber}`}
      >
        <Bike className="size-3.5 shrink-0 opacity-70" aria-hidden />
        <SelectValue placeholder="Assign rider" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
        {riders?.map((rider) => (
          <SelectItem key={rider.id} value={rider.id}>
            {rider.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

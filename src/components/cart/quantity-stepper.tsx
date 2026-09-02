"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Accessible context, e.g. the product name. */
  label?: string;
}

/** Compact − / + quantity control used for cart line items. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  label,
}: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={label ? `Quantity for ${label}` : "Quantity"}
      className="flex items-center rounded-lg border border-border"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-r-none"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
      >
        <Minus />
      </Button>
      <span
        className="w-8 text-center text-sm font-medium tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-l-none"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <Plus />
      </Button>
    </div>
  );
}

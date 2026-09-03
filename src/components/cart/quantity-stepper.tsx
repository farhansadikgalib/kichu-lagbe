"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** When set, the minus button at `min` becomes a remove action instead of disabling. */
  onRemove?: () => void;
  min?: number;
  max?: number;
  /** Accessible context, e.g. the product name. */
  label?: string;
  size?: "default" | "sm";
  className?: string;
}

const controlClass =
  "flex shrink-0 items-center justify-center rounded-full text-primary transition-[background-color,color,transform] duration-150 outline-none select-none hover:bg-primary/15 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4";

/** Pill − / + quantity control, matching the catalog card stepper. */
export function QuantityStepper({
  value,
  onChange,
  onRemove,
  min = 1,
  max = 50,
  label,
  size = "default",
  className,
}: QuantityStepperProps) {
  const atMin = value <= min;
  const removes = atMin && onRemove !== undefined;
  const control = cn(
    controlClass,
    size === "sm" ? "size-7 [&_svg]:size-3.5" : "size-9",
  );

  return (
    <div
      role="group"
      aria-label={label ? `Quantity for ${label}` : "Quantity"}
      className={cn(
        "inline-flex items-center rounded-full bg-primary/12 p-0.5 ring-1 ring-primary/25",
        className,
      )}
    >
      <button
        type="button"
        className={cn(control, removes && "hover:text-destructive")}
        disabled={atMin && !removes}
        onClick={() => (removes ? onRemove() : onChange(value - 1))}
        aria-label={removes ? "Remove from cart" : "Decrease quantity"}
      >
        {removes ? <Trash2 aria-hidden /> : <Minus aria-hidden />}
      </button>
      <span
        className={cn(
          "text-center font-semibold text-primary tabular-nums",
          size === "sm" ? "w-6 text-xs" : "w-8 text-sm",
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={control}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <Plus aria-hidden />
      </button>
    </div>
  );
}

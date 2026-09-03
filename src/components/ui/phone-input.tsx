"use client";

import { Input } from "@/components/ui/input";
import { PHONE_LENGTH } from "@/lib/validation/common";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> {
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * Bangladeshi mobile number field: digits only, capped at 11, numeric keypad on
 * phones, with a live digit counter so users can see when the number is complete.
 */
export function PhoneInput({
  value,
  onValueChange,
  className,
  ...props
}: PhoneInputProps) {
  const complete = value.length === PHONE_LENGTH;
  return (
    <div className="relative">
      <Input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="01XXXXXXXXX"
        maxLength={PHONE_LENGTH}
        value={value}
        onChange={(e) =>
          onValueChange(
            e.target.value.replace(/\D/g, "").slice(0, PHONE_LENGTH),
          )
        }
        className={cn("pr-14 tabular-nums", className)}
        {...props}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs tabular-nums",
          complete ? "text-primary" : "text-muted-foreground",
        )}
      >
        {value.length}/{PHONE_LENGTH}
      </span>
    </div>
  );
}

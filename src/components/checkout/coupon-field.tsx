"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiMutate, FetchError } from "@/lib/api/fetcher";
import { formatBDT } from "@/lib/format";
import type { CouponValidationResult } from "@/types";

interface CouponFieldProps {
  subtotal: number;
  applied: CouponValidationResult | null;
  onApply: (result: CouponValidationResult) => void;
  onRemove: () => void;
}

/** Coupon input with server-side validation and inline success/error feedback. */
export function CouponField({ subtotal, applied, onApply, onRemove }: CouponFieldProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a coupon code");
      return;
    }
    setValidating(true);
    setError(null);
    try {
      const result = await apiMutate<CouponValidationResult>("/api/coupons/validate", {
        body: { code: trimmed, subtotal },
      });
      onApply(result);
      setCode("");
    } catch (err) {
      setError(err instanceof FetchError ? err.message : "Could not validate coupon");
    } finally {
      setValidating(false);
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
        <p className="flex items-center gap-2 text-sm text-emerald-400">
          <BadgeCheck className="size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">{applied.code}</span> applied — you save{" "}
            {formatBDT(applied.discount)}
          </span>
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="coupon-code">Coupon code</Label>
      <div className="mt-2 flex gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. WELCOME50"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "coupon-error" : undefined}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleApply}
          disabled={validating}
        >
          {validating ? "Checking…" : "Apply"}
        </Button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

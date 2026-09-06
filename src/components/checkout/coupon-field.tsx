"use client";

import { useState } from "react";
import { BadgeCheck, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailableCoupons } from "@/hooks/use-catalog";
import { apiMutate, FetchError } from "@/lib/api/fetcher";
import { formatBDT, formatDay } from "@/lib/format";
import { describeCoupon } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { AvailableCoupon, CouponValidationResult } from "@/types";

interface CouponFieldProps {
  subtotal: number;
  applied: CouponValidationResult | null;
  onApply: (result: CouponValidationResult) => void;
  onRemove: () => void;
}

/**
 * Coupon picker: every coupon the customer can use right now, one tap to
 * apply, plus a manual code box for anything not listed. The server is
 * always asked to validate — the list only says what exists, not what the
 * cart qualifies for.
 */
export function CouponField({ subtotal, applied, onApply, onRemove }: CouponFieldProps) {
  const { data: available, error, isLoading, mutate } = useAvailableCoupons(!applied);
  const [code, setCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  /** Code currently being checked with the server (list tap or manual apply). */
  const [validating, setValidating] = useState<string | null>(null);

  async function apply(raw: string) {
    const trimmed = raw.trim().toUpperCase();
    if (!trimmed) {
      setApplyError("Enter a coupon code");
      return;
    }
    setValidating(trimmed);
    setApplyError(null);
    try {
      const result = await apiMutate<CouponValidationResult>("/api/coupons/validate", {
        body: { code: trimmed, subtotal },
      });
      onApply(result);
      setCode("");
    } catch (err) {
      setApplyError(err instanceof FetchError ? err.message : "Could not validate coupon");
    } finally {
      setValidating(null);
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

  const hasList = !!available && available.length > 0;
  // With nothing to pick from, the code box is the only way in — show it.
  const manualOpen = showManual || (!isLoading && !error && !hasList);

  return (
    <div className="space-y-3">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Ticket className="size-4 text-primary" aria-hidden />
          Coupons
        </p>

        {isLoading ? (
          <ul className="mt-2 space-y-2" aria-busy>
            <li>
              <Skeleton className="h-14 w-full" />
            </li>
            <li>
              <Skeleton className="h-14 w-full" />
            </li>
          </ul>
        ) : error ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Couldn&apos;t load your coupons.{" "}
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-auto p-0"
              onClick={() => mutate()}
            >
              Retry
            </Button>
          </p>
        ) : hasList ? (
          <ul className="mt-2 space-y-2">
            {available.map((coupon) => (
              <CouponRow
                key={coupon.code}
                coupon={coupon}
                subtotal={subtotal}
                busy={validating === coupon.code}
                disabled={validating !== null}
                onApply={() => apply(coupon.code)}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No coupons available right now.
          </p>
        )}

        {applyError && !manualOpen && (
          <p role="alert" className="mt-1.5 text-xs text-destructive">
            {applyError}
          </p>
        )}
      </div>

      {manualOpen ? (
        <div>
          <Label htmlFor="coupon-code">Coupon code</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="coupon-code"
              value={code}
              autoFocus={showManual}
              onChange={(e) => {
                setCode(e.target.value);
                if (applyError) setApplyError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void apply(code);
                }
              }}
              placeholder="e.g. WELCOME10"
              autoComplete="off"
              className="uppercase"
              aria-invalid={applyError ? true : undefined}
              aria-describedby={applyError ? "coupon-error" : undefined}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => apply(code)}
              disabled={validating !== null}
            >
              {validating !== null && validating === code.trim().toUpperCase()
                ? "Checking…"
                : "Apply"}
            </Button>
          </div>
          {applyError && (
            <p id="coupon-error" role="alert" className="mt-1.5 text-xs text-destructive">
              {applyError}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowManual(true)}
          className="text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Have a different code?
        </button>
      )}
    </div>
  );
}

function CouponRow({
  coupon,
  subtotal,
  busy,
  disabled,
  onApply,
}: {
  coupon: AvailableCoupon;
  subtotal: number;
  busy: boolean;
  disabled: boolean;
  onApply: () => void;
}) {
  const shortfall = Math.max(0, coupon.minOrder - subtotal);
  const eligible = shortfall === 0;
  const meta = [
    coupon.minOrder > 0 ? `Min. order ${formatBDT(coupon.minOrder)}` : null,
    coupon.expiresAt ? `Until ${formatDay(coupon.expiresAt)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5",
        eligible ? "border-primary/30 bg-primary/5" : "border-border/70 bg-muted/30",
      )}
    >
      <div className="min-w-0">
        <p className="text-sm">
          <span className="font-semibold tracking-wide tabular-nums">{coupon.code}</span>
          <span className="text-muted-foreground"> · {describeCoupon(coupon)}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {eligible ? meta || "No minimum order" : `Add ${formatBDT(shortfall)} more to use`}
        </p>
      </div>
      <Button
        type="button"
        variant={eligible ? "default" : "outline"}
        size="sm"
        onClick={onApply}
        disabled={disabled || !eligible}
        aria-label={`Apply ${coupon.code}`}
      >
        {busy ? "Applying…" : "Apply"}
      </Button>
    </li>
  );
}

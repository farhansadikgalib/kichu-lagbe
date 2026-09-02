"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceSummary } from "@/components/orders/price-summary";
import { formatBDT } from "@/lib/format";

interface OrderSummaryProps {
  itemCount: number;
  subtotal: number;
  deliveryCharge: number | null;
  discount: number;
  couponCode?: string | null;
  total: number;
  submitting: boolean;
  /** Coupon field slot, rendered above the price breakdown. */
  children?: ReactNode;
}

/** Checkout order summary card with the place-order CTA (submits the checkout form). */
export function OrderSummary({
  itemCount,
  subtotal,
  deliveryCharge,
  discount,
  couponCode,
  total,
  submitting,
  children,
}: OrderSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order summary</CardTitle>
        <CardDescription>
          {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {children}
        <PriceSummary
          subtotal={subtotal}
          deliveryCharge={deliveryCharge}
          discount={discount}
          couponCode={couponCode}
          total={total}
        />
        {deliveryCharge === null && (
          <p className="text-xs text-muted-foreground">
            Select a delivery area to see the delivery charge.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Placing order…" : `Place order · ${formatBDT(total)}`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          You&apos;ll pay cash on delivery. Prices are confirmed by the server.
        </p>
      </CardFooter>
    </Card>
  );
}

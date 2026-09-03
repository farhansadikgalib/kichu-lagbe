import { Separator } from "@/components/ui/separator";
import { formatBDT } from "@/lib/format";

interface PriceSummaryProps {
  subtotal: number;
  /** `null` while the delivery charge is still loading. */
  deliveryCharge: number | null;
  discount?: number;
  couponCode?: string | null;
  total: number;
}

/** Price breakdown rows shared by the checkout summary and the order detail page. */
export function PriceSummary({
  subtotal,
  deliveryCharge,
  discount = 0,
  couponCode,
  total,
}: PriceSummaryProps) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="font-medium">{formatBDT(subtotal)}</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Delivery charge</dt>
        <dd className="font-medium">
          {deliveryCharge === null ? "—" : formatBDT(deliveryCharge)}
        </dd>
      </div>
      {discount > 0 && (
        <div className="flex items-center justify-between gap-4 text-emerald-400">
          <dt>Discount{couponCode ? ` (${couponCode})` : ""}</dt>
          <dd className="font-medium">−{formatBDT(discount)}</dd>
        </div>
      )}
      <Separator className="my-3" />
      <div className="flex items-center justify-between gap-4 text-base font-semibold">
        <dt>Total</dt>
        <dd>{formatBDT(total)}</dd>
      </div>
    </dl>
  );
}

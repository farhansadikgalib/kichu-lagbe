import { Banknote } from "lucide-react";
import { PAYMENT_METHODS } from "@/lib/constants";

/** Payment method selector — cash on delivery is currently the only option. */
export function PaymentMethod() {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Payment method</legend>
      <div className="mt-2 space-y-2">
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5"
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              defaultChecked
              className="accent-primary"
            />
            <Banknote className="size-4 text-primary" aria-hidden />
            <span className="text-sm font-medium">{method.label}</span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Pay in cash when your order arrives at your door.
      </p>
    </fieldset>
  );
}

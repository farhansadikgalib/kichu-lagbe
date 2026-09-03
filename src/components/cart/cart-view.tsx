"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { ArrowRight, Banknote, Clock, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { useCartHydrated } from "@/components/cart/use-cart-hydrated";
import { useSession } from "@/hooks/use-session";
import { SERVICE } from "@/lib/constants";
import { formatBDT } from "@/lib/format";
import {
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from "@/stores/cart-store";

const TRUST_CHIPS = [
  { icon: Banknote, label: "Cash on delivery" },
  { icon: Clock, label: `~${SERVICE.avgDeliveryMinutes} min average` },
] as const;

/** Full cart page: compact line items + sticky summary with the checkout gate. */
export function CartView() {
  const router = useRouter();
  const { user } = useSession();
  const items = useCartStore((s) => s.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  // The cart is persisted to localStorage; render a stable skeleton until hydrated.
  const hydrated = useCartHydrated();

  function handleCheckout() {
    router.push(user ? "/checkout" : "/login?next=/checkout");
  }

  if (!hydrated) {
    return (
      <div className="container-page py-8 md:py-12">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-8 md:py-12">
        <Reveal>
          <Card className="mx-auto max-w-md text-center">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShoppingBag className="size-6" aria-hidden />
              </span>
              <div>
                <h1 className="text-lg font-semibold">Your cart is empty</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Late-night cravings? Browse the catalog and add something tasty.
                </p>
              </div>
              <Button asChild>
                <Link href="/">
                  Browse products <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      <Reveal className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Your cart</h1>
          <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={clear}
        >
          <Trash2 aria-hidden /> Clear all
        </Button>
      </Reveal>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <Reveal>
          <Card className="p-0">
            <ul className="divide-y divide-border" aria-label="Cart items">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <CartLineItem
                    key={item.productId}
                    item={item}
                    onQuantityChange={(quantity) =>
                      setQuantity(item.productId, quantity)
                    }
                    onRemove={() => removeItem(item.productId)}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </Card>
          <Button asChild variant="link" size="sm" className="mt-2 px-0 text-muted-foreground">
            <Link href="/category/all">← Continue shopping</Link>
          </Button>
        </Reveal>

        <Reveal delay={0.1} className="lg:sticky lg:top-24">
          <Card className="p-5">
            <h2 className="font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">
                  Subtotal ({count} {count === 1 ? "item" : "items"})
                </dt>
                <dd className="font-medium tabular-nums">{formatBDT(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="text-xs text-muted-foreground">At checkout</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold">Total</p>
              <p className="text-lg font-bold tabular-nums">{formatBDT(subtotal)}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Coupons and delivery charge are applied at checkout.
            </p>
            <Button
              type="button"
              size="lg"
              className="mt-4 w-full"
              onClick={handleCheckout}
            >
              Checkout · {formatBDT(subtotal)} <ArrowRight aria-hidden />
            </Button>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Service facts">
              {TRUST_CHIPS.map((chip) => (
                <li
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <chip.icon className="size-3.5 text-primary" aria-hidden />
                  {chip.label}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

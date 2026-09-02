"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { useCartHydrated } from "@/components/cart/use-cart-hydrated";
import { useSession } from "@/hooks/use-session";
import { formatBDT } from "@/lib/format";
import {
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from "@/stores/cart-store";

/** Full cart page: line items, subtotal summary, and the checkout gate. */
export function CartView() {
  const router = useRouter();
  const { user } = useSession();
  const items = useCartStore((s) => s.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  // The cart is persisted to localStorage; render a stable skeleton until hydrated.
  const hydrated = useCartHydrated();

  function handleCheckout() {
    router.push(user ? "/checkout" : "/login?next=/checkout");
  }

  if (!hydrated) {
    return (
      <div className="container-page py-8 md:py-12">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
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
      <Reveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Your cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} {count === 1 ? "item" : "items"} ready for late-night delivery.
        </p>
      </Reveal>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <Reveal>
          <Card>
            <CardContent>
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
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">{formatBDT(subtotal)}</dd>
                </div>
              </dl>
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground">
                Delivery charge and coupons are applied at checkout.
              </p>
            </CardContent>
            <CardFooter>
              <Button type="button" size="lg" className="w-full" onClick={handleCheckout}>
                Proceed to checkout <ArrowRight />
              </Button>
            </CardFooter>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

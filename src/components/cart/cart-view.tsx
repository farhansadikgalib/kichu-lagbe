"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { useCartHydrated } from "@/components/cart/use-cart-hydrated";
import { useSession } from "@/hooks/use-session";
import { SERVICE } from "@/lib/constants";
import { formatBDT } from "@/lib/format";
import { DURATION, EASE_MOTION } from "@/lib/motion/tokens";
import {
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
  type CartItem,
} from "@/stores/cart-store";

const FACTS = `💵 Cash on delivery · ⚡ ~${SERVICE.avgDeliveryMinutes} min · 📍 ${SERVICE.area}`;

const itemsLabel = (count: number) =>
  `${count} ${count === 1 ? "item" : "items"}`;

const rise = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.page, ease: EASE_MOTION.out },
} as const;

/** Compact, app-style cart: one narrow column, one-line rows, slim total strip. */
export function CartView() {
  const router = useRouter();
  const { user } = useSession();
  const items = useCartStore((s) => s.items);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  // The cart is persisted to localStorage; render a stable skeleton until hydrated.
  const hydrated = useCartHydrated();

  function handleCheckout() {
    router.push(user ? "/checkout" : "/login?next=/checkout");
  }

  function restore(snapshot: CartItem[]) {
    snapshot.forEach(({ quantity, ...item }) => addItem(item, quantity));
  }

  function handleRemove(item: CartItem) {
    removeItem(item.productId);
    toast(`${item.name} removed`, {
      action: { label: "Undo", onClick: () => restore([item]) },
    });
  }

  function handleClear() {
    const snapshot = items;
    clear();
    toast("Bag cleared", {
      action: { label: "Undo", onClick: () => restore(snapshot) },
    });
  }

  if (!hydrated) {
    return (
      <div className="container-page max-w-xl py-6 md:py-10">
        <Skeleton className="h-8 w-36" />
        <div className="mt-5 space-y-px overflow-hidden rounded-xl">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[4.25rem] w-full rounded-none" />
          ))}
        </div>
        <Skeleton className="mt-4 h-28 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex min-h-[60dvh] max-w-xl items-center py-8">
        <motion.div {...rise} className="mx-auto w-full max-w-sm text-center">
          <span aria-hidden className="block text-6xl">
            🛍️
          </span>
          <h1 className="mt-4 text-2xl font-bold">Nothing in your bag</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Midnight craving? The shelf&apos;s stocked and the rider&apos;s
            ready.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/category/all">
              <ShoppingBag aria-hidden /> Start filling it
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="container-page max-w-xl pt-5 pb-36 md:pt-10 md:pb-16">
        <motion.div {...rise}>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">
            Your bag
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
            {itemsLabel(count)}{" "}
            <span className="text-lg font-medium text-muted-foreground">
              for tonight
            </span>
          </h1>
        </motion.div>

        <motion.div {...rise} transition={{ ...rise.transition, delay: 0.05 }}>
          <Card className="mt-4 p-0">
            <ul className="divide-y divide-border" aria-label="Bag items">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <CartLineItem
                    key={item.productId}
                    item={item}
                    onQuantityChange={(quantity) =>
                      setQuantity(item.productId, quantity)
                    }
                    onRemove={() => handleRemove(item)}
                  />
                ))}
              </AnimatePresence>
            </ul>
            <div className="flex items-center justify-between gap-2 border-t border-dashed border-border px-2 py-2 sm:px-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary"
              >
                <Link href="/category/all">
                  <Plus aria-hidden /> Add more
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={handleClear}
              >
                <Trash2 aria-hidden /> Empty bag
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div {...rise} transition={{ ...rise.transition, delay: 0.1 }}>
          <Card className="mt-4 gap-0 p-4 sm:p-5">
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatBDT(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="text-xs text-muted-foreground">
                  by area, at checkout
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="font-heading text-2xl font-bold tabular-nums">
                  {formatBDT(subtotal)}
                </dd>
              </div>
            </dl>
            <Button
              type="button"
              size="lg"
              className="mt-4 hidden w-full md:inline-flex"
              onClick={handleCheckout}
            >
              Checkout · {formatBDT(subtotal)}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {FACTS}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Phone: checkout stays glued above the bottom nav. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.page, ease: EASE_MOTION.out }}
        className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-40 px-3 md:hidden"
      >
        <Button
          type="button"
          size="lg"
          className="h-13 w-full justify-between rounded-2xl px-5 text-base shadow-xl shadow-primary/30"
          onClick={handleCheckout}
        >
          <span>Checkout</span>
          <span className="tabular-nums">{formatBDT(subtotal)}</span>
        </Button>
      </motion.div>
    </MotionConfig>
  );
}

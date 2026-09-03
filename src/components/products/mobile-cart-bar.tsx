"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCartHydrated } from "@/components/cart/use-cart-hydrated";
import { formatBDT } from "@/lib/format";
import { DURATION, EASE_MOTION } from "@/lib/motion/tokens";
import {
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from "@/stores/cart-store";

/**
 * Floating cart summary for small screens, docked above the bottom nav. Shows
 * only once something is in the cart so browsing starts uncluttered.
 */
export function MobileCartBar() {
  const hydrated = useCartHydrated();
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const visible = hydrated && count > 0;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: DURATION.page, ease: EASE_MOTION.out }}
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 md:hidden"
          >
            <Link
              href="/cart"
              className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/90 p-2 pr-3 shadow-2xl shadow-black/40 backdrop-blur-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShoppingBag className="size-5" aria-hidden />
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-[11px] font-bold text-foreground ring-1 ring-primary/40 tabular-nums">
                  {count > 99 ? "99+" : count}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">View cart</span>
                <span className="block text-xs text-muted-foreground tabular-nums">
                  {count} {count === 1 ? "item" : "items"} ·{" "}
                  {formatBDT(subtotal)}
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-primary"
                aria-hidden
              />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { toast } from "sonner";
import { useCartHydrated } from "@/components/cart/use-cart-hydrated";
import { formatBDT } from "@/lib/format";
import { DURATION, EASE_MOTION, REVEAL } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { ProductWithCategory } from "@/types";

const FALLBACK_IMAGE = "/images/products/placeholder.svg";
const MAX_QTY = 50;

interface ProductCardProps {
  product: ProductWithCategory;
  /** Position in the grid — used for a subtle entrance stagger. */
  index?: number;
}

const swap = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: DURATION.micro, ease: EASE_MOTION.out },
} as const;

const controlBase =
  "flex size-9 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4";

/**
 * Catalog tile. The action row is an "Add" control until the product is in the
 * cart, then becomes an inline − / + stepper so quantity is adjusted in place.
 */
export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const hydrated = useCartHydrated();
  const quantity = useCartStore(
    (s) => s.items.find((i) => i.productId === product.id)?.quantity ?? 0,
  );
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  // The cart lives in localStorage — treat it as empty until hydrated so the
  // server and client HTML match.
  const inCart = hydrated ? quantity : 0;

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          duration: DURATION.reveal / 2,
          ease: EASE_MOTION.out,
          // Column-based stagger so each row cascades as it scrolls into view.
          delay: (index % 4) * REVEAL.stagger,
        }}
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 transition-[box-shadow,--tw-ring-color] duration-300",
          inCart > 0
            ? "ring-primary/40 shadow-lg shadow-primary/10"
            : "ring-foreground/10 hover:ring-primary/30 hover:shadow-xl hover:shadow-primary/10",
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.imageUrl ?? FALLBACK_IMAGE}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            // External URLs aren't in images.remotePatterns — bypass the optimizer.
            unoptimized={(product.imageUrl ?? "").startsWith("http")}
          />
          {/* Soft base so the tile reads as one surface with the text below */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-card/70 to-transparent"
          />
          <AnimatePresence>
            {inCart > 0 && (
              <motion.span
                {...swap}
                className="absolute top-2.5 right-2.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums shadow-md shadow-primary/40"
                aria-label={`${inCart} in cart`}
              >
                {inCart}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-3 sm:p-3.5">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {product.category.name}
            </p>
            <h3 className="line-clamp-2 text-sm leading-snug font-medium text-balance">
              {product.name}
            </h3>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2">
            <p className="font-heading text-base font-bold text-primary tabular-nums">
              {formatBDT(product.price)}
            </p>

            <AnimatePresence mode="wait" initial={false}>
              {inCart > 0 ? (
                <motion.div
                  key="stepper"
                  {...swap}
                  role="group"
                  aria-label={`Quantity for ${product.name}`}
                  className="flex items-center rounded-full bg-primary/12 p-0.5 ring-1 ring-primary/25"
                >
                  <button
                    type="button"
                    onClick={() => setQuantity(product.id, inCart - 1)}
                    aria-label={
                      inCart === 1 ? "Remove from cart" : "Decrease quantity"
                    }
                    className={cn(
                      controlBase,
                      "size-8 text-primary hover:bg-primary/15",
                    )}
                  >
                    <Minus aria-hidden />
                  </button>
                  <span
                    aria-live="polite"
                    className="w-7 text-center text-sm font-semibold text-primary tabular-nums"
                  >
                    {inCart}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(product.id, inCart + 1)}
                    disabled={inCart >= MAX_QTY}
                    aria-label="Increase quantity"
                    className={cn(
                      controlBase,
                      "size-8 text-primary hover:bg-primary/15",
                    )}
                  >
                    <Plus aria-hidden />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="add"
                  {...swap}
                  type="button"
                  onClick={handleAdd}
                  aria-label={`Add ${product.name} to cart`}
                  className={cn(
                    controlBase,
                    "bg-primary text-primary-foreground shadow-[0_6px_18px_-6px] shadow-primary/60 hover:bg-primary/90",
                  )}
                >
                  <Plus aria-hidden />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.article>
    </MotionConfig>
  );
}

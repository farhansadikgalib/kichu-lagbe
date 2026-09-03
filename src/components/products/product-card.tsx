"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBDT } from "@/lib/format";
import { DURATION, EASE_MOTION, REVEAL } from "@/lib/motion/tokens";
import { useCartStore } from "@/stores/cart-store";
import type { ProductWithCategory } from "@/types";

const ADDED_FEEDBACK_MS = 1200;
const FALLBACK_IMAGE = "/images/products/placeholder.svg";

interface ProductCardProps {
  product: ProductWithCategory;
  /** Position in the grid — used for a subtle entrance stagger. */
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    toast.success(`${product.name} added to cart`);
    setAdded(true);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setAdded(false), ADDED_FEEDBACK_MS);
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          duration: DURATION.reveal / 2,
          ease: EASE_MOTION.out,
          // Column-based stagger so each row cascades as it scrolls into view.
          delay: (index % 4) * REVEAL.stagger,
        }}
        whileHover={{ y: -4 }}
        className="group h-full"
      >
        <Card
          size="sm"
          className="h-full gap-3 pt-0 transition-shadow duration-200 hover:shadow-lg hover:shadow-primary/10 hover:ring-primary/25"
        >
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={product.imageUrl ?? FALLBACK_IMAGE}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              // External URLs aren't in images.remotePatterns — bypass the optimizer.
              unoptimized={(product.imageUrl ?? "").startsWith("http")}
            />
          </div>
          <CardContent className="flex flex-1 flex-col gap-2.5">
            <div className="flex-1 space-y-1">
              <p className="text-xs text-muted-foreground">{product.category.name}</p>
              <h3 className="line-clamp-2 text-sm leading-snug font-medium">{product.name}</h3>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary tabular-nums">
                {formatBDT(product.price)}
              </p>
              <motion.span
                whileTap={{ scale: 0.92 }}
                transition={{ duration: DURATION.micro, ease: EASE_MOTION.out }}
                className="inline-flex"
              >
                <Button
                  size="sm"
                  onClick={handleAdd}
                  aria-label={`Add ${product.name} to cart`}
                >
                  <motion.span
                    key={added ? "added" : "add"}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: DURATION.micro, ease: EASE_MOTION.out }}
                    className="inline-flex items-center gap-1"
                  >
                    {added ? <Check aria-hidden /> : <Plus aria-hidden />}
                    {added ? "Added" : "Add"}
                  </motion.span>
                </Button>
              </motion.span>
            </div>
          </CardContent>
        </Card>
      </motion.article>
    </MotionConfig>
  );
}

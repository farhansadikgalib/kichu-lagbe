"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ImageOff } from "lucide-react";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { formatBDT } from "@/lib/format";
import { isExternalImage } from "@/lib/media/url";
import { DURATION, EASE_MOTION } from "@/lib/motion/tokens";
import type { CartItem } from "@/stores/cart-store";

interface CartLineItemProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

/** One-line cart row: thumb, name + line total, compact stepper. Minus at 1 removes. */
export function CartLineItem({
  item,
  onQuantityChange,
  onRemove,
}: CartLineItemProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: DURATION.micro, ease: EASE_MOTION.out }}
      className="flex items-center gap-3 overflow-hidden px-3 py-2.5 sm:px-4"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes="48px"
            // A bag is short and above the fold; lazy thumbnails just flash in late.
            loading="eager"
            className="object-cover"
            unoptimized={isExternalImage(item.imageUrl)}
          />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-4" aria-hidden />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {item.name}
          {item.variantName && (
            <span className="font-normal text-muted-foreground"> · {item.variantName}</span>
          )}
        </p>
        <p className="mt-0.5 text-xs tabular-nums">
          <span className="font-semibold">
            {formatBDT(item.price * item.quantity)}
          </span>
          {item.quantity > 1 && (
            <span className="text-muted-foreground">
              {" "}
              · {formatBDT(item.price)} each
            </span>
          )}
        </p>
      </div>

      <QuantityStepper
        size="sm"
        value={item.quantity}
        onChange={onQuantityChange}
        onRemove={onRemove}
        label={item.name}
      />
    </motion.li>
  );
}

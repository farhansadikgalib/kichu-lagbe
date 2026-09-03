"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ImageOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { formatBDT } from "@/lib/format";
import { DURATION, EASE_MOTION } from "@/lib/motion/tokens";
import type { CartItem } from "@/stores/cart-store";

interface CartLineItemProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

/** Compact animated cart row: thumbnail, name + unit price, stepper, line total, remove. */
export function CartLineItem({ item, onQuantityChange, onRemove }: CartLineItemProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: DURATION.micro, ease: EASE_MOTION.out }}
      className="flex items-center gap-3 px-4 py-3 sm:px-5"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="56px"
            className="object-cover"
            // External URLs aren't in images.remotePatterns — bypass the optimizer.
            unoptimized={item.imageUrl.startsWith("http")}
          />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-5" aria-hidden />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {formatBDT(item.price)} × {item.quantity}
        </p>
        <div className="mt-1.5 sm:hidden">
          <QuantityStepper
            value={item.quantity}
            onChange={onQuantityChange}
            label={item.name}
          />
        </div>
      </div>

      <div className="hidden sm:block">
        <QuantityStepper
          value={item.quantity}
          onChange={onQuantityChange}
          label={item.name}
        />
      </div>

      <p className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
        {formatBDT(item.price * item.quantity)}
      </p>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label={`Remove ${item.name} from cart`}
      >
        <X />
      </Button>
    </motion.li>
  );
}

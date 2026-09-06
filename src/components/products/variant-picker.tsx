"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBDT } from "@/lib/format";
import { isExternalImage } from "@/lib/media/url";
import { cartLineKey, MAX_CART_QTY, useCartStore } from "@/stores/cart-store";
import type { ProductWithCategory } from "@/types";

const FALLBACK_IMAGE = "/images/products/placeholder.svg";

interface VariantPickerProps {
  product: ProductWithCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Option chooser for products sold in more than one size / pack. Each option
 * has its own add control so several can go in the bag from one sheet.
 */
export function VariantPicker({ product, open, onOpenChange }: VariantPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3 text-left">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image
              src={product.imageUrl ?? FALLBACK_IMAGE}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
              unoptimized={isExternalImage(product.imageUrl ?? "")}
            />
          </div>
          <div className="min-w-0">
            <DialogTitle className="truncate">{product.name}</DialogTitle>
            <DialogDescription>Pick an option to add to your bag.</DialogDescription>
          </div>
        </DialogHeader>
        <ul className="divide-y divide-border" aria-label={`Options for ${product.name}`}>
          {product.variants.map((variant) => (
            <VariantRow key={variant.id} product={product} variant={variant} />
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function VariantRow({
  product,
  variant,
}: {
  product: ProductWithCategory;
  variant: ProductWithCategory["variants"][number];
}) {
  const key = cartLineKey(product.id, variant.id);
  const quantity = useCartStore((s) => s.items.find((i) => i.key === key)?.quantity ?? 0);
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);

  function handleAdd() {
    addItem({
      productId: product.id,
      variantId: variant.id,
      variantName: variant.name,
      name: product.name,
      price: variant.price,
      imageUrl: product.imageUrl,
    });
    toast.success(`${product.name} · ${variant.name} added to cart`);
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{variant.name}</p>
        <p className="font-heading text-sm font-bold text-primary tabular-nums">
          {formatBDT(variant.price)}
        </p>
      </div>
      {quantity > 0 ? (
        <QuantityStepper
          size="sm"
          value={quantity}
          max={MAX_CART_QTY}
          onChange={(next) => setQuantity(key, next)}
          onRemove={() => setQuantity(key, 0)}
          label={`${product.name} ${variant.name}`}
        />
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          aria-label={`Add ${product.name} ${variant.name} to cart`}
        >
          <Plus data-icon="inline-start" aria-hidden /> Add
        </Button>
      )}
    </li>
  );
}

"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartHydrated } from "@/components/cart/use-cart-hydrated";
import { selectCartCount, useCartStore } from "@/stores/cart-store";

export function CartButton() {
  // The cart is persisted in localStorage — render the badge only after
  // hydration so server and client HTML match.
  const hydrated = useCartHydrated();
  const count = useCartStore(selectCartCount);
  const shown = hydrated ? count : 0;

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/cart" aria-label={shown > 0 ? `Cart, ${shown} items` : "Cart"}>
        <ShoppingBag />
        {shown > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {shown > 9 ? "9+" : shown}
          </span>
        )}
      </Link>
    </Button>
  );
}

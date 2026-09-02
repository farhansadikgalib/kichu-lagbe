"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingBag, User } from "lucide-react";
import { useCartHydrated } from "@/components/cart/use-cart-hydrated";
import { selectCartCount, useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cart", label: "Cart", icon: ShoppingBag, badge: true },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/profile", label: "Account", icon: User },
] as const;

/** Fixed bottom navigation for small screens. */
export function MobileNav() {
  const pathname = usePathname();
  // Badge only after hydration — the persisted cart isn't in server HTML.
  const hydrated = useCartHydrated();
  const count = useCartStore(selectCartCount);
  const cartCount = hydrated ? count : 0;

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-lg md:hidden"
    >
      <ul className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {"badge" in item && item.badge && cartCount > 0 && (
                  <span className="absolute top-1 right-1/2 translate-x-4 rounded-full bg-primary px-1 text-[9px] font-bold leading-3.5 text-primary-foreground">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

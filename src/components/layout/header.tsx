"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { BRAND } from "@/lib/constants";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { DURATION, EASE_GSAP } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { CartButton } from "./cart-button";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/category/snacks", label: "Snacks" },
  { href: "/category/cigarettes", label: "Cigarettes" },
  { href: "/category/daily", label: "Daily" },
] as const;

export function Header() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  // Hide on scroll-down, return on scroll-up; stays put for reduced motion.
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const hide = gsap.to(el, {
          yPercent: -100,
          paused: true,
          duration: DURATION.micro,
          ease: EASE_GSAP.inOut,
        });

        ScrollTrigger.create({
          start: "top top",
          end: "max",
          onUpdate: (self) => {
            if (self.direction === 1 && self.scroll() > 120) {
              hide.play();
            } else {
              hide.reverse();
            }
          },
        });
      });
    },
    { scope: ref },
  );

  return (
    <header
      ref={ref}
      className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg"
    >
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
          <Image
            src="/images/logo.png"
            alt=""
            width={36}
            height={36}
            className="rounded-lg"
            priority
          />
          <span className="text-lg font-bold tracking-tight">
            Kichu<span className="text-primary">Lagbe</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <NotificationsMenu />
          <CartButton />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

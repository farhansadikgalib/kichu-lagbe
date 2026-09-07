"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { FEATURED_SECTION_ID } from "@/components/home/featured-products";
import { BRAND } from "@/lib/constants";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { DURATION, EASE_GSAP, EASE_MOTION } from "@/lib/motion/tokens";
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

/** Header height — keep in sync with the `h-16` bar and the CSS default. */
const HEADER_HEIGHT = "calc(4rem + env(safe-area-inset-top))";

/** Viewport fraction the "Hot right now" section must reach before the nav appears. */
const NAV_REVEAL_AT = 0.8;

export function Header() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const isHome = pathname === "/";

  // On the home page the category nav stays hidden until the "Hot right now"
  // section scrolls into view; everywhere else it's always shown.
  const [navVisible, setNavVisible] = useState(!isHome);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      // Nav reveal: a trigger on the section toggles state at the crossing
      // instead of measuring layout on every scroll frame (the grid above it
      // is server-rendered with fixed aspect boxes, so its offset is stable).
      const section = isHome ? document.getElementById(FEATURED_SECTION_ID) : null;
      setNavVisible(!isHome);
      if (section) {
        ScrollTrigger.create({
          trigger: section,
          start: `top ${NAV_REVEAL_AT * 100}%`,
          end: "max",
          onToggle: (self) => setNavVisible(self.isActive),
        });
      }

      // Sticky toolbars dock beneath the header via this variable. It lives on
      // <html>, so it is written only when the state changes — every write
      // invalidates style for the whole document.
      let offsetHidden: boolean | null = null;
      const setOffset = (hidden: boolean) => {
        if (hidden === offsetHidden) return;
        offsetHidden = hidden;
        document.documentElement.style.setProperty("--header-offset", hidden ? "0px" : HEADER_HEIGHT);
      };
      // The header is fully visible whenever this (re)runs — e.g. after a route change.
      setOffset(false);

      const mm = gsap.matchMedia();

      // Hide on scroll-down, return on scroll-up; stays put for reduced motion.
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
            const hidden = self.direction === 1 && self.scroll() > 120;
            if (hidden) hide.play();
            else hide.reverse();
            setOffset(hidden);
          },
        });
      });
    },
    { scope: ref, dependencies: [isHome] },
  );

  return (
    <header
      ref={ref}
      className="sticky top-0 z-50 pt-[env(safe-area-inset-top)] backdrop-blur-lg"
    >
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label={`${BRAND.name} home`}
        >
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

        <nav
          className={cn(
            "hidden items-center gap-1 transition-[opacity,translate] duration-300 ease-out md:flex motion-reduce:transition-none",
            navVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0",
          )}
          aria-label="Main"
          aria-hidden={!navVisible}
          inert={!navVisible}
        >
          <MotionConfig reducedMotion="user">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-300",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {/* One shared pill slides between links instead of snapping. */}
                  {active && (
                    <motion.span
                      layoutId="header-nav-pill"
                      className="absolute inset-0 rounded-full bg-primary/15"
                      transition={{
                        duration: DURATION.page,
                        ease: EASE_MOTION.out,
                      }}
                      aria-hidden
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </MotionConfig>
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

"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { ChevronDown, Clock, MapPin, ShoppingBag } from "lucide-react";
import { Parallax } from "@/components/motion";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Button } from "@/components/ui/button";
import { BRAND, isServiceOpen, SERVICE } from "@/lib/constants";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { REVEAL } from "@/lib/motion/tokens";

const subscribeNever = () => () => {};

const CRAVE_CHIPS = [
  { emoji: "🍔", label: "Snacks", href: "/category/snacks" },
  { emoji: "🚬", label: "Smokes", href: "/category/cigarettes" },
  { emoji: "🧃", label: "Essentials", href: "/category/daily" },
] as const;

// The entrance is plain CSS so it starts at first paint instead of waiting for
// hydration — a JS-driven entrance would hide the already-visible server HTML
// and replay it, which reads as a flash. Content items rise in after the orbs.
const ENTRANCE_ITEM = "motion-safe:animate-fade-up motion-reduce:animate-fade";
const ENTRANCE_START_S = 0.15;
const entranceDelay = (index: number) => ({
  animationDelay: `${(ENTRANCE_START_S + index * REVEAL.stagger).toFixed(2)}s`,
});
const ORB_ENTRANCE = { animationDuration: "1.2s" };

/** Cinematic home hero: CSS entrance + parallax night-glow orbs + scroll scrub. */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  // Time-dependent, so resolved client-side only to avoid a hydration mismatch.
  const open = useSyncExternalStore(
    subscribeNever,
    () => isServiceOpen(),
    () => null,
  );

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Decorative scrub: content drifts up and dims as the hero scrolls out.
        gsap.to("[data-hero-content]", {
          yPercent: -10,
          opacity: 0.35,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="hero-heading" className="relative overflow-hidden">
      {/* Night-sky glow, decorative only */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid-faint absolute inset-0" />
        <div className="bg-noise absolute inset-0 opacity-[0.035]" />
        <Parallax amount={0.12} className="absolute -top-24 left-1/2 -translate-x-1/2">
          <div
            className="animate-fade h-72 w-72 rounded-full bg-primary/25 blur-3xl sm:h-96 sm:w-96"
            style={ORB_ENTRANCE}
          />
        </Parallax>
        <Parallax amount={0.08} className="absolute top-1/3 -left-24">
          <div
            className="animate-fade h-56 w-56 rounded-full bg-primary/15 blur-3xl"
            style={ORB_ENTRANCE}
          />
        </Parallax>
        <Parallax amount={0.1} className="absolute -right-24 bottom-0">
          <div
            className="animate-fade h-64 w-64 rounded-full bg-primary/10 blur-3xl"
            style={ORB_ENTRANCE}
          />
        </Parallax>
      </div>

      <div
        data-hero-content
        className="container-page relative flex flex-col items-center gap-6 py-24 text-center md:py-36"
      >
        <p
          className={`${ENTRANCE_ITEM} flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-medium text-foreground/90 sm:text-sm`}
          style={entranceDelay(0)}
        >
          {open !== null && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${
                    open
                      ? "bg-emerald-400 motion-safe:animate-pulse"
                      : "bg-muted-foreground/60"
                  }`}
                />
                {open ? "Open now" : "Closed right now"}
              </span>
              <span className="hidden text-primary/50 sm:inline" aria-hidden>
                ·
              </span>
            </>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" aria-hidden />
            {SERVICE.window}
          </span>
          <span className="hidden text-primary/50 sm:inline" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 text-primary" aria-hidden />
            {SERVICE.area}
          </span>
        </p>

        {/* Largest contentful paint: rises into place but is never faded from 0. */}
        <h1
          id="hero-heading"
          className="max-w-3xl text-[2.75rem] leading-[1.05] font-bold text-balance motion-safe:animate-rise sm:text-6xl md:text-7xl"
          style={entranceDelay(1)}
        >
          Midnight cravings?{" "}
          <span className="bg-linear-to-r from-primary via-amber-200 to-yellow-300 bg-clip-text text-transparent">
            Say less.
          </span>
        </h1>

        <p
          className={`${ENTRANCE_ITEM} max-w-xl text-balance text-muted-foreground sm:text-lg`}
          style={entranceDelay(2)}
        >
          {BRAND.tagline} — {BRAND.description.charAt(0).toLowerCase() + BRAND.description.slice(1)}
        </p>

        <div
          className={`${ENTRANCE_ITEM} flex flex-wrap items-center justify-center gap-3`}
          style={entranceDelay(3)}
        >
          <Button asChild size="lg">
            <Link href="/category/all">
              <ShoppingBag aria-hidden /> Start an order
            </Link>
          </Button>
          <InstallAppButton variant="outline" />
        </div>

        <ul
          className={`${ENTRANCE_ITEM} flex flex-wrap items-center justify-center gap-2`}
          style={entranceDelay(4)}
          aria-label="Quick categories"
        >
          {CRAVE_CHIPS.map((chip) => (
            <li key={chip.href}>
              <Link
                href={chip.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
              >
                <span aria-hidden>{chip.emoji}</span>
                {chip.label}
              </Link>
            </li>
          ))}
        </ul>

        <p
          className={`${ENTRANCE_ITEM} text-xs text-muted-foreground`}
          style={entranceDelay(5)}
        >
          At your door in ~{SERVICE.avgDeliveryMinutes} min. No minimum, no drama.
        </p>

        <div aria-hidden className={`${ENTRANCE_ITEM} pt-4`} style={entranceDelay(6)}>
          <ChevronDown className="size-5 text-muted-foreground/70 motion-safe:animate-bounce" />
        </div>
      </div>
    </section>
  );
}

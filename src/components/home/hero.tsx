"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { ChevronDown, Clock, MapPin } from "lucide-react";
import { Parallax } from "@/components/motion";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Button } from "@/components/ui/button";
import { BRAND, isServiceOpen, SERVICE } from "@/lib/constants";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { DURATION, EASE_GSAP, REVEAL } from "@/lib/motion/tokens";

const subscribeNever = () => () => {};

/** Cinematic home hero: GSAP entrance timeline + parallax night-glow orbs. */
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
        gsap
          .timeline({ defaults: { ease: EASE_GSAP.out } })
          .fromTo("[data-hero-orb]", { opacity: 0 }, { opacity: 1, duration: 1.2 })
          .fromTo(
            "[data-hero-item]",
            { opacity: 0, y: REVEAL.distance },
            { opacity: 1, y: 0, duration: DURATION.reveal, stagger: REVEAL.stagger },
            "<0.15",
          );

        // Decorative scrub: content drifts up and dims as the hero scrolls out.
        gsap.to("[data-hero-content]", {
          yPercent: -10,
          opacity: 0.35,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.fromTo(
          "[data-hero-orb], [data-hero-item]",
          { opacity: 0 },
          { opacity: 1, duration: DURATION.reveal },
        );
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="hero-heading" className="relative overflow-hidden">
      {/* Night-sky glow, decorative only */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid-faint absolute inset-0" />
        <Parallax amount={0.12} className="absolute -top-24 left-1/2 -translate-x-1/2">
          <div
            data-hero-orb
            className="h-72 w-72 rounded-full bg-primary/25 blur-3xl sm:h-96 sm:w-96"
          />
        </Parallax>
        <Parallax amount={0.08} className="absolute top-1/3 -left-24">
          <div data-hero-orb className="h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        </Parallax>
        <Parallax amount={0.1} className="absolute -right-24 bottom-0">
          <div data-hero-orb className="h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </Parallax>
      </div>

      <div
        data-hero-content
        className="container-page relative flex flex-col items-center gap-6 py-24 text-center md:py-36"
      >
        <p
          data-hero-item
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-medium text-foreground/90 sm:text-sm"
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

        <h1
          id="hero-heading"
          data-hero-item
          className="max-w-3xl text-[2.75rem] leading-[1.05] font-bold text-balance sm:text-6xl md:text-7xl"
        >
          Late night.{" "}
          <span className="bg-linear-to-r from-primary via-amber-200 to-yellow-300 bg-clip-text text-transparent">
            {BRAND.tagline} ✨
          </span>
        </h1>

        <p data-hero-item className="max-w-xl text-balance text-muted-foreground sm:text-lg">
          {BRAND.description}
        </p>

        <div data-hero-item className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" variant="outline" className="border-primary dark:border-primary">
            <Link href="/category/snacks">Order snacks</Link>
          </Button>
          <InstallAppButton />
          <Button asChild size="lg" variant="outline" className="border-primary dark:border-primary">
            <Link href="/category/all">Browse everything</Link>
          </Button>
        </div>

        <p data-hero-item className="text-xs text-muted-foreground">
          Average delivery in ~{SERVICE.avgDeliveryMinutes} minutes, right to your door.
        </p>

        <div aria-hidden data-hero-item className="pt-4">
          <ChevronDown className="size-5 text-muted-foreground/70 motion-safe:animate-bounce" />
        </div>
      </div>
    </section>
  );
}

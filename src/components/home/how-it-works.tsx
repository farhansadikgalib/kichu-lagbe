"use client";

import { useRef } from "react";
import { MapPin, PackageCheck, Search, ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { SERVICE } from "@/lib/constants";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { SectionHeading } from "./section-heading";

const STEPS = [
  {
    icon: Search,
    title: "Browse",
    description: "Pick from snacks, cigarettes, and daily essentials — all in one place.",
  },
  {
    icon: ShoppingBag,
    title: "Order",
    description: "Add to cart and check out in seconds with cash on delivery.",
  },
  {
    icon: MapPin,
    title: "Track",
    description: "Follow your order from confirmation to pickup in real time.",
  },
  {
    icon: PackageCheck,
    title: "Delivered",
    description: `At your door in ~${SERVICE.avgDeliveryMinutes} minutes on average.`,
  },
] as const;

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);

  // Decorative connector line draws left-to-right as the section scrolls by;
  // reduced-motion users see it fully drawn.
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-step-line]",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 75%", end: "center center", scrub: true },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      aria-labelledby="how-it-works-heading"
      className="border-y border-border/60 bg-sidebar/60"
    >
      <div className="container-page py-16 md:py-24">
        <Reveal>
          <SectionHeading
            id="how-it-works-heading"
            eyebrow="How it works"
            title="From craving to doorstep"
            description="Four simple steps between you and your late-night order."
            align="center"
          />
        </Reveal>

        <div className="relative mt-12">
          <div
            aria-hidden
            className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-px bg-border lg:block"
          >
            <div data-step-line className="h-full origin-left bg-primary/60" />
          </div>

          <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <SpotlightCard
                key={step.title}
                className="flex flex-col items-center gap-3 bg-card/60 p-6 text-center"
              >
                <div className="relative">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <step.icon className="size-6 text-primary" aria-hidden />
                  </div>
                  <span
                    className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="max-w-56 text-sm text-muted-foreground">{step.description}</p>
              </SpotlightCard>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

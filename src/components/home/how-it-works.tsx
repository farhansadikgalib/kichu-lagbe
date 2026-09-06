"use client";

import Link from "next/link";
import { useRef } from "react";
import { ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "@/lib/home/icons";
import type { SectionContent } from "@/lib/home/schema";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { SectionHeading } from "./section-heading";

interface HowItWorksProps {
  content: SectionContent<"howItWorks">;
  headingId: string;
}

export function HowItWorks({ content, headingId }: HowItWorksProps) {
  const ref = useRef<HTMLElement>(null);
  const stepCount = content.steps.length;

  // Scrubbed walkthrough: each step's dot lights up, then its connector
  // segment draws down to the next step. Reduced-motion users see the static
  // track with no glow — content is identical either way.
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const glows = gsap.utils.toArray<HTMLElement>("[data-step-glow]");
        const segments = gsap.utils.toArray<HTMLElement>("[data-step-seg]");
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 65%",
            end: "bottom 75%",
            scrub: true,
          },
        });
        glows.forEach((glow, index) => {
          tl.to(glow, { opacity: 1, duration: 0.15 });
          const segment = segments[index];
          if (segment) {
            tl.fromTo(
              segment,
              { scaleY: 0 },
              { scaleY: 1, duration: 0.35, ease: "none" },
            );
          }
        });
      });
    },
    { scope: ref, dependencies: [stepCount] },
  );

  return (
    <section
      ref={ref}
      aria-labelledby={headingId}
      className="border-y border-border/60 bg-sidebar/60"
    >
      <div className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id={headingId}
            eyebrow={content.eyebrow}
            title={content.title}
            description={content.description}
          />
          {content.facts.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Service facts">
              {content.facts.map((fact, index) => (
                <li
                  key={`${fact.label}-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-sm text-muted-foreground"
                >
                  <HomeIcon name={fact.icon} className="size-3.5 text-primary" />
                  {fact.label}
                </li>
              ))}
            </ul>
          )}
          {content.ctaLabel && (
            <Button asChild size="lg" className="mt-8">
              <Link href={content.ctaHref}>
                <ShoppingBag aria-hidden /> {content.ctaLabel}
              </Link>
            </Button>
          )}
        </Reveal>

        <ol className="relative">
          {content.steps.map((step, index) => (
            <Reveal
              as="li"
              key={`${step.title}-${index}`}
              delay={index * 0.08}
              className="relative pl-20"
            >
              {index < stepCount - 1 && (
                <span
                  aria-hidden
                  className="absolute top-14 bottom-0 left-7 w-px bg-border/80"
                >
                  <span
                    data-step-seg
                    className="block h-full w-full origin-top bg-primary/70"
                  />
                </span>
              )}
              <span
                aria-hidden
                className="absolute top-0 left-0 flex size-14 items-center justify-center rounded-full bg-card ring-1 ring-border"
              >
                <HomeIcon name={step.icon} className="size-6 text-primary" />
                <span
                  data-step-glow
                  className="absolute inset-0 rounded-full bg-primary/10 opacity-0 ring-2 ring-primary/60"
                />
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute top-0 right-0 text-5xl font-bold text-foreground/5 select-none sm:text-6xl"
              >
                0{index + 1}
              </span>
              <div className={index < stepCount - 1 ? "pb-12" : ""}>
                <p className="pt-1 font-mono text-xs font-semibold tracking-widest text-primary uppercase">
                  Step 0{index + 1}
                </p>
                <h3 className="mt-1.5 text-lg font-semibold">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                {step.description && (
                  <p className="mt-1.5 max-w-md text-muted-foreground">{step.description}</p>
                )}
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

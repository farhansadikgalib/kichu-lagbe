import Link from "next/link";
import { ArrowRight, MoonStar } from "lucide-react";
import { Parallax, Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { CONTACT, SERVICE } from "@/lib/constants";

export function CtaStrip() {
  return (
    <section aria-labelledby="cta-heading" className="container-page py-16 md:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-px">
          <div
            aria-hidden
            className="absolute inset-0 animate-border-beam bg-border-beam motion-reduce:animate-none motion-reduce:hidden"
          />
          <div className="relative overflow-hidden rounded-[calc(var(--radius-2xl)-1px)] bg-card px-6 py-12 text-center md:px-12 md:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-transparent"
            />
            <div aria-hidden className="bg-noise pointer-events-none absolute inset-0 opacity-[0.04]" />
          <Parallax
            amount={0.15}
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2"
          >
            <div aria-hidden className="h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          </Parallax>
          <div className="relative mx-auto max-w-xl space-y-4">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
              <MoonStar aria-hidden className="size-3.5 text-primary" />
              Every night · {SERVICE.window}
            </p>
            <h2 id="cta-heading" className="text-3xl font-bold text-balance sm:text-4xl">
              It&apos;s 2 AM and you&apos;re hungry. <span className="text-primary">We&apos;re up.</span>
            </h2>
            <p className="text-muted-foreground text-pretty">
              Snacks, smokes, and essentials at your door in ~{SERVICE.avgDeliveryMinutes} minutes,
              anywhere in {SERVICE.area}. Ordering takes less time than choosing what to watch.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/category/all">
                  Order now <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Questions? Email{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-foreground underline-offset-4 transition-colors hover:underline"
              >
                {CONTACT.email}
              </a>
            </p>
          </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

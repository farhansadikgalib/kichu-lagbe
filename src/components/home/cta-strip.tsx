import Link from "next/link";
import { ArrowRight, MoonStar } from "lucide-react";
import { Parallax, Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { CONTACT } from "@/lib/constants";
import type { SectionContent } from "@/lib/home/schema";

interface CtaStripProps {
  content: SectionContent<"cta">;
  headingId: string;
}

export function CtaStrip({ content, headingId }: CtaStripProps) {
  return (
    <section aria-labelledby={headingId} className="container-page py-16 md:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-px">
          {/* Square sized to the wrapper's longer side so it covers the box at every angle. */}
          <div
            aria-hidden
            className="bg-beam absolute top-1/2 left-1/2 aspect-square min-h-[142%] min-w-[142%] -translate-x-1/2 -translate-y-1/2 animate-spin [animation-duration:5s] motion-reduce:hidden"
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
              {content.badge && (
                <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
                  <MoonStar aria-hidden className="size-3.5 text-primary" />
                  {content.badge}
                </p>
              )}
              <h2 id={headingId} className="text-3xl font-bold text-balance sm:text-4xl">
                {content.title}
                {content.titleAccent && (
                  <>
                    {" "}
                    <span className="text-primary">{content.titleAccent}</span>
                  </>
                )}
              </h2>
              {content.description && (
                <p className="text-muted-foreground text-pretty">{content.description}</p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href={content.ctaHref}>
                    {content.ctaLabel} <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
              {content.showContactEmail && (
                <p className="text-xs text-muted-foreground">
                  Questions? Email{" "}
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="text-foreground underline-offset-4 transition-colors hover:underline"
                  >
                    {CONTACT.email}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

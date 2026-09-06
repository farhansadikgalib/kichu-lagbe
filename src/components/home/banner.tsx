import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";
import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import type { SectionContent } from "@/lib/home/schema";
import { isExternalImage } from "@/lib/media/url";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

interface BannerProps {
  content: SectionContent<"banner">;
  headingId: string;
}

/** Promo panel: uploaded artwork beside a heading, copy and a button. */
export function Banner({ content, headingId }: BannerProps) {
  return (
    <section aria-labelledby={headingId} className="container-page py-8 md:py-12">
      <Reveal>
        <div
          className={cn(
            "grid items-center gap-8 overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-foreground/10 md:grid-cols-2 md:gap-12 md:p-10",
            content.imageSide === "left" && "md:[&>*:first-child]:order-last",
          )}
        >
          <div>
            <SectionHeading
              id={headingId}
              eyebrow={content.eyebrow}
              title={content.title}
              description={content.description}
            />
            {content.ctaLabel && (
              <Button asChild size="lg" className="mt-6">
                <Link href={content.ctaHref}>
                  {content.ctaLabel} <ArrowRight aria-hidden />
                </Link>
              </Button>
            )}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
            {content.image ? (
              <Image
                src={content.image}
                alt={content.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                unoptimized={isExternalImage(content.image)}
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary/25 via-card to-card text-muted-foreground"
              >
                <ImageIcon className="size-10" />
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

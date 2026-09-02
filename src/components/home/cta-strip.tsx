import { Bike, MoonStar, Phone } from "lucide-react";
import { Parallax, Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { CONTACT, SERVICE } from "@/lib/constants";

export function CtaStrip() {
  return (
    <section aria-labelledby="cta-heading" className="container-page py-16 md:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/15 via-card to-card px-6 py-12 text-center md:px-12 md:py-16">
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
            <h2 id="cta-heading" className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              Craving something at 2 AM?
            </h2>
            <p className="text-muted-foreground text-pretty">
              Snacks, smokes, and essentials at your door in ~{SERVICE.avgDeliveryMinutes} minutes,
              anywhere in {SERVICE.area}. Order online or just give us a call — and if you need to
              go somewhere, our riders run {SERVICE.riderHours}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <a href={`tel:${CONTACT.phone}`}>
                  <Phone aria-hidden /> {CONTACT.phone}
                </a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href={`tel:${CONTACT.phone}`} aria-label={`Request a ride — call ${CONTACT.phone}`}>
                  <Bike aria-hidden /> Request a ride
                </a>
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
      </Reveal>
    </section>
  );
}

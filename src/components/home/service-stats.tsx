import { Clock, MapPin, Moon } from "lucide-react";
import { CountUp, Reveal } from "@/components/motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { SERVICE } from "@/lib/constants";

const STATS = [
  {
    icon: Clock,
    value: <CountUp value={SERVICE.avgDeliveryMinutes} prefix="~" suffix=" min" />,
    label: "Average delivery time",
  },
  {
    icon: Moon,
    value: SERVICE.window,
    label: "Nightly delivery window",
  },
  {
    icon: MapPin,
    value: SERVICE.area,
    label: "Full coverage area",
  },
] as const;

export function ServiceStats() {
  return (
    <section aria-label="Service highlights" className="border-y border-border/60 bg-sidebar/60">
      <Reveal stagger className="container-page grid grid-cols-1 gap-4 py-10 sm:grid-cols-3 md:py-12">
        {STATS.map((stat) => (
          <SpotlightCard
            key={stat.label}
            className="flex flex-col items-center gap-2.5 bg-card/60 p-6 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <stat.icon className="size-5 text-primary" aria-hidden />
            </div>
            <p className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </SpotlightCard>
        ))}
      </Reveal>
    </section>
  );
}

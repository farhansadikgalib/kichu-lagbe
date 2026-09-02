import { Clock, MapPin, Moon } from "lucide-react";
import { Reveal } from "@/components/motion";
import { SERVICE } from "@/lib/constants";

const STATS = [
  {
    icon: Clock,
    value: `~${SERVICE.avgDeliveryMinutes} min`,
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
      <Reveal
        stagger
        className="container-page grid grid-cols-1 gap-x-4 gap-y-8 py-10 sm:grid-cols-3 md:py-12"
      >
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-2.5 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
              <stat.icon className="size-5 text-primary" aria-hidden />
            </div>
            <p className="text-base font-bold tracking-tight sm:text-lg">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

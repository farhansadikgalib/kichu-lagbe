import { Banknote, Bike, Clock3, MapPin, Moon, Sparkles } from "lucide-react";
import { SERVICE } from "@/lib/constants";

const ITEMS = [
  { icon: Bike, label: `~${SERVICE.avgDeliveryMinutes} min average delivery` },
  { icon: Moon, label: `Open ${SERVICE.window}` },
  { icon: Banknote, label: "Cash on delivery" },
  { icon: MapPin, label: `Serving ${SERVICE.area}` },
  { icon: Clock3, label: "Order in seconds" },
  { icon: Sparkles, label: "Fresh & sealed products" },
] as const;

/**
 * Infinite benefits ticker under the hero. Pure CSS transform animation
 * (content rendered twice, track slides -50%); pauses on hover and goes
 * static for reduced-motion users.
 */
export function MarqueeStrip() {
  return (
    <section
      aria-label="Service highlights ticker"
      className="overflow-hidden border-t border-border/60 bg-sidebar/60 py-3"
    >
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none">
        <MarqueeRow />
        <MarqueeRow hidden />
      </div>
    </section>
  );
}

function MarqueeRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={`flex shrink-0 items-center ${
        hidden
          ? "motion-reduce:hidden"
          : "motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center"
      }`}
    >
      {ITEMS.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-2 px-5 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:px-7"
        >
          <item.icon className="size-3.5 text-primary" aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

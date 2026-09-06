import { HomeIcon } from "@/lib/home/icons";
import type { SectionContent } from "@/lib/home/schema";

interface MarqueeStripProps {
  content: SectionContent<"marquee">;
}

/**
 * Infinite benefits ticker under the hero. Pure CSS transform animation
 * (content rendered twice, track slides -50%); pauses on hover and goes
 * static for reduced-motion users.
 */
export function MarqueeStrip({ content }: MarqueeStripProps) {
  return (
    <section
      aria-label="Service highlights ticker"
      className="overflow-hidden border-t border-border/60 bg-sidebar/60 py-3"
    >
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none">
        <MarqueeRow items={content.items} />
        <MarqueeRow items={content.items} hidden />
      </div>
    </section>
  );
}

function MarqueeRow({
  items,
  hidden = false,
}: {
  items: SectionContent<"marquee">["items"];
  hidden?: boolean;
}) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={`flex shrink-0 items-center ${
        hidden
          ? "motion-reduce:hidden"
          : "motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center"
      }`}
    >
      {items.map((item, index) => (
        <li
          key={`${item.label}-${index}`}
          className="flex items-center gap-2 px-5 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:px-7"
        >
          <HomeIcon name={item.icon} className="size-3.5 text-primary" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

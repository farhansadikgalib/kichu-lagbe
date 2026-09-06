import { CountUp, Reveal } from "@/components/motion";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { HomeIcon } from "@/lib/home/icons";
import type { SectionContent } from "@/lib/home/schema";

interface ServiceStatsProps {
  content: SectionContent<"stats">;
}

/** "~30 min" → counts the 30 up on scroll; anything without a leading number renders as text. */
function StatValue({ value }: { value: string }) {
  const match = /^([^\d]*)(\d+)(.*)$/.exec(value);
  if (!match) return value;
  const [, prefix, digits, suffix] = match;
  return <CountUp value={Number(digits)} prefix={prefix} suffix={suffix} />;
}

/** Column count follows the number of stats so the row always fills the width. */
const COLUMNS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function ServiceStats({ content }: ServiceStatsProps) {
  const columns = COLUMNS[Math.min(content.items.length, 4)] ?? COLUMNS[3];
  return (
    <section aria-label="Service highlights" className="border-y border-border/60 bg-sidebar/60">
      <Reveal stagger className={`container-page grid grid-cols-1 gap-4 py-10 md:py-12 ${columns}`}>
        {content.items.map((stat, index) => (
          <SpotlightCard
            key={`${stat.label}-${index}`}
            className="flex flex-col items-center gap-2.5 bg-card/60 p-6 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <HomeIcon name={stat.icon} className="size-5 text-primary" />
            </div>
            <p className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
              <StatValue value={stat.value} />
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </SpotlightCard>
        ))}
      </Reveal>
    </section>
  );
}

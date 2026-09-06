import { cn } from "@/lib/utils";

interface ChartTooltipProps {
  /** Horizontal anchor in px within the chart wrapper. */
  x: number;
  /** Chart wrapper width, used to flip the tooltip near the right edge. */
  width: number;
  title: string;
  rows: { label: string; value: string; swatchClass?: string }[];
  className?: string;
}

/** Hover readout for charts — values lead, labels follow, keyed by a short color stroke. */
export function ChartTooltip({ x, width, title, rows, className }: ChartTooltipProps) {
  const flip = x > width * 0.65;
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none absolute top-2 z-10 min-w-32 rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-lg",
        className,
      )}
      style={flip ? { right: width - x + 12 } : { left: x + 12 }}
    >
      <p className="mb-1 font-medium text-muted-foreground">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="flex items-center gap-2">
          {row.swatchClass ? (
            <span className={cn("h-0.5 w-3 shrink-0 rounded-full", row.swatchClass)} aria-hidden />
          ) : null}
          <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
          <span className="text-muted-foreground">{row.label}</span>
        </p>
      ))}
    </div>
  );
}

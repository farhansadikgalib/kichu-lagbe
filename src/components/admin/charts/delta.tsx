import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeltaProps {
  current: number;
  previous: number;
  /** Label for the comparison window, e.g. "vs previous 30 days". */
  compare: string;
  /** Set when a rise is bad news (cancellations). */
  invert?: boolean;
  className?: string;
}

/** Signed change against the previous window, colored by whether the direction is good. */
export function Delta({ current, previous, compare, invert = false, className }: DeltaProps) {
  const pct = previous > 0 ? ((current - previous) / previous) * 100 : null;
  const direction = pct === null ? (current > 0 ? 1 : 0) : Math.sign(Math.round(pct));
  const good = invert ? direction < 0 : direction > 0;
  const bad = invert ? direction > 0 : direction < 0;
  const Icon = direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus;
  const text =
    pct === null
      ? current > 0
        ? "New"
        : "No change"
      : `${pct > 0 ? "+" : ""}${Math.round(pct)}%`;

  return (
    <p className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium",
          good && "text-emerald-400",
          bad && "text-destructive",
          !good && !bad && "text-foreground/70",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {text}
      </span>
      <span>{compare}</span>
    </p>
  );
}

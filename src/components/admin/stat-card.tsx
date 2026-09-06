import type { LucideIcon } from "lucide-react";
import { Delta } from "@/components/admin/charts/delta";
import { Sparkline } from "@/components/admin/charts/sparkline";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Change against the previous window; omitted for lifetime counts. */
  delta?: { current: number; previous: number; compare: string; invert?: boolean };
  /** Per-day values for the window, drawn as a sparkline in the corner. */
  trend?: number[];
  isLoading?: boolean;
}

/** Dashboard stat tile: label, value, optional delta and sparkline, with a loading skeleton. */
export function StatCard({ label, value, icon: Icon, delta, trend, isLoading = false }: StatCardProps) {
  return (
    <Card size="sm" className="relative justify-center">
      <CardContent className="flex items-center gap-3">
        {Icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1.5 h-6 w-20" />
          ) : (
            <p className="truncate text-xl font-semibold tracking-tight">{value}</p>
          )}
          {delta && !isLoading ? (
            <Delta {...delta} className="mt-0.5 whitespace-nowrap" />
          ) : null}
        </div>
      </CardContent>
      {trend && !isLoading ? (
        <Sparkline values={trend} className="absolute top-3 right-3" />
      ) : null}
    </Card>
  );
}

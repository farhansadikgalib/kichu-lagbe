"use client";

import { isServiceOpen, SERVICE } from "@/lib/constants";
import { formatHour } from "@/lib/format";
import { ColumnChart } from "./column-chart";

interface HourColumnsProps {
  /** Orders per hour of day, 24 entries starting at midnight. */
  byHour: number[];
}

/** Whether an hour falls inside the delivery window. */
function inServiceWindow(hour: number) {
  return isServiceOpen(new Date(2000, 0, 1, hour, 30));
}

/** Orders by hour of day; hours inside the delivery window carry the accent. */
export function HourColumns({ byHour }: HourColumnsProps) {
  return (
    <ColumnChart
      values={byHour}
      ariaLabel="Orders by hour of day"
      unit="order"
      label={(i) => (i % 3 === 0 ? formatHour(i) : null)}
      title={(i) => `${formatHour(i)} – ${formatHour((i + 1) % 24)}`}
      emphasis={inServiceWindow}
      legend={
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" aria-hidden />
            Delivery window · {SERVICE.window}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-muted-foreground/40" aria-hidden />
            Outside the window
          </li>
        </ul>
      }
    />
  );
}

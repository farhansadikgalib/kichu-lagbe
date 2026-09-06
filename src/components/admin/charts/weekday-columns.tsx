"use client";

import { ColumnChart } from "./column-chart";

interface WeekdayColumnsProps {
  /** Orders per weekday, 7 entries with Sunday first (Postgres `dow`). */
  byWeekday: number[];
}

/** Bangladeshi week: Saturday first, Friday (the weekend) last. */
const WEEK: { dow: number; short: string; long: string }[] = [
  { dow: 6, short: "Sat", long: "Saturday" },
  { dow: 0, short: "Sun", long: "Sunday" },
  { dow: 1, short: "Mon", long: "Monday" },
  { dow: 2, short: "Tue", long: "Tuesday" },
  { dow: 3, short: "Wed", long: "Wednesday" },
  { dow: 4, short: "Thu", long: "Thursday" },
  { dow: 5, short: "Fri", long: "Friday" },
];

/** Orders by day of the week. */
export function WeekdayColumns({ byWeekday }: WeekdayColumnsProps) {
  return (
    <ColumnChart
      values={WEEK.map((d) => byWeekday[d.dow] ?? 0)}
      ariaLabel="Orders by weekday"
      unit="order"
      label={(i) => WEEK[i].short}
      title={(i) => WEEK[i].long}
    />
  );
}

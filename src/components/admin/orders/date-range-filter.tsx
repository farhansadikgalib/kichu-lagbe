"use client";

import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shiftIsoDate, toDhakaDate } from "@/lib/dhaka-time";
import { cn } from "@/lib/utils";

export type DatePreset = "all" | "today" | "yesterday" | "7d" | "30d" | "custom";

export interface DateRange {
  preset: DatePreset;
  /** YYYY-MM-DD, inclusive; empty when open-ended. */
  from: string;
  to: string;
}

export const ALL_TIME: DateRange = { preset: "all", from: "", to: "" };

const PRESETS: Array<{ value: DatePreset; label: string }> = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range…" },
];

/** Resolves a preset to concrete Dhaka calendar days (today included). */
export function rangeForPreset(preset: DatePreset, previous: DateRange = ALL_TIME): DateRange {
  const today = toDhakaDate();
  switch (preset) {
    case "today":
      return { preset, from: today, to: today };
    case "yesterday": {
      const y = shiftIsoDate(today, -1);
      return { preset, from: y, to: y };
    }
    case "7d":
      return { preset, from: shiftIsoDate(today, -6), to: today };
    case "30d":
      return { preset, from: shiftIsoDate(today, -29), to: today };
    case "custom":
      return { preset, from: previous.from || shiftIsoDate(today, -6), to: previous.to || today };
    default:
      return ALL_TIME;
  }
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

/** Preset picker with from / to inputs for custom windows. Days are Dhaka business days. */
export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select value={value.preset} onValueChange={(preset) => onChange(rangeForPreset(preset as DatePreset, value))}>
        <SelectTrigger aria-label="Date range" className="h-9 min-w-36">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value.preset === "custom" && (
        <div className="flex items-center gap-1.5">
          <Label htmlFor="orders-from" className="sr-only">
            From
          </Label>
          <Input
            id="orders-from"
            type="date"
            value={value.from}
            max={value.to || undefined}
            className="h-9 w-36"
            onChange={(e) => onChange({ ...value, from: e.target.value })}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Label htmlFor="orders-to" className="sr-only">
            To
          </Label>
          <Input
            id="orders-to"
            type="date"
            value={value.to}
            min={value.from || undefined}
            className="h-9 w-36"
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

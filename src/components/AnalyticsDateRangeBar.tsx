"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  defaultAnalyticsRangeQueryState,
  describeRangeQueryState,
  rangeQueryStateToBounds,
  toggleValueFromState,
  type AnalyticsRangeQueryState,
} from "@/lib/analyticsDateRangeClient";

type Props = {
  value: AnalyticsRangeQueryState;
  onChange: (next: AnalyticsRangeQueryState) => void;
  className?: string;
};

export default function AnalyticsDateRangeBar({ value, onChange, className }: Props) {
  const [customOpen, setCustomOpen] = React.useState(false);
  const [pickerRange, setPickerRange] = React.useState<DateRange | undefined>(() => {
    const b = rangeQueryStateToBounds(value.kind === "all" ? defaultAnalyticsRangeQueryState() : value);
    return { from: b.start, to: b.end };
  });

  React.useEffect(() => {
    if (value.kind !== "custom") return;
    setPickerRange({ from: value.start, to: value.end });
  }, [value]);

  const toggleVal = toggleValueFromState(value);
  const isCustom = value.kind === "custom";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Reporting period</Label>
        <p className="text-sm font-medium text-foreground">{describeRangeQueryState(value)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          value={toggleVal}
          onValueChange={(v) => {
            if (!v) return;
            if (v === "30") onChange({ kind: "rolling", days: 30 });
            else if (v === "90") onChange({ kind: "rolling", days: 90 });
            else if (v === "180") onChange({ kind: "rolling", days: 180 });
            else if (v === "365") onChange({ kind: "rolling", days: 365 });
            else if (v === "year") onChange({ kind: "year" });
            else if (v === "all") onChange({ kind: "all" });
            setCustomOpen(false);
          }}
          variant="outline"
          size="sm"
          className="max-w-full flex-wrap justify-start"
        >
          <ToggleGroupItem value="30" aria-label="Last 30 days">
            30d
          </ToggleGroupItem>
          <ToggleGroupItem value="90" aria-label="Last 90 days">
            90d
          </ToggleGroupItem>
          <ToggleGroupItem value="180" aria-label="Last 180 days">
            180d
          </ToggleGroupItem>
          <ToggleGroupItem value="365" aria-label="Last 365 days">
            365d
          </ToggleGroupItem>
          <ToggleGroupItem value="year" aria-label="Year to date">
            YTD
          </ToggleGroupItem>
          <ToggleGroupItem value="all" aria-label="All time">
            All
          </ToggleGroupItem>
        </ToggleGroup>

        <Popover
          open={customOpen}
          onOpenChange={(open) => {
            setCustomOpen(open);
            if (open) {
              const b = rangeQueryStateToBounds(
                value.kind === "all" ? defaultAnalyticsRangeQueryState() : value
              );
              setPickerRange({ from: b.start, to: b.end });
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={isCustom ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Custom
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={pickerRange?.from}
              selected={pickerRange}
              onSelect={(r) => {
                setPickerRange(r);
                if (r?.from && r.to) {
                  onChange({ kind: "custom", start: r.from, end: r.to });
                  setCustomOpen(false);
                }
              }}
            />
            <div className="flex justify-end gap-2 border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCustomOpen(false)}
              >
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

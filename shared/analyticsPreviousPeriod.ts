import { differenceInCalendarDays, endOfDay, startOfDay, subDays } from "date-fns";

/**
 * Calendar window immediately before `[rangeStart, rangeEnd]`, with the same
 * inclusive day count. Used for analytics KPI comparison.
 *
 * Returns `null` when the previous window would start before the Unix epoch,
 * or when inputs are invalid.
 */
export function computePreviousPeriodBounds(
  rangeStart: Date,
  rangeEnd: Date
): { start: Date; end: Date } | null {
  const start = startOfDay(rangeStart);
  const end = endOfDay(rangeEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return null;
  }

  const inclusiveDays = differenceInCalendarDays(end, start) + 1;
  if (inclusiveDays < 1) return null;

  const prevEnd = endOfDay(subDays(start, 1));
  const prevStart = startOfDay(subDays(prevEnd, inclusiveDays - 1));

  if (prevStart.getTime() < 0) return null;
  return { start: prevStart, end: prevEnd };
}

import { subDays, endOfDay, startOfDay } from "date-fns";
import { computePreviousPeriodBounds } from "../../shared/analyticsPreviousPeriod.js";

export type ResolvedAnalyticsDateRange = {
  start: Date;
  end: Date;
};

const MAX_SPAN_DAYS = 731;

/** Default when no query: last 90 days through end of today (local server TZ). */
export function defaultAnalyticsDateRange(): ResolvedAnalyticsDateRange {
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(end, 89));
  return { start, end };
}

function clampSpan(start: Date, end: Date): ResolvedAnalyticsDateRange {
  if (start > end) return defaultAnalyticsDateRange();
  const spanDays = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
  if (spanDays > MAX_SPAN_DAYS) {
    const clampedStart = new Date(end.getTime() - MAX_SPAN_DAYS * 24 * 60 * 60 * 1000);
    return { start: startOfDay(clampedStart), end };
  }
  return { start: startOfDay(start), end: endOfDay(end) };
}

function firstQueryValue(q: unknown): string | undefined {
  if (q == null) return undefined;
  if (Array.isArray(q)) return q[0] != null ? String(q[0]) : undefined;
  return String(q);
}

/**
 * Unified analytics window. Prefer startDate + endDate (ISO). Legacy: days=all | number.
 */
export function resolveAnalyticsDateRangeFromQuery(query: Record<string, unknown>): ResolvedAnalyticsDateRange {
  const startRaw = firstQueryValue(query.startDate);
  const endRaw = firstQueryValue(query.endDate);

  if (startRaw != null && startRaw.trim() !== "" && endRaw != null && endRaw.trim() !== "") {
    const start = new Date(startRaw);
    const end = new Date(endRaw);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return defaultAnalyticsDateRange();
    }
    return clampSpan(start, end);
  }

  const daysParam = firstQueryValue(query.days);
  if (daysParam === "all") {
    const end = endOfDay(new Date());
    return { start: new Date(0), end };
  }

  if (daysParam != null && String(daysParam).trim() !== "") {
    const n = parseInt(String(daysParam), 10);
    if (!Number.isNaN(n) && n > 0) {
      const bounded = Math.min(3650, Math.max(1, n));
      const end = endOfDay(new Date());
      const start = startOfDay(subDays(end, bounded - 1));
      return { start, end };
    }
  }

  return defaultAnalyticsDateRange();
}

export function dateRangeToJson(range: ResolvedAnalyticsDateRange) {
  return {
    start: range.start.toISOString(),
    end: range.end.toISOString(),
  };
}

/** Same inclusive length as `range`, ending the day before `range.start`. */
export function resolvePreviousAnalyticsDateRange(
  range: ResolvedAnalyticsDateRange
): ResolvedAnalyticsDateRange | null {
  const prev = computePreviousPeriodBounds(range.start, range.end);
  if (!prev) return null;
  return { start: prev.start, end: prev.end };
}

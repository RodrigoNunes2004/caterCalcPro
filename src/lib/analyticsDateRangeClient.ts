import { endOfDay, format, startOfDay, startOfYear, subDays } from "date-fns";

/** URL param for analytics period (short name to leave room for other query keys). */
export const ANALYTICS_RANGE_PARAM = "ar";

/** Matches server `defaultAnalyticsDateRange` (last 90 days through end of today). */
export type AnalyticsRangeQueryState =
  | { kind: "rolling"; days: 30 | 90 | 180 | 365 }
  | { kind: "year" }
  | { kind: "all" }
  | { kind: "custom"; start: Date; end: Date };

export function defaultAnalyticsRangeQueryState(): AnalyticsRangeQueryState {
  return { kind: "rolling", days: 90 };
}

export function rangeQueryStateToBounds(
  state: AnalyticsRangeQueryState
): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  if (state.kind === "rolling") {
    return {
      start: startOfDay(subDays(end, state.days - 1)),
      end,
    };
  }
  if (state.kind === "year") {
    return { start: startOfYear(new Date()), end };
  }
  if (state.kind === "custom") {
    return {
      start: startOfDay(state.start),
      end: endOfDay(state.end),
    };
  }
  return {
    start: startOfDay(subDays(end, 89)),
    end,
  };
}

/** Query string for `/api/analytics/*` (and GST); use `days=all` for all-time snapshots. */
export function rangeQueryStateToSearchParams(state: AnalyticsRangeQueryState): string {
  const p = new URLSearchParams();
  if (state.kind === "all") {
    p.set("days", "all");
    return p.toString();
  }
  const { start, end } = rangeQueryStateToBounds(state);
  p.set("startDate", start.toISOString());
  p.set("endDate", end.toISOString());
  return p.toString();
}

export function describeRangeQueryState(state: AnalyticsRangeQueryState): string {
  if (state.kind === "all") return "All time";
  const { start, end } = rangeQueryStateToBounds(state);
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

const ROLLING_URL = new Set(["30", "90", "180", "365"]);

/** Read analytics period from the page URL (bookmarks / refresh). */
export function parseAnalyticsRangeFromSearchParams(
  searchParams: URLSearchParams
): AnalyticsRangeQueryState {
  const ar = searchParams.get(ANALYTICS_RANGE_PARAM);
  if (ar === "all") return { kind: "all" };
  if (ar === "ytd") return { kind: "year" };
  if (ar === "custom") {
    const s = searchParams.get("startDate");
    const e = searchParams.get("endDate");
    if (s && e) {
      const start = new Date(s);
      const end = new Date(e);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        return { kind: "custom", start, end };
      }
    }
    return defaultAnalyticsRangeQueryState();
  }
  if (ar && ROLLING_URL.has(ar)) {
    return { kind: "rolling", days: Number(ar) as 30 | 90 | 180 | 365 };
  }
  // Deep links with only dates (no ar=custom)
  const s = searchParams.get("startDate");
  const e = searchParams.get("endDate");
  if (s && e) {
    const start = new Date(s);
    const end = new Date(e);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return { kind: "custom", start, end };
    }
  }
  if (searchParams.get("days") === "all") return { kind: "all" };
  return defaultAnalyticsRangeQueryState();
}

/** Params to store in the URL for the analytics period (not the API query string). */
export function analyticsRangeStateToUrlParams(
  state: AnalyticsRangeQueryState
): URLSearchParams {
  const p = new URLSearchParams();
  if (state.kind === "all") {
    p.set(ANALYTICS_RANGE_PARAM, "all");
    return p;
  }
  if (state.kind === "year") {
    p.set(ANALYTICS_RANGE_PARAM, "ytd");
    return p;
  }
  if (state.kind === "rolling") {
    p.set(ANALYTICS_RANGE_PARAM, String(state.days));
    return p;
  }
  const { start, end } = rangeQueryStateToBounds(state);
  p.set(ANALYTICS_RANGE_PARAM, "custom");
  p.set("startDate", start.toISOString());
  p.set("endDate", end.toISOString());
  return p;
}

export function toggleValueFromState(
  state: AnalyticsRangeQueryState
): "30" | "90" | "180" | "365" | "year" | "all" | undefined {
  if (state.kind === "rolling" && state.days === 30) return "30";
  if (state.kind === "rolling" && state.days === 90) return "90";
  if (state.kind === "rolling" && state.days === 180) return "180";
  if (state.kind === "rolling" && state.days === 365) return "365";
  if (state.kind === "year") return "year";
  if (state.kind === "all") return "all";
  return undefined;
}

import { computePreviousPeriodBounds } from "../../shared/analyticsPreviousPeriod";

/** Query string (`startDate` + `endDate`) for the period immediately before the resolved window. */
export function previousPeriodToSearchParams(startIso: string, endIso: string): string | null {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const prev = computePreviousPeriodBounds(start, end);
  if (!prev) return null;
  const p = new URLSearchParams();
  p.set("startDate", prev.start.toISOString());
  p.set("endDate", prev.end.toISOString());
  return p.toString();
}

import { describe, expect, it } from "vitest";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { computePreviousPeriodBounds } from "./analyticsPreviousPeriod.ts";

/** Calendar day in UTC (tests assume `TZ=UTC` via npm script). */
function utcDay(isoDate: string): Date {
  return parseISO(`${isoDate}T12:00:00.000Z`);
}

describe("computePreviousPeriodBounds", () => {
  it("returns null when start is after end", () => {
    expect(
      computePreviousPeriodBounds(utcDay("2024-02-10"), utcDay("2024-02-01"))
    ).toBeNull();
  });

  it("returns null when a bound is NaN", () => {
    expect(computePreviousPeriodBounds(new Date("invalid"), utcDay("2024-01-01"))).toBeNull();
    expect(computePreviousPeriodBounds(utcDay("2024-01-01"), new Date("invalid"))).toBeNull();
  });

  it("computes a single-day prior window", () => {
    const curStart = utcDay("2024-06-15");
    const curEnd = utcDay("2024-06-15");
    const prev = computePreviousPeriodBounds(curStart, curEnd);
    expect(prev).not.toBeNull();
    expect(startOfDay(prev!.start).toISOString().slice(0, 10)).toBe("2024-06-14");
    expect(endOfDay(prev!.end).toISOString().slice(0, 10)).toBe("2024-06-14");
  });

  it("computes a three-day prior window", () => {
    const curStart = utcDay("2024-01-10");
    const curEnd = utcDay("2024-01-12");
    const prev = computePreviousPeriodBounds(curStart, curEnd);
    expect(prev).not.toBeNull();
    expect(startOfDay(prev!.start).toISOString().slice(0, 10)).toBe("2024-01-07");
    expect(endOfDay(prev!.end).toISOString().slice(0, 10)).toBe("2024-01-09");
  });

  it("handles February in a leap year", () => {
    const curStart = utcDay("2024-02-01");
    const curEnd = utcDay("2024-02-29");
    const prev = computePreviousPeriodBounds(curStart, curEnd);
    expect(prev).not.toBeNull();
    expect(startOfDay(prev!.start).toISOString().slice(0, 10)).toBe("2024-01-03");
    expect(endOfDay(prev!.end).toISOString().slice(0, 10)).toBe("2024-01-31");
  });

  it("returns null when the prior window would start before the Unix epoch", () => {
    const curStart = utcDay("1970-01-01");
    const curEnd = utcDay("1970-01-01");
    expect(computePreviousPeriodBounds(curStart, curEnd)).toBeNull();
  });

  it("returns null for a two-day window straddling the epoch that would push prior before 0", () => {
    const curStart = utcDay("1970-01-02");
    const curEnd = utcDay("1970-01-03");
    expect(computePreviousPeriodBounds(curStart, curEnd)).toBeNull();
  });
});

import { getAnalyticsOverview, getCostTrends } from "./analyticsService.js";
import type { ResolvedAnalyticsDateRange } from "./analyticsDateRange.js";
import { dateRangeToJson, resolvePreviousAnalyticsDateRange } from "./analyticsDateRange.js";

function csvCell(value: string | number): string {
  const s = String(value);
  if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvLine(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

export async function buildAnalyticsSummaryCsv(
  organizationId: string,
  range: ResolvedAnalyticsDateRange
): Promise<string> {
  const current = await getAnalyticsOverview(organizationId, range);
  const prevRange = resolvePreviousAnalyticsDateRange(range);
  const previous = prevRange
    ? await getAnalyticsOverview(organizationId, prevRange)
    : null;
  const trends = await getCostTrends(organizationId, range);

  const cur = dateRangeToJson(range);
  const lines: string[] = [];

  lines.push(csvLine(["Gastro Grid — Analytics summary export"]));
  lines.push(csvLine(["Current period start (ISO)", cur.start]));
  lines.push(csvLine(["Current period end (ISO)", cur.end]));
  if (previous && prevRange) {
    const p = dateRangeToJson(prevRange);
    lines.push(csvLine(["Previous period start (ISO)", p.start]));
    lines.push(csvLine(["Previous period end (ISO)", p.end]));
  } else {
    lines.push(csvLine(["Previous period", "N/A (not computable for this range)"]));
  }

  lines.push("");
  lines.push(csvLine(["Metric", "Current", "Previous", "Delta"]));

  const rows: Array<[string, number, number | null]> = [
    ["Profit_snapshots", current.monthlyProfit, previous?.monthlyProfit ?? null],
    [
      "Average_margin_percent",
      current.averageMarginPercent,
      previous?.averageMarginPercent ?? null,
    ],
    ["Inventory_movement", current.inventorySpend, previous?.inventorySpend ?? null],
    [
      "Event_snapshot_count",
      current.snapshotCount,
      previous?.snapshotCount ?? null,
    ],
  ];

  for (const [label, a, b] of rows) {
    const delta = b == null ? "" : Math.round((a - b) * 100) / 100;
    lines.push(csvLine([label, a, b ?? "", delta]));
  }

  lines.push("");
  lines.push(csvLine(["Cost & profit trend (event snapshots in current period)"]));
  lines.push(csvLine(["Snapshot_created_at_ISO", "Profit", "Total_cost", "Profit_margin_pct", "Guest_count"]));
  for (const t of trends) {
    lines.push(
      csvLine([
        typeof t.createdAt === "string" ? t.createdAt : String(t.createdAt),
        t.profit,
        t.totalCost,
        t.profitMargin,
        t.guestCount,
      ])
    );
  }

  return lines.join("\r\n");
}

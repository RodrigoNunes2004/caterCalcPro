import type PDFDocument from "pdfkit";
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

async function loadAnalyticsSummaryExportContext(
  organizationId: string,
  range: ResolvedAnalyticsDateRange
) {
  const current = await getAnalyticsOverview(organizationId, range);
  const prevRange = resolvePreviousAnalyticsDateRange(range);
  const previous = prevRange
    ? await getAnalyticsOverview(organizationId, prevRange)
    : null;
  const trends = await getCostTrends(organizationId, range);
  return { current, previous, prevRange, trends };
}

export async function buildAnalyticsSummaryCsv(
  organizationId: string,
  range: ResolvedAnalyticsDateRange
): Promise<string> {
  const { current, previous, prevRange, trends } = await loadAnalyticsSummaryExportContext(
    organizationId,
    range
  );

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

/** Same data as CSV; runtime `import("pdfkit")` to match GST export pattern. */
export async function buildAnalyticsSummaryPdf(
  organizationId: string,
  range: ResolvedAnalyticsDateRange
): Promise<Buffer> {
  const { current, previous, prevRange, trends } = await loadAnalyticsSummaryExportContext(
    organizationId,
    range
  );
  const cur = dateRangeToJson(range);
  const mod = await import("pdfkit");
  const PDF = mod.default as typeof PDFDocument;

  const metricRows: Array<[string, number, number | null]> = [
    ["Profit (snapshots)", current.monthlyProfit, previous?.monthlyProfit ?? null],
    ["Average margin %", current.averageMarginPercent, previous?.averageMarginPercent ?? null],
    ["Inventory movement", current.inventorySpend, previous?.inventorySpend ?? null],
    ["Event snapshot count", current.snapshotCount, previous?.snapshotCount ?? null],
  ];

  return new Promise((resolve, reject) => {
    const doc = new PDF({ margin: 48, size: "A4", info: { Title: "Analytics summary" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Standard PDF fonts (Helvetica) omit many Unicode glyphs; use ASCII only.
    doc.fontSize(16).text("Gastro Grid - Analytics summary", { underline: false });
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#444444");
    doc.text(`Generated ${new Date().toISOString()}`, { width: 500 });
    doc.text(
      `Current period: ${cur.start.slice(0, 10)} to ${cur.end.slice(0, 10)} (date UTC)`,
      { width: 500 }
    );
    if (previous && prevRange) {
      const p = dateRangeToJson(prevRange);
      doc.text(`Previous period: ${p.start.slice(0, 10)} to ${p.end.slice(0, 10)}`, { width: 500 });
    } else {
      doc.text("Previous period: N/A (not computable for this range)", { width: 500 });
    }
    doc.fillColor("#000000");
    doc.moveDown();

    doc.fontSize(12).text("Summary KPIs", { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(9);
    const fmtMoney = (n: number) => `$${Number(n).toFixed(2)}`;
    const fmtNum = (n: number) => Number(n).toFixed(2);
    for (const [label, a, b] of metricRows) {
      const isCount = label.includes("count");
      const curTxt = isCount ? String(Math.round(a)) : label.includes("margin") ? `${fmtNum(a)}%` : fmtMoney(a);
      if (b == null) {
        doc.text(`${label}: ${curTxt} | prior: N/A`, { width: 500 });
      } else {
        const prevTxt = isCount ? String(Math.round(b)) : label.includes("margin") ? `${fmtNum(b)}%` : fmtMoney(b);
        const d = Math.round((a - b) * 100) / 100;
        let deltaLine: string;
        if (isCount) {
          const sign = d > 0 ? "+" : "";
          deltaLine = `${sign}${d} vs prior`;
        } else if (label.includes("margin")) {
          const sign = d > 0 ? "+" : "";
          deltaLine = `${sign}${fmtNum(d)} pp vs prior`;
        } else {
          const sign = d > 0 ? "+" : d < 0 ? "-" : "";
          const body = `$${Math.abs(d).toFixed(2)}`;
          deltaLine = d === 0 ? `$0.00 vs prior` : `${sign}${body} vs prior`;
        }
        doc.text(`${label}: ${curTxt} | prior: ${prevTxt} | ${deltaLine}`, { width: 500 });
      }
      doc.moveDown(0.35);
    }

    doc.moveDown(0.5);
    doc.fontSize(12).text("Cost & profit trend (snapshots in current period)", { underline: true });
    doc.fontSize(8).fillColor("#333333");
    doc.text("Snapshot time | Profit | Total cost | Margin % | Guests", { width: 500 });
    doc.fillColor("#000000");
    doc.moveDown(0.2);
    doc.fontSize(8);
    for (const t of trends) {
      if (doc.y > 720) doc.addPage();
      const raw = t.createdAt;
      const iso = raw instanceof Date ? raw.toISOString() : String(raw);
      const ts = iso.slice(0, 19).replace("T", " ");
      doc.text(
        `${ts} | $${Number(t.profit).toFixed(2)} | $${Number(t.totalCost).toFixed(2)} | ${Number(t.profitMargin).toFixed(2)}% | ${t.guestCount}`,
        { width: 500 }
      );
      doc.moveDown(0.15);
    }

    doc.end();
  });
}

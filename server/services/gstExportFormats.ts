import type PDFDocument from "pdfkit";
import type { EventSnapshotsGstSummary, GstSummaryPayload } from "./gstReportingService.js";

function formatSnapshotPeriodLine(ev: EventSnapshotsGstSummary): string {
  if (ev.dateRange) {
    const y = new Date(ev.dateRange.start).getUTCFullYear();
    if (y < 1980) return "all time (snapshots)";
    return `${ev.dateRange.start.slice(0, 10)} → ${ev.dateRange.end.slice(0, 10)}`;
  }
  if (ev.periodDays == null) return "—";
  return `${ev.periodDays} day(s)`;
}

function escapeCsvField(value: string | number | boolean | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvLine(fields: (string | number | boolean)[]): string {
  return fields.map((f) => escapeCsvField(f)).join(",");
}

/** UTF-8 CSV: inventory block, snapshot totals, then event rows (same data as JSON summary). */
export function buildGstSummaryCsv(payload: GstSummaryPayload): string {
  const lines: string[] = [];
  const iso = new Date().toISOString();

  lines.push(csvLine(["report", "Gastro Grid GST summary"]));
  lines.push(csvLine(["generatedAt", iso]));
  lines.push(csvLine(["gstRate", payload.gstRate]));
  lines.push(csvLine(["currency", payload.currency]));
  lines.push(csvLine(["region", payload.region]));
  lines.push(csvLine(["targetPriceMode", payload.eventSnapshots.assumeTargetPriceGstInclusive ? "gst_inclusive" : "gst_exclusive"]));
  if (payload.eventSnapshots.dateRange) {
    const y = new Date(payload.eventSnapshots.dateRange.start).getUTCFullYear();
    const isAllTime = y < 1980;
    lines.push(csvLine(["snapshotPeriod", isAllTime ? "all_time" : "date_range"]));
    lines.push(csvLine(["snapshotRangeStart", payload.eventSnapshots.dateRange.start]));
    lines.push(csvLine(["snapshotRangeEnd", payload.eventSnapshots.dateRange.end]));
  } else {
    lines.push(
      csvLine([
        "snapshotPeriodDays",
        payload.eventSnapshots.periodDays == null ? "" : String(payload.eventSnapshots.periodDays),
      ])
    );
  }
  lines.push("");

  lines.push(csvLine(["section", "inventory"]));
  lines.push(csvLine(["lineCount", payload.inventory.lineCount]));
  lines.push(csvLine(["totalExclusive", payload.inventory.totalExclusive]));
  lines.push(csvLine(["totalGst", payload.inventory.totalGst]));
  lines.push(csvLine(["totalInclusive", payload.inventory.totalInclusive]));
  lines.push("");

  lines.push(csvLine(["section", "event_snapshot_totals"]));
  const t = payload.eventSnapshots.totals;
  lines.push(csvLine(["sumTotalCost", t.sumTotalCost]));
  lines.push(csvLine(["sumTargetPrice", t.sumTargetPrice]));
  lines.push(csvLine(["sumProfit", t.sumProfit]));
  lines.push(csvLine(["sumGstOnTarget", t.sumGstOnTarget]));
  lines.push(csvLine(["sumTargetExclusive", t.sumTargetExclusive]));
  lines.push("");

  lines.push(
    csvLine([
      "eventName",
      "eventDate",
      "snapshotCreatedAt",
      "totalCost",
      "targetPrice",
      "profit",
      "targetExclusive",
      "gstOnTarget",
    ])
  );
  for (const row of payload.eventSnapshots.rows) {
    lines.push(
      csvLine([
        row.eventName,
        row.eventDate || "",
        row.snapshotCreatedAt || "",
        row.totalCost,
        row.targetPrice,
        row.profit,
        row.targetExclusive,
        row.gstOnTarget,
      ])
    );
  }
  lines.push("");

  lines.push(csvLine(["section", "assumptions"]));
  payload.assumptions.forEach((a, i) => {
    lines.push(csvLine([`assumption_${i + 1}`, a]));
  });

  return lines.join("\r\n");
}

/** Runtime `import("pdfkit")` only — avoids loading pdfkit during Vercel cold start for unrelated routes. */
export async function buildGstSummaryPdf(payload: GstSummaryPayload): Promise<Buffer> {
  const mod = await import("pdfkit");
  const PDF = mod.default as typeof PDFDocument;
  return new Promise((resolve, reject) => {
    const doc = new PDF({ margin: 48, size: "A4", info: { Title: "GST summary (NZ)" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text("GST summary (New Zealand)", { underline: false });
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .fillColor("#444444")
      .text(
        `Generated ${new Date().toISOString()} · ${payload.currency} · GST ${(payload.gstRate * 100).toFixed(0)}% · Target price: ${payload.eventSnapshots.assumeTargetPriceGstInclusive ? "GST-inclusive" : "GST-exclusive"} · Snapshots: ${formatSnapshotPeriodLine(payload.eventSnapshots)}`,
        { width: 500 }
      );
    doc.fillColor("#000000");
    doc.moveDown();

    doc.fontSize(12).text("Inventory (stock on hand)", { underline: true });
    doc.fontSize(10);
    doc.text(`Lines: ${payload.inventory.lineCount}`);
    doc.text(`Total excl. GST: ${payload.inventory.totalExclusive.toFixed(2)}`);
    doc.text(`GST: ${payload.inventory.totalGst.toFixed(2)}`);
    doc.text(`Total incl. GST: ${payload.inventory.totalInclusive.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(12).text("Event snapshots — totals", { underline: true });
    doc.fontSize(10);
    const tt = payload.eventSnapshots.totals;
    doc.text(`Sum target price: ${tt.sumTargetPrice.toFixed(2)}`);
    doc.text(`GST on target (modeled): ${tt.sumGstOnTarget.toFixed(2)}`);
    doc.text(`Sum target excl. GST: ${tt.sumTargetExclusive.toFixed(2)}`);
    doc.text(`Sum cost: ${tt.sumTotalCost.toFixed(2)}`);
    doc.text(`Sum profit: ${tt.sumProfit.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(12).text("Event snapshots — detail", { underline: true });
    doc.fontSize(9);
    payload.eventSnapshots.rows.forEach((row, i) => {
      if (doc.y > 720) doc.addPage();
      const snap = row.snapshotCreatedAt ? row.snapshotCreatedAt.slice(0, 10) : "—";
      doc.text(`${i + 1}. ${row.eventName}`, { width: 500 });
      doc.fontSize(8).fillColor("#333333");
      doc.text(
        `   Snapshot ${snap} · Target ${row.targetPrice.toFixed(2)} · GST on target ${row.gstOnTarget.toFixed(2)} · Excl. ${row.targetExclusive.toFixed(2)} · Cost ${row.totalCost.toFixed(2)} · Profit ${row.profit.toFixed(2)}`,
        { width: 500 }
      );
      doc.fillColor("#000000");
      doc.fontSize(9);
      doc.moveDown(0.4);
    });

    doc.moveDown();
    doc.fontSize(12).text("Assumptions", { underline: true });
    doc.fontSize(8);
    payload.assumptions.forEach((a) => {
      doc.text(`• ${a}`, { width: 500 });
      doc.moveDown(0.2);
    });

    doc.end();
  });
}

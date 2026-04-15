import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
  calculateGST,
  calculateTotalWithGST,
  getGSTFromInclusive,
  removeGST,
  GST_RATE,
} from "../../src/lib/gstCalculation.ts";
import { eventSnapshots, events, inventory } from "../../shared/schema.js";
import { db } from "../storage.js";

function toNumber(value: unknown): number {
  return Number(value ?? 0) || 0;
}

export type InventoryGstSummary = {
  lineCount: number;
  totalExclusive: number;
  totalGst: number;
  totalInclusive: number;
};

/**
 * Stock-on-hand value and GST split using the same rules as the inventory UI
 * (per-line gstInclusive flag on price × stock).
 */
export async function getInventoryGstSummary(
  organizationId: string
): Promise<InventoryGstSummary> {
  const rows = await db
    .select()
    .from(inventory)
    .where(eq(inventory.organizationId, organizationId));

  const items = rows.map((r) => ({
    currentStock: toNumber(r.currentStock),
    pricePerUnit: toNumber(r.pricePerUnit),
    gstInclusive: !!r.gstInclusive,
  }));

  const breakdown = calculateTotalWithGST(items);
  return {
    lineCount: rows.length,
    totalExclusive: Math.round(breakdown.totalExclusive * 100) / 100,
    totalGst: Math.round(breakdown.totalGST * 100) / 100,
    totalInclusive: Math.round(breakdown.totalInclusive * 100) / 100,
  };
}

export type EventSnapshotGstRow = {
  snapshotId: string;
  eventId: string;
  eventName: string;
  eventDate: string | null;
  snapshotCreatedAt: string | null;
  totalCost: number;
  targetPrice: number;
  profit: number;
  /** If target is treated as GST-inclusive: exclusive portion of target. */
  targetExclusive: number;
  /** GST component implied by target price under the chosen assumption. */
  gstOnTarget: number;
};

export type EventSnapshotsGstSummary = {
  periodDays: number | null;
  /** Present when filtering by explicit start/end (Phase 2 unified range). */
  dateRange?: { start: string; end: string };
  assumeTargetPriceGstInclusive: boolean;
  rows: EventSnapshotGstRow[];
  totals: {
    sumTotalCost: number;
    sumTargetPrice: number;
    sumProfit: number;
    sumGstOnTarget: number;
    sumTargetExclusive: number;
  };
};

/**
 * GST columns derived from stored event snapshots. Target price is the modeled
 * quote/revenue figure from costing; by default we treat it as GST-inclusive for
 * NZ-style client quotes (toggle via API).
 */
export async function getEventSnapshotsGstSummary(
  organizationId: string,
  options: {
    days?: number;
    dateRange?: { start: Date; end: Date };
    assumeTargetPriceGstInclusive?: boolean;
    rowLimit?: number;
  } = {}
): Promise<EventSnapshotsGstSummary> {
  const days = options.days;
  const dr = options.dateRange;
  const assumeInclusive = options.assumeTargetPriceGstInclusive !== false;
  const rowLimit = Math.min(Math.max(options.rowLimit ?? 200, 1), 500);

  const conditions = [eq(eventSnapshots.organizationId, organizationId)];
  if (dr) {
    conditions.push(gte(eventSnapshots.createdAt, dr.start));
    conditions.push(lte(eventSnapshots.createdAt, dr.end));
  } else if (days != null && days > 0) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    conditions.push(gte(eventSnapshots.createdAt, from));
  }

  const snapshotRows = await db
    .select({
      snapshot: eventSnapshots,
      eventName: events.name,
      eventDate: events.eventDate,
    })
    .from(eventSnapshots)
    .innerJoin(events, eq(events.id, eventSnapshots.eventId))
    .where(and(...conditions))
    .orderBy(desc(eventSnapshots.createdAt))
    .limit(rowLimit);

  const rows: EventSnapshotGstRow[] = snapshotRows.map(({ snapshot, eventName, eventDate }) => {
    const target = toNumber(snapshot.targetPrice);
    const totalCost = toNumber(snapshot.totalCost);
    const profit = toNumber(snapshot.profit);

    let targetExclusive: number;
    let gstOnTarget: number;
    if (assumeInclusive) {
      targetExclusive = Math.round(removeGST(target) * 100) / 100;
      gstOnTarget = Math.round(getGSTFromInclusive(target) * 100) / 100;
    } else {
      targetExclusive = Math.round(target * 100) / 100;
      gstOnTarget = Math.round(calculateGST(target) * 100) / 100;
    }

    return {
      snapshotId: String(snapshot.id),
      eventId: String(snapshot.eventId),
      eventName: String(eventName || "Event"),
      eventDate: eventDate ? new Date(eventDate).toISOString() : null,
      snapshotCreatedAt: snapshot.createdAt
        ? new Date(snapshot.createdAt).toISOString()
        : null,
      totalCost: Math.round(totalCost * 100) / 100,
      targetPrice: Math.round(target * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      targetExclusive,
      gstOnTarget,
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.sumTotalCost += r.totalCost;
      acc.sumTargetPrice += r.targetPrice;
      acc.sumProfit += r.profit;
      acc.sumGstOnTarget += r.gstOnTarget;
      acc.sumTargetExclusive += r.targetExclusive;
      return acc;
    },
    {
      sumTotalCost: 0,
      sumTargetPrice: 0,
      sumProfit: 0,
      sumGstOnTarget: 0,
      sumTargetExclusive: 0,
    }
  );

  Object.keys(totals).forEach((k) => {
    totals[k as keyof typeof totals] =
      Math.round((totals[k as keyof typeof totals] as number) * 100) / 100;
  });

  return {
    periodDays: dr ? null : days ?? null,
    dateRange: dr
      ? { start: dr.start.toISOString(), end: dr.end.toISOString() }
      : undefined,
    assumeTargetPriceGstInclusive: assumeInclusive,
    rows,
    totals,
  };
}

export function getGstReportingAssumptions(): string[] {
  return [
    `GST rate ${GST_RATE * 100}% (New Zealand).`,
    "Inventory: GST split follows each stock line’s “price includes GST” setting.",
    "Event snapshots: target price is the modeled quote from costing. By default it is treated as GST-inclusive for GST-on-sales illustration; use the query flag if your quotes are GST-exclusive.",
    "Snapshot costs are internal cost bases from recipes/inventory; they are not a substitute for tax advice.",
  ];
}

export type GstSummaryPayload = {
  gstRate: number;
  currency: string;
  region: string;
  inventory: InventoryGstSummary;
  eventSnapshots: EventSnapshotsGstSummary;
  assumptions: string[];
};

/** Shared payload for JSON, CSV, and PDF exports. */
export async function getGstSummaryPayload(
  organizationId: string,
  options: {
    dateRange: { start: Date; end: Date };
    assumeTargetPriceGstInclusive?: boolean;
  }
): Promise<GstSummaryPayload> {
  const assumeInclusive = options.assumeTargetPriceGstInclusive !== false;

  const [inventoryGst, eventSnapshotsGst] = await Promise.all([
    getInventoryGstSummary(organizationId),
    getEventSnapshotsGstSummary(organizationId, {
      dateRange: options.dateRange,
      assumeTargetPriceGstInclusive: assumeInclusive,
    }),
  ]);

  return {
    gstRate: GST_RATE,
    currency: "NZD",
    region: "NZ",
    inventory: inventoryGst,
    eventSnapshots: eventSnapshotsGst,
    assumptions: getGstReportingAssumptions(),
  };
}

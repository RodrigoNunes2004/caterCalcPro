import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
  eventSnapshots,
  events,
  inventoryTransactions,
  recipes,
} from "../../shared/schema.js";
import { db } from "../storage.js";
import type { ResolvedAnalyticsDateRange } from "./analyticsDateRange.js";

function toNumber(value: unknown): number {
  return Number(value ?? 0) || 0;
}

function snapshotDateConditions(organizationId: string, range: ResolvedAnalyticsDateRange) {
  const parts = [
    eq(eventSnapshots.organizationId, organizationId),
    gte(eventSnapshots.createdAt, range.start),
    lte(eventSnapshots.createdAt, range.end),
  ];
  return and(...parts);
}

export async function getAnalyticsOverview(
  organizationId: string,
  range: ResolvedAnalyticsDateRange
) {
  const [snapshots, inventoryTx, topEvents] = await Promise.all([
    db
      .select()
      .from(eventSnapshots)
      .where(snapshotDateConditions(organizationId, range))
      .orderBy(desc(eventSnapshots.createdAt)),
    db
      .select()
      .from(inventoryTransactions)
      .where(
        and(
          eq(inventoryTransactions.organizationId, organizationId),
          gte(inventoryTransactions.createdAt, range.start),
          lte(inventoryTransactions.createdAt, range.end)
        )
      )
      .orderBy(desc(inventoryTransactions.createdAt)),
    db
      .select({
        eventId: eventSnapshots.eventId,
        eventName: events.name,
        totalCost: eventSnapshots.totalCost,
      })
      .from(eventSnapshots)
      .innerJoin(events, eq(events.id, eventSnapshots.eventId))
      .where(snapshotDateConditions(organizationId, range))
      .orderBy(desc(eventSnapshots.totalCost))
      .limit(5),
  ]);

  const monthlyProfit = snapshots.reduce((sum, s) => sum + toNumber(s.profit), 0);
  const avgMargin =
    snapshots.length > 0
      ? snapshots.reduce((sum, s) => sum + toNumber(s.profitMargin), 0) /
        snapshots.length
      : 0;
  const inventorySpend = inventoryTx.reduce((sum, tx) => {
    const qty = toNumber(tx.quantityChange);
    return qty < 0 ? sum + Math.abs(qty) : sum;
  }, 0);

  return {
    monthlyProfit: Math.round(monthlyProfit * 100) / 100,
    averageMarginPercent: Math.round(avgMargin * 100) / 100,
    inventorySpend: Math.round(inventorySpend * 100) / 100,
    snapshotCount: snapshots.length,
    topCostEvents: topEvents.map((e) => ({
      eventId: String(e.eventId),
      eventName: String(e.eventName || "Event"),
      totalCost: Math.round(toNumber(e.totalCost) * 100) / 100,
    })),
    dateRange: {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    },
  };
}

export async function getCostTrends(organizationId: string, range: ResolvedAnalyticsDateRange) {
  const snapshots = await db
    .select()
    .from(eventSnapshots)
    .where(snapshotDateConditions(organizationId, range))
    .orderBy(desc(eventSnapshots.createdAt))
    .limit(200);

  return snapshots.map((s) => ({
    id: s.id,
    eventId: s.eventId,
    totalCost: toNumber(s.totalCost),
    targetPrice: toNumber(s.targetPrice),
    profit: toNumber(s.profit),
    profitMargin: toNumber(s.profitMargin),
    guestCount: toNumber(s.guestCount),
    createdAt: s.createdAt,
  }));
}

export async function getTopCostRecipes(organizationId: string, range: ResolvedAnalyticsDateRange) {
  const recipeRows = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .where(
      and(
        eq(recipes.organizationId, organizationId),
        gte(recipes.createdAt, range.start),
        lte(recipes.createdAt, range.end)
      )
    )
    .orderBy(desc(recipes.createdAt))
    .limit(10);

  return recipeRows.map((r) => ({
    recipeId: r.id,
    recipeName: r.name,
    // Placeholder until per-recipe snapshotting is added
    estimatedCostImpact: null as number | null,
    createdAt: r.createdAt,
  }));
}


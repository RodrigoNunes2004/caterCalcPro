import { and, desc, eq, gte } from "drizzle-orm";
import {
  eventSnapshots,
  events,
  inventoryTransactions,
  recipes,
} from "../../shared/schema.js";
import { db } from "../storage.js";

function toNumber(value: unknown): number {
  return Number(value ?? 0) || 0;
}

export async function getAnalyticsOverview(organizationId: string) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [snapshots, inventoryTx, topEvents] = await Promise.all([
    db
      .select()
      .from(eventSnapshots)
      .where(
        and(
          eq(eventSnapshots.organizationId, organizationId),
          gte(eventSnapshots.createdAt, ninetyDaysAgo)
        )
      )
      .orderBy(desc(eventSnapshots.createdAt)),
    db
      .select()
      .from(inventoryTransactions)
      .where(
        and(
          eq(inventoryTransactions.organizationId, organizationId),
          gte(inventoryTransactions.createdAt, ninetyDaysAgo)
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
      .where(eq(eventSnapshots.organizationId, organizationId))
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
  };
}

export async function getCostTrends(organizationId: string) {
  const snapshots = await db
    .select()
    .from(eventSnapshots)
    .where(eq(eventSnapshots.organizationId, organizationId))
    .orderBy(desc(eventSnapshots.createdAt))
    .limit(24);

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

export async function getTopCostRecipes(organizationId: string) {
  const recipeRows = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .where(eq(recipes.organizationId, organizationId))
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


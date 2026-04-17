import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { eventSnapshots } from "../../shared/schema.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { requireBillingAccess } from "../middleware/billing.js";
import { requirePlan } from "../middleware/plan.js";
import { db } from "../storage.js";
import { calculateEventCost } from "../services/pricingEngine.js";
import {
  getAnalyticsOverview,
  getCostTrends,
  getTopCostRecipes,
} from "../services/analyticsService.js";
import { getGstSummaryPayload } from "../services/gstReportingService.js";
import { buildGstSummaryCsv, buildGstSummaryPdf } from "../services/gstExportFormats.js";
import { resolveAnalyticsDateRangeFromQuery } from "../services/analyticsDateRange.js";
import { buildAnalyticsSummaryCsv } from "../services/analyticsSummaryExport.js";

const router = Router();
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store, must-revalidate");
  next();
});
router.use(authMiddleware, requireBillingAccess, requirePlan("pro"));

router.get("/analytics/overview", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const range = resolveAnalyticsDateRangeFromQuery(req.query as Record<string, unknown>);
    const overview = await getAnalyticsOverview(organizationId, range);
    return res.json(overview);
  } catch (error) {
    console.error("Failed to fetch analytics overview:", error);
    return res.status(500).json({ error: "Failed to fetch analytics overview" });
  }
});

router.get("/analytics/cost-trends", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const range = resolveAnalyticsDateRangeFromQuery(req.query as Record<string, unknown>);
    const trends = await getCostTrends(organizationId, range);
    return res.json({ trends });
  } catch (error) {
    console.error("Failed to fetch analytics cost trends:", error);
    return res.status(500).json({ error: "Failed to fetch analytics cost trends" });
  }
});

router.get("/analytics/top-cost-recipes", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const range = resolveAnalyticsDateRangeFromQuery(req.query as Record<string, unknown>);
    const recipes = await getTopCostRecipes(organizationId, range);
    return res.json({ recipes });
  } catch (error) {
    console.error("Failed to fetch top cost recipes:", error);
    return res.status(500).json({ error: "Failed to fetch top cost recipes" });
  }
});

/** KPIs + prior-period columns + cost-trend rows; same date query as other analytics routes. */
router.get("/analytics/export/summary.csv", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const range = resolveAnalyticsDateRangeFromQuery(req.query as Record<string, unknown>);
    const csv = await buildAnalyticsSummaryCsv(organizationId, range);
    const filename = `gastro-grid-analytics-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    console.error("Failed to export analytics summary CSV:", error);
    return res.status(500).json({ error: "Failed to export analytics summary CSV" });
  }
});

/**
 * GST summary: inventory (per-line GST flags) + event snapshots (GST on modeled target price).
 * Query: startDate + endDate (ISO), or legacy days=90 (default) | all | 1–3650 ; targetInclusive=true|false (default true).
 */
router.get("/analytics/gst/summary", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const range = resolveAnalyticsDateRangeFromQuery(req.query as Record<string, unknown>);
    const assumeTargetInclusive = req.query.targetInclusive !== "false";
    const payload = await getGstSummaryPayload(organizationId, {
      dateRange: range,
      assumeTargetPriceGstInclusive: assumeTargetInclusive,
    });
    return res.json(payload);
  } catch (error) {
    console.error("Failed to fetch GST summary:", error);
    return res.status(500).json({ error: "Failed to fetch GST summary" });
  }
});

router.get("/analytics/gst/export/csv", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const range = resolveAnalyticsDateRangeFromQuery(req.query as Record<string, unknown>);
    const assumeTargetInclusive = req.query.targetInclusive !== "false";
    const payload = await getGstSummaryPayload(organizationId, {
      dateRange: range,
      assumeTargetPriceGstInclusive: assumeTargetInclusive,
    });
    const csv = buildGstSummaryCsv(payload);
    const filename = `gastro-grid-gst-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    console.error("Failed to export GST CSV:", error);
    return res.status(500).json({ error: "Failed to export GST CSV" });
  }
});

router.get("/analytics/gst/export/pdf", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const range = resolveAnalyticsDateRangeFromQuery(req.query as Record<string, unknown>);
    const assumeTargetInclusive = req.query.targetInclusive !== "false";
    const payload = await getGstSummaryPayload(organizationId, {
      dateRange: range,
      assumeTargetPriceGstInclusive: assumeTargetInclusive,
    });
    const pdf = await buildGstSummaryPdf(payload);
    const filename = `gastro-grid-gst-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (error) {
    console.error("Failed to export GST PDF:", error);
    return res.status(500).json({ error: "Failed to export GST PDF" });
  }
});

router.post("/analytics/events/:id/snapshot", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const eventId = req.params.id;
    const cost = await calculateEventCost(eventId, organizationId);
    if (!cost) {
      return res.status(404).json({ error: "Event not found" });
    }

    const insertResult = await db.execute(sql`
      INSERT INTO "event_snapshots" (
        "organization_id",
        "event_id",
        "total_cost",
        "target_price",
        "profit",
        "profit_margin",
        "guest_count"
      )
      VALUES (
        ${organizationId},
        ${eventId},
        ${String(cost.totalCost || 0)},
        ${String(cost.targetPrice || 0)},
        ${String(cost.profitAmount || 0)},
        ${String(cost.profitPercentage || 0)},
        ${Number(cost.guestCount || 0)}
      )
      RETURNING *
    `);

    return res.status(201).json((insertResult as any).rows?.[0] || null);
  } catch (error) {
    console.error("Failed to create event snapshot:", error);
    return res.status(500).json({ error: "Failed to create event snapshot" });
  }
});

router.get("/analytics/events/:id/snapshots", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const eventId = req.params.id;
    const snapshots = await db
      .select()
      .from(eventSnapshots)
      .where(
        and(
          eq(eventSnapshots.organizationId, organizationId),
          eq(eventSnapshots.eventId, eventId)
        )
      );
    return res.json({ snapshots });
  } catch (error) {
    console.error("Failed to fetch event snapshots:", error);
    return res.status(500).json({ error: "Failed to fetch event snapshots" });
  }
});

export default router;


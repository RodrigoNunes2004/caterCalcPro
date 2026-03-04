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

const router = Router();
router.use(authMiddleware, requireBillingAccess, requirePlan("pro"));

router.get("/analytics/overview", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const overview = await getAnalyticsOverview(organizationId);
    return res.json(overview);
  } catch (error) {
    console.error("Failed to fetch analytics overview:", error);
    return res.status(500).json({ error: "Failed to fetch analytics overview" });
  }
});

router.get("/analytics/cost-trends", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const trends = await getCostTrends(organizationId);
    return res.json({ trends });
  } catch (error) {
    console.error("Failed to fetch analytics cost trends:", error);
    return res.status(500).json({ error: "Failed to fetch analytics cost trends" });
  }
});

router.get("/analytics/top-cost-recipes", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const recipes = await getTopCostRecipes(organizationId);
    return res.json({ recipes });
  } catch (error) {
    console.error("Failed to fetch top cost recipes:", error);
    return res.status(500).json({ error: "Failed to fetch top cost recipes" });
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


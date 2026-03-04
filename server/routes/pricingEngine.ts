import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { requireBillingAccess } from "../middleware/billing.js";
import { requirePlan } from "../middleware/plan.js";
import {
  calculateEventCost,
  calculateMenuCost,
  calculateRecipeCost,
} from "../services/pricingEngine.js";

const router = Router();
router.use(authMiddleware, requireBillingAccess, requirePlan("pro"));

router.post("/pricing-engine/recipes/:id/calculate", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const servings = Number(req.body?.servings || 0) || null;
    const result = await calculateRecipeCost(req.params.id, servings, organizationId);
    return res.json(result);
  } catch (error) {
    console.error("Pricing engine recipe calculation failed:", error);
    return res.status(500).json({ error: "Failed to calculate recipe cost" });
  }
});

router.get("/pricing-engine/events/:id/calculate", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const result = await calculateEventCost(req.params.id, organizationId);
    return res.json(result);
  } catch (error) {
    console.error("Pricing engine event calculation failed:", error);
    return res.status(500).json({ error: "Failed to calculate event cost" });
  }
});

router.post("/pricing-engine/menus/:id/calculate", async (req: AuthRequest, res) => {
  try {
    const organizationId = req.auth!.organizationId;
    const guestCount = Number(req.body?.guestCount || 0) || null;
    const result = await calculateMenuCost(req.params.id, guestCount, organizationId);
    if (!result) {
      return res.status(404).json({ error: "Menu not found" });
    }
    return res.json(result);
  } catch (error) {
    console.error("Pricing engine menu calculation failed:", error);
    return res.status(500).json({ error: "Failed to calculate menu cost" });
  }
});

export default router;


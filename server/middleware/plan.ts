import { type Response, type NextFunction } from "express";
import { storage } from "../storage.js";
import type { AuthRequest } from "./auth.js";

export type PlanTier = "starter" | "pro" | "ai";

const PLAN_RANK: Record<PlanTier, number> = {
  starter: 1,
  pro: 2,
  ai: 3,
};

/** Exported for billing API responses — same rules as plan gate. */
export function normalizePlanTier(raw: unknown, fallbackPlan?: unknown): PlanTier {
  const tier = String(raw || "").toLowerCase();
  if (tier === "starter" || tier === "pro" || tier === "ai") return tier;

  const legacyPlan = String(fallbackPlan || "").toLowerCase();
  if (legacyPlan === "enterprise") return "ai";
  if (legacyPlan === "pro") return "pro";
  return "starter";
}

export function requirePlan(minimumPlan: PlanTier) {
  return async function planGate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const organizationId = req.auth?.organizationId;
      if (!organizationId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const org = await storage.getOrganizationBilling(organizationId);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const currentTier = normalizePlanTier(org.planTier, org.plan);
      if (PLAN_RANK[currentTier] >= PLAN_RANK[minimumPlan]) {
        return next();
      }

      return res.status(403).json({
        error: "Plan upgrade required",
        code: "PLAN_UPGRADE_REQUIRED",
        billing: {
          currentPlanTier: currentTier,
          requiredPlanTier: minimumPlan,
        },
      });
    } catch (error) {
      console.error("Plan middleware error:", error);
      return res.status(500).json({ error: "Failed to validate plan access" });
    }
  };
}


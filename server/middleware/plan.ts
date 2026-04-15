import { type Response, type NextFunction } from "express";
import { inferPlanTierFromStripePriceId } from "../lib/stripePlanPrices.js";
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
  const legacyPlan = String(fallbackPlan || "").toLowerCase();

  if (tier === "pro" || tier === "ai") return tier;

  if (tier === "starter") {
    if (legacyPlan === "pro") return "pro";
    if (legacyPlan === "enterprise") return "ai";
    if (legacyPlan === "ai") return "ai";
    return "starter";
  }

  if (legacyPlan === "enterprise") return "ai";
  if (legacyPlan === "pro") return "pro";
  if (legacyPlan === "ai") return "ai";
  return "starter";
}

/**
 * Effective tier for gates and /billing/status: DB fields plus Stripe `stripePriceId` when DB lags
 * (e.g. webhook updated price id before plan_tier).
 */
export function resolveOrganizationPlanTier(org: {
  planTier?: unknown;
  plan?: unknown;
  stripePriceId?: unknown;
}): PlanTier {
  const base = normalizePlanTier(org.planTier, org.plan);
  const fromStripe = inferPlanTierFromStripePriceId(
    org.stripePriceId == null ? null : String(org.stripePriceId)
  );
  return PLAN_RANK[fromStripe] > PLAN_RANK[base] ? fromStripe : base;
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

      const currentTier = resolveOrganizationPlanTier(org);
      if (PLAN_RANK[currentTier] >= PLAN_RANK[minimumPlan]) {
        return next();
      }

      // #region agent log
      {
        const baseOnly = normalizePlanTier(org.planTier, org.plan);
        const fromStripe = inferPlanTierFromStripePriceId(
          org.stripePriceId == null ? null : String(org.stripePriceId)
        );
        const priceTail =
          org.stripePriceId == null
            ? ""
            : String(org.stripePriceId).slice(-8);
        fetch("http://127.0.0.1:7520/ingest/529b7cc2-88c7-4df6-9032-42107fab9a7e", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "24a4ce",
          },
          body: JSON.stringify({
            sessionId: "24a4ce",
            runId: "pre-fix",
            hypothesisId: "H1-H2",
            location: "server/middleware/plan.ts:requirePlan:deny",
            message: "Plan gate denied",
            data: {
              organizationId,
              minimumPlan,
              currentTier,
              baseOnly,
              fromStripe,
              dbPlanTier: String(org.planTier ?? ""),
              dbPlan: String(org.plan ?? ""),
              stripePriceIdTail: priceTail,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion

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


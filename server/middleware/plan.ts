import { type Response, type NextFunction } from "express";
import { coerceOrganizationBillingRow } from "../lib/billingOrgShape.js";
import {
  inferPlanTierFromStripePriceId,
  isStripePriceIdUnmappedInEnv,
} from "../lib/stripePlanPrices.js";
import { organizationHasBillingApiAccess } from "../lib/subscriptionAccess.js";
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
  subscriptionStatus?: unknown;
  stripeSubscriptionId?: unknown;
  stripeCustomerId?: unknown;
  trialEndsAt?: unknown;
  subscriptionCurrentPeriodEnd?: unknown;
}): PlanTier {
  const o = coerceOrganizationBillingRow(org);

  const base = normalizePlanTier(o.planTier, o.plan);
  const fromStripe = inferPlanTierFromStripePriceId(
    o.stripePriceId == null ? null : String(o.stripePriceId)
  );
  let merged: PlanTier =
    PLAN_RANK[fromStripe] > PLAN_RANK[base] ? fromStripe : base;

  const hasStripeSubscription = Boolean(
    String(o.stripeSubscriptionId ?? "").trim()
  );
  const hasStripeCustomer = Boolean(String(o.stripeCustomerId ?? "").trim());
  const priceId =
    o.stripePriceId == null ? "" : String(o.stripePriceId).trim();

  // Still "starter" after DB + env price mapping: common in prod when `stripe_price_id` was never
  // stored (webhook/local only), or the id is missing from STRIPE_PRICE_ID_* lists. If the org already
  // passes subscription billing access and has Stripe linkage, treat as Pro for gates (list all price
  // ids in env to avoid relying on this).
  if (
    merged === "starter" &&
    organizationHasBillingApiAccess(o) &&
    (hasStripeSubscription || hasStripeCustomer) &&
    (!priceId || isStripePriceIdUnmappedInEnv(priceId))
  ) {
    merged = "pro";
  }

  return merged;
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


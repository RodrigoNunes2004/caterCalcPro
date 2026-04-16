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

type CoercedOrg = ReturnType<typeof coerceOrganizationBillingRow>;

function computeResolvedTierFromCoerced(o: CoercedOrg): {
  tier: PlanTier;
  mergedBeforePromotion: PlanTier;
  promotionToProApplied: boolean;
  base: PlanTier;
  fromStripe: PlanTier;
} {
  const base = normalizePlanTier(o.planTier, o.plan);
  const fromStripe = inferPlanTierFromStripePriceId(
    o.stripePriceId == null ? null : String(o.stripePriceId)
  );
  let merged: PlanTier =
    PLAN_RANK[fromStripe] > PLAN_RANK[base] ? fromStripe : base;
  const mergedBeforePromotion = merged;

  const hasStripeSubscription = Boolean(
    String(o.stripeSubscriptionId ?? "").trim()
  );
  const hasStripeCustomer = Boolean(String(o.stripeCustomerId ?? "").trim());

  const strictStarterTier =
    process.env.STRIPE_STRICT_STARTER_TIER === "true";
  const priceIdStr =
    o.stripePriceId == null ? "" : String(o.stripePriceId).trim();
  const unmappedOrMissing =
    !priceIdStr || isStripePriceIdUnmappedInEnv(priceIdStr);

  let promotionToProApplied = false;
  if (
    merged === "starter" &&
    organizationHasBillingApiAccess(o) &&
    (hasStripeSubscription || hasStripeCustomer)
  ) {
    const allowPromote =
      !strictStarterTier || unmappedOrMissing;
    if (allowPromote) {
      merged = "pro";
      promotionToProApplied = true;
    }
  }

  return {
    tier: merged,
    mergedBeforePromotion,
    promotionToProApplied,
    base,
    fromStripe,
  };
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
  return computeResolvedTierFromCoerced(o).tier;
}

export type PlanResolutionTrace = {
  base: PlanTier;
  fromStripe: PlanTier;
  mergedBeforePromotion: PlanTier;
  resolved: PlanTier;
  hasBillingAccess: boolean;
  hasStripeSubscription: boolean;
  hasStripeCustomer: boolean;
  priceIdSuffix: string;
  priceUnmappedInEnv: boolean;
  promotionToProApplied: boolean;
  subscriptionStatus: string;
  dbPlanTier: string;
  dbPlan: string;
};

/** Safe diagnostics for /api/billing/plan-debug (no secrets). */
export function getPlanResolutionTrace(org: unknown): PlanResolutionTrace {
  const o = coerceOrganizationBillingRow(org);
  const priceId =
    o.stripePriceId == null ? "" : String(o.stripePriceId).trim();
  const c = computeResolvedTierFromCoerced(o);
  return {
    base: c.base,
    fromStripe: c.fromStripe,
    mergedBeforePromotion: c.mergedBeforePromotion,
    resolved: c.tier,
    hasBillingAccess: organizationHasBillingApiAccess(o),
    hasStripeSubscription: Boolean(
      String(o.stripeSubscriptionId ?? "").trim()
    ),
    hasStripeCustomer: Boolean(String(o.stripeCustomerId ?? "").trim()),
    priceIdSuffix: priceId ? priceId.slice(-10) : "",
    priceUnmappedInEnv: Boolean(
      priceId && isStripePriceIdUnmappedInEnv(priceId)
    ),
    promotionToProApplied: c.promotionToProApplied,
    subscriptionStatus: String(o.subscriptionStatus ?? ""),
    dbPlanTier: String(o.planTier ?? ""),
    dbPlan: String(o.plan ?? ""),
  };
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


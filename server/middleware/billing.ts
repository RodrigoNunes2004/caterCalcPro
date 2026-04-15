import { type Response, type NextFunction } from "express";
import { organizationHasBillingApiAccess } from "../lib/subscriptionAccess.js";
import { storage } from "../storage.js";
import type { AuthRequest } from "./auth.js";

export async function requireBillingAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (process.env.BILLING_ENFORCEMENT_DISABLED === "true") {
      return next();
    }

    const organizationId = req.auth?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const org = await storage.getOrganizationBilling(organizationId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (organizationHasBillingApiAccess(org)) {
      return next();
    }

    return res.status(402).json({
      error: "Subscription required",
      code: "SUBSCRIPTION_REQUIRED",
      billing: {
        plan: org.plan || "trial",
        planTier: org.planTier || (org.plan === "pro" ? "pro" : "starter"),
        subscriptionStatus: org.subscriptionStatus || "trialing",
        trialEndsAt: org.trialEndsAt || null,
        subscriptionCurrentPeriodEnd: org.subscriptionCurrentPeriodEnd || null,
      },
    });
  } catch (error) {
    console.error("Billing access middleware error:", error);
    return res.status(500).json({ error: "Failed to validate subscription access" });
  }
}

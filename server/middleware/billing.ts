import { type Response, type NextFunction } from "express";
import { storage } from "../storage.js";
import type { AuthRequest } from "./auth.js";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const dt = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isFutureDate(value: unknown): boolean {
  const dt = toDate(value);
  return !!dt && dt.getTime() > Date.now();
}

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

    const status = String(org.subscriptionStatus || "trialing").toLowerCase();
    const trialValid = isFutureDate(org.trialEndsAt);
    const subscriptionStillValid = isFutureDate(org.subscriptionCurrentPeriodEnd);

    const hasAccess =
      status === "active" ||
      (status === "trialing" && trialValid) ||
      ((status === "cancelled" || status === "canceled") && subscriptionStillValid);

    if (hasAccess) {
      return next();
    }

    return res.status(402).json({
      error: "Subscription required",
      code: "SUBSCRIPTION_REQUIRED",
      billing: {
        plan: org.plan || "trial",
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

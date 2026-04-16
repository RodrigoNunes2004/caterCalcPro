/** Shared with `requireBillingAccess` — one definition for “subscription allows API access”. */

import { coerceOrganizationBillingRow } from "./billingOrgShape.js";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const dt = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isFutureDate(value: unknown): boolean {
  const dt = toDate(value);
  return !!dt && dt.getTime() > Date.now();
}

/**
 * Uses coerced billing fields (camelCase + snake_case) so Neon / raw rows match localhost Drizzle.
 */
export function organizationHasBillingApiAccess(org: unknown): boolean {
  const o = coerceOrganizationBillingRow(org);
  const status = String(o.subscriptionStatus || "trialing")
    .toLowerCase()
    .trim();
  const trialValid = isFutureDate(o.trialEndsAt);
  const subscriptionStillValid = isFutureDate(o.subscriptionCurrentPeriodEnd);
  const hasStripeSubscription = Boolean(
    String(o.stripeSubscriptionId ?? "").trim()
  );

  if (status === "active") return true;
  if (status === "trialing" && trialValid) return true;
  if (
    status === "trialing" &&
    hasStripeSubscription &&
    !toDate(o.trialEndsAt)
  ) {
    return true;
  }
  if (
    (status === "cancelled" || status === "canceled") &&
    subscriptionStillValid
  ) {
    return true;
  }
  return false;
}

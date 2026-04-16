/**
 * Normalize org rows for billing/plan logic. Drizzle returns camelCase; raw SQL or drivers
 * may expose snake_case — missing `stripePriceId` breaks tier inference and causes 403 on Pro users.
 */
export function coerceOrganizationBillingRow(org: unknown): {
  planTier?: unknown;
  plan?: unknown;
  stripePriceId?: unknown;
  subscriptionStatus?: unknown;
  stripeSubscriptionId?: unknown;
  stripeCustomerId?: unknown;
  trialEndsAt?: unknown;
  subscriptionCurrentPeriodEnd?: unknown;
} {
  const r = org as Record<string, unknown> | null;
  if (!r || typeof r !== "object") return {};

  const pick = (camel: string, snake: string): unknown => {
    const a = r[camel];
    const b = r[snake];
    if (a !== undefined && a !== null && String(a).trim() !== "") return a;
    if (b !== undefined && b !== null && String(b).trim() !== "") return b;
    return a ?? b;
  };

  return {
    planTier: pick("planTier", "plan_tier"),
    plan: pick("plan", "plan"),
    stripePriceId: pick("stripePriceId", "stripe_price_id"),
    subscriptionStatus: pick("subscriptionStatus", "subscription_status"),
    stripeSubscriptionId: pick("stripeSubscriptionId", "stripe_subscription_id"),
    stripeCustomerId: pick("stripeCustomerId", "stripe_customer_id"),
    trialEndsAt: pick("trialEndsAt", "trial_ends_at"),
    subscriptionCurrentPeriodEnd: pick(
      "subscriptionCurrentPeriodEnd",
      "subscription_current_period_end"
    ),
  };
}

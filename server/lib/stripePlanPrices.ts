/** Env-based Stripe price ids — shared by billing routes and plan resolution. */

export type StripePlanTier = "starter" | "pro" | "ai";

export function getStripePriceIdMap() {
  const legacy = String(process.env.STRIPE_PRICE_ID || "").trim();
  const starter = String(process.env.STRIPE_PRICE_ID_STARTER || "").trim();
  const pro = String(process.env.STRIPE_PRICE_ID_PRO || legacy).trim();
  const ai = String(process.env.STRIPE_PRICE_ID_AI || "").trim();
  return { starter, pro, ai };
}

/** Map a subscription line price id to a tier (defaults to starter if unknown). */
export function inferPlanTierFromStripePriceId(
  priceId: string | null | undefined
): StripePlanTier {
  const id = String(priceId || "").trim();
  const prices = getStripePriceIdMap();
  if (id && id === prices.ai) return "ai";
  if (id && id === prices.pro) return "pro";
  if (id && id === prices.starter) return "starter";
  return "starter";
}

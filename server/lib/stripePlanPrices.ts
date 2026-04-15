/** Env-based Stripe price ids — shared by billing routes and plan resolution. */

export type StripePlanTier = "starter" | "pro" | "ai";

/** Split env values so you can set monthly + yearly Pro prices: `price_a,price_b`. */
function splitPriceIds(raw: string): string[] {
  return String(raw || "")
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** First price id in env (for default checkout when multiple ids are configured). */
export function firstConfiguredPriceId(envBlob: string): string {
  return splitPriceIds(envBlob)[0] || "";
}

export function getStripePriceIdMap() {
  const legacy = String(process.env.STRIPE_PRICE_ID || "").trim();
  const starter = String(process.env.STRIPE_PRICE_ID_STARTER || "").trim();
  const pro = String(process.env.STRIPE_PRICE_ID_PRO || legacy).trim();
  const ai = String(process.env.STRIPE_PRICE_ID_AI || "").trim();
  return { starter, pro, ai };
}

/** True if `priceId` is listed in a tier env var (supports comma-separated ids). */
export function envContainsPriceId(envBlob: string, priceId: string): boolean {
  const id = String(priceId || "").trim();
  if (!id) return false;
  return splitPriceIds(envBlob).some((p) => p === id);
}

/** Map a subscription line price id to a tier (defaults to starter if unknown). */
export function inferPlanTierFromStripePriceId(
  priceId: string | null | undefined
): StripePlanTier {
  const id = String(priceId || "").trim();
  if (!id) return "starter";
  const prices = getStripePriceIdMap();
  if (envContainsPriceId(prices.ai, id)) return "ai";
  if (envContainsPriceId(prices.pro, id)) return "pro";
  if (envContainsPriceId(prices.starter, id)) return "starter";
  return "starter";
}

/** True if this price id is not listed on any tier env var (comma-separated lists count). */
export function isStripePriceIdUnmappedInEnv(
  priceId: string | null | undefined
): boolean {
  const id = String(priceId || "").trim();
  if (!id) return false;
  const prices = getStripePriceIdMap();
  return (
    !envContainsPriceId(prices.starter, id) &&
    !envContainsPriceId(prices.pro, id) &&
    !envContainsPriceId(prices.ai, id)
  );
}

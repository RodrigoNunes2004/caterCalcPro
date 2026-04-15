/** Shared with `requireBillingAccess` — one definition for “subscription allows API access”. */

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const dt = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isFutureDate(value: unknown): boolean {
  const dt = toDate(value);
  return !!dt && dt.getTime() > Date.now();
}

export function organizationHasBillingApiAccess(org: {
  subscriptionStatus?: unknown;
  trialEndsAt?: unknown;
  subscriptionCurrentPeriodEnd?: unknown;
}): boolean {
  const status = String(org.subscriptionStatus || "trialing").toLowerCase();
  const trialValid = isFutureDate(org.trialEndsAt);
  const subscriptionStillValid = isFutureDate(org.subscriptionCurrentPeriodEnd);
  return (
    status === "active" ||
    (status === "trialing" && trialValid) ||
    ((status === "cancelled" || status === "canceled") && subscriptionStillValid)
  );
}

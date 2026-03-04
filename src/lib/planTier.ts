export type PlanTier = "starter" | "pro" | "ai";

const PLAN_RANK: Record<PlanTier, number> = {
  starter: 1,
  pro: 2,
  ai: 3,
};

export function normalizePlanTier(value: unknown, fallbackPlan?: unknown): PlanTier {
  const tier = String(value || "").toLowerCase();
  if (tier === "starter" || tier === "pro" || tier === "ai") return tier;

  const legacyPlan = String(fallbackPlan || "").toLowerCase();
  if (legacyPlan === "enterprise") return "ai";
  if (legacyPlan === "pro") return "pro";
  return "starter";
}

export function hasPlanAccess(current: PlanTier, required: PlanTier): boolean {
  return PLAN_RANK[current] >= PLAN_RANK[required];
}

export function getPlanTierBadgeClass(planTier: PlanTier): string {
  if (planTier === "ai") {
    return "bg-purple-100 text-purple-800 border-purple-200";
  }
  if (planTier === "pro") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function formatPlanTierLabel(
  planTier: PlanTier,
  loading = false
): string {
  return loading ? "Plan..." : `${planTier.toUpperCase()} Plan`;
}


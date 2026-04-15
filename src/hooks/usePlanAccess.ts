import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasPlanAccess,
  normalizePlanTier,
  type PlanTier,
} from "@/lib/planTier";

type BillingStatus = {
  plan?: string;
  planTier?: string;
  subscriptionStatus?: string;
};

/** Server already sends `planTier` from `resolveOrganizationPlanTier`; trust it when valid. */
function planTierFromBillingPayload(data: BillingStatus): PlanTier {
  const t = String(data.planTier ?? "").toLowerCase();
  if (t === "pro" || t === "ai" || t === "starter") return t;
  return normalizePlanTier(data.planTier, data.plan);
}

async function fetchBillingStatus(): Promise<BillingStatus> {
  const response = await fetch("/api/billing/status");
  if (!response.ok) {
    throw new Error("Failed to load billing status");
  }
  return response.json();
}

export function usePlanAccess() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["billing-status", user?.organizationId || "anon"],
    queryFn: fetchBillingStatus,
    enabled: !!user?.organizationId,
    /** Tier must stay in sync with API gates; long stale time showed PRO while analytics 403'd. */
    staleTime: 0,
    retry: 2,
  });

  const planTier = query.data
    ? planTierFromBillingPayload(query.data)
    : ("starter" as PlanTier);

  /** If billing status fails, do not block the UI as "starter" — APIs still enforce plan/subscription. */
  const canAccess = (required: PlanTier) => {
    if (query.isError) return true;
    if (!query.data) return false;
    return hasPlanAccess(planTier, required);
  };

  // React Query v5: `isLoading` alone can be false while `data` is still missing (e.g. pending without
  // the exact v4 semantics). RequirePlan must not evaluate access until the billing query has finished
  // at least once — otherwise we redirect to /billing while the user is actually Pro.
  const isPlanGateLoading =
    !!user?.organizationId && !query.isError && !query.isFetched;

  return {
    planTier,
    subscriptionStatus: query.data?.subscriptionStatus || null,
    canAccess,
    isLoading: isPlanGateLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}


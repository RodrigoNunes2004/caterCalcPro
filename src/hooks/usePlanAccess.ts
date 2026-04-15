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

  /** Match server `/billing/status` + `resolveOrganizationPlanTier`; reconcile legacy starter+plan. */
  const planTier = query.data
    ? normalizePlanTier(query.data.planTier, query.data.plan)
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


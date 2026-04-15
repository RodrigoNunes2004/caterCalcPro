import { useEffect } from "react";
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

  // #region agent log
  useEffect(() => {
    if (!query.data) return;
    fetch("http://127.0.0.1:7520/ingest/529b7cc2-88c7-4df6-9032-42107fab9a7e", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "24a4ce",
      },
      body: JSON.stringify({
        sessionId: "24a4ce",
        runId: "pre-fix",
        hypothesisId: "H5",
        location: "src/hooks/usePlanAccess.ts",
        message: "Client plan from billing-status",
        data: {
          apiPlanTier: query.data.planTier ?? null,
          apiPlan: query.data.plan ?? null,
          normalizedPlanTier: planTier,
          subscriptionStatus: query.data.subscriptionStatus ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [query.data, planTier]);
  // #endregion

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


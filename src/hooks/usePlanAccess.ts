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

  useEffect(() => {
    if (!query.data) return;
    // #region agent log
    fetch(
      "http://127.0.0.1:7520/ingest/529b7cc2-88c7-4df6-9032-42107fab9a7e",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "24a4ce",
        },
        body: JSON.stringify({
          sessionId: "24a4ce",
          location: "src/hooks/usePlanAccess.ts",
          message: "billing status for badge",
          data: {
            hypothesisId: "H2",
            computedTier: planTier,
            apiPlanTier: String(query.data.planTier ?? ""),
            apiPlan: String(query.data.plan ?? ""),
            isError: query.isError,
          },
          timestamp: Date.now(),
          runId: "debug-analytics-403",
        }),
      }
    ).catch(() => {});
    // #endregion
  }, [query.data, query.isError, planTier]);

  /** Do not grant route access when billing failed — that caused PRO badge + Analytics 403 mismatch. */
  const canAccess = (required: PlanTier) => {
    if (query.isError) return false;
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


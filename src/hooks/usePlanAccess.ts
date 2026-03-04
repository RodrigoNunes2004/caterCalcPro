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
    staleTime: 60 * 1000,
  });

  const planTier = normalizePlanTier(query.data?.planTier, query.data?.plan);

  const canAccess = (required: PlanTier) => hasPlanAccess(planTier, required);

  return {
    planTier,
    subscriptionStatus: query.data?.subscriptionStatus || null,
    canAccess,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}


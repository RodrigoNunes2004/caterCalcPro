import { Navigate, useLocation } from "react-router-dom";
import { type PlanTier } from "@/lib/planTier";
import { usePlanAccess } from "@/hooks/usePlanAccess";

export function RequirePlan({
  requiredPlan,
  children,
}: {
  requiredPlan: PlanTier;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { canAccess, isLoading } = usePlanAccess();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!canAccess(requiredPlan)) {
    const from = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/billing?from=${encodeURIComponent(from)}&requiredPlan=${requiredPlan}`}
        replace
      />
    );
  }

  return <>{children}</>;
}


import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  type PlanTier,
  formatPlanTierLabel,
  getPlanTierBadgeClass,
} from "@/lib/planTier";

export default function PlanBadge({
  planTier,
  loading = false,
}: {
  planTier: PlanTier;
  loading?: boolean;
}) {
  return (
    <Badge variant="outline" className={getPlanTierBadgeClass(planTier)}>
      {formatPlanTierLabel(planTier, loading)}
    </Badge>
  );
}


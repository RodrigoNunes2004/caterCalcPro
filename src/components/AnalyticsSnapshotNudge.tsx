import React, { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BarChart3, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePlanAccess } from "@/hooks/usePlanAccess";

const STORAGE_KEY = "catercalc_dismiss_analytics_snapshot_nudge_v1";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Pro/AI: prompt users with no event cost snapshots to create them so Analytics populates.
 * Dismissal is stored in localStorage (this browser only).
 */
export function AnalyticsSnapshotNudge() {
  const navigate = useNavigate();
  const { canAccess, isLoading: planLoading } = usePlanAccess();
  const [dismissed, setDismissed] = useState(readDismissed);

  const showForPlan = canAccess("pro");
  const enabled = showForPlan && !dismissed && !planLoading;

  const { data, isSuccess } = useQuery({
    queryKey: ["analytics-overview", "nudge", "all"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/overview?days=all", {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json() as Promise<{ snapshotCount?: number }>;
    },
    enabled,
    staleTime: 60_000,
  });

  const hide = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  if (!enabled || !isSuccess || !data) return null;
  if (Number(data.snapshotCount ?? 0) > 0) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-800">
      <BarChart3 className="h-4 w-4 text-amber-700 dark:text-amber-400" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:pr-8">
        <div>
          <AlertTitle className="text-amber-900 dark:text-amber-100">
            Get more from Pro Analytics
          </AlertTitle>
          <AlertDescription className="text-amber-900/90 dark:text-amber-100/90">
            You do not have any <strong>event cost snapshots</strong> yet. After you price an
            event, create a snapshot from the Events area. Snapshots power trends, comparisons,
            and reports on the Analytics page.
          </AlertDescription>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            size="sm"
            className="bg-amber-700 hover:bg-amber-800 text-white"
            onClick={() => navigate("/events")}
          >
            Open Events
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/analytics")}>
            Analytics
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={hide}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}

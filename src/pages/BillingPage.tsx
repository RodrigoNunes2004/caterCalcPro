import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, RefreshCcw, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { normalizePlanTier, hasPlanAccess, type PlanTier } from "@/lib/planTier";
import PlanBadge from "@/components/PlanBadge";

type BillingStatus = {
  organizationId: string;
  plan: string;
  planTier?: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  billingEmail: string | null;
  subscriptionCurrentPeriodEnd: string | null;
};

type BillingConfig = {
  enabled: boolean;
  defaultPriceId: string | null;
  prices?: {
    starter?: string | null;
    pro?: string | null;
    ai?: string | null;
  };
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}

export default function BillingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fromPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("from") || "/";
  }, [location.search]);

  const requiredPlan = useMemo<PlanTier | null>(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("requiredPlan");
    if (!raw) return null;
    return normalizePlanTier(raw);
  }, [location.search]);

  const currentPlanTier = useMemo<PlanTier>(() => {
    return normalizePlanTier(status?.planTier, status?.plan);
  }, [status?.planTier, status?.plan]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/billing/status");
      if (!response.ok) {
        throw new Error("Failed to load billing status");
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError("Unable to load billing status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/billing/config");
        if (!response.ok) return;
        const data = await response.json();
        setConfig(data);
      } catch {
        // Optional; checkout call still validates config server-side.
      }
    })();
  }, []);

  const handleCheckout = async (planTier: PlanTier) => {
    try {
      setCheckoutLoading(true);
      const baseUrl = window.location.origin;
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email || undefined,
          planTier,
          successUrl: `${baseUrl}/billing?billing=success`,
          cancelUrl: `${baseUrl}/billing?billing=cancelled`,
        }),
      });
      if (!response.ok) {
        throw new Error("Checkout session failed");
      }
      const data = await response.json();
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      throw new Error("Missing checkout url");
    } catch (_err) {
      setError("Stripe checkout is not configured yet. Please contact support.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isLikelyActive =
    status?.subscriptionStatus === "active" || status?.subscriptionStatus === "trialing";

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(fromPath)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={loadStatus} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                {isLikelyActive ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                Billing & Subscription
              </CardTitle>
              <PlanBadge planTier={currentPlanTier} loading={loading} />
            </div>
            <CardDescription>
              Manage your subscription to keep access to recipes, menus, events, and prep workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading billing status...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Plan</p>
                    <p className="font-semibold">{status?.plan || "trial"}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Plan Tier</p>
                    <p className="font-semibold">{currentPlanTier}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Subscription Status</p>
                    <p className="font-semibold">
                      <Badge variant="secondary">{status?.subscriptionStatus || "-"}</Badge>
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Trial Ends</p>
                    <p className="font-semibold">{formatDate(status?.trialEndsAt || null)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Current Period End</p>
                    <p className="font-semibold">
                      {formatDate(status?.subscriptionCurrentPeriodEnd || null)}
                    </p>
                  </div>
                </div>

                {!isLikelyActive && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    Your subscription is not active. Subscribe to continue using protected features.
                  </div>
                )}

                {requiredPlan && !hasPlanAccess(currentPlanTier, requiredPlan) && (
                  <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
                    This area requires <strong>{requiredPlan}</strong> plan access or higher.
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleCheckout("starter")}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={checkoutLoading || !config?.prices?.starter}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {checkoutLoading ? "Redirecting..." : "Choose Starter"}
              </Button>
              <Button
                onClick={() => handleCheckout("pro")}
                variant="outline"
                disabled={checkoutLoading || !config?.prices?.pro}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {checkoutLoading ? "Redirecting..." : "Choose Pro"}
              </Button>
              <Button
                onClick={() => handleCheckout("ai")}
                variant="outline"
                disabled={checkoutLoading || !config?.prices?.ai}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {checkoutLoading ? "Redirecting..." : "Choose AI"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

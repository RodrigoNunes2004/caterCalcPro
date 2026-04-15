import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getAuthToken } from "./lib/authToken";

// Ensure all API requests include credentials (cookies) and Bearer token when available
const originalFetch = window.fetch;
let billingRedirectInProgress = false;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith("/api/")) {
    /** Snapshot when the request is issued — avoids wrong `from=` if user navigates before the response (e.g. AI 403 after moving to Analytics). */
    const pathWhenRequestStarted = `${window.location.pathname}${window.location.search}`;
    const headers = new Headers(init?.headers);
    const token = getAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return originalFetch
      .call(this, input, { ...init, credentials: "include", headers })
      .then(async (response) => {
        const pathOnly = url.split("?")[0];
        const shouldHandleBilling =
          pathOnly !== "/api/billing/status" &&
          pathOnly !== "/api/billing/create-checkout-session" &&
          pathOnly !== "/api/billing/sync-checkout-session" &&
          pathOnly !== "/api/billing/config" &&
          pathOnly !== "/api/billing/webhook";

        // Analytics routes are already gated by RequirePlan; a 403 here would full-page redirect
        // Pro users to Billing even when `/api/billing/status` shows the correct tier. Surface errors in-app instead.
        const isAnalyticsApi = pathOnly.startsWith("/api/analytics/");
        if (
          shouldHandleBilling &&
          !isAnalyticsApi &&
          (response.status === 402 || response.status === 403) &&
          !billingRedirectInProgress &&
          window.location.pathname !== "/billing"
        ) {
          try {
            const data = await response.clone().json().catch(() => null);
            if (
              data?.code === "SUBSCRIPTION_REQUIRED" ||
              data?.code === "PLAN_UPGRADE_REQUIRED"
            ) {
              billingRedirectInProgress = true;
              const from = pathWhenRequestStarted;
              let tier =
                data?.billing?.requiredPlanTier &&
                typeof data.billing.requiredPlanTier === "string"
                  ? data.billing.requiredPlanTier
                  : "";
              if (
                tier === "ai" &&
                (pathOnly.startsWith("/api/analytics/") ||
                  pathOnly.startsWith("/api/pricing-engine/"))
              ) {
                tier = "pro";
              }
              const requiredPlan = tier ? `&requiredPlan=${encodeURIComponent(tier)}` : "";
                           const billingUrl = `/billing?from=${encodeURIComponent(from)}${requiredPlan}`;
              window.location.assign(billingUrl);
            }
          } catch {
            // ignore - keep original response flow
          } finally {
            // allow future redirects after navigation attempt
            setTimeout(() => {
              billingRedirectInProgress = false;
            }, 800);
          }
        }
        return response;
      });
  }
  return originalFetch.call(this, input, init);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


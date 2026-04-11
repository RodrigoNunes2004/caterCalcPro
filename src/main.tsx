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
          pathOnly !== "/api/billing/config" &&
          pathOnly !== "/api/billing/webhook";

        if (
          shouldHandleBilling &&
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
              const from = `${window.location.pathname}${window.location.search}`;
              const requiredPlan =
                data?.billing?.requiredPlanTier &&
                typeof data.billing.requiredPlanTier === "string"
                  ? `&requiredPlan=${encodeURIComponent(data.billing.requiredPlanTier)}`
                  : "";
                           const billingUrl = `/billing?from=${encodeURIComponent(from)}${requiredPlan}`;
              // #region agent log
              fetch("http://127.0.0.1:7242/ingest/529b7cc2-88c7-4df6-9032-42107fab9a7e", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Debug-Session-Id": "9914c5",
                },
                body: JSON.stringify({
                  sessionId: "9914c5",
                  location: "main.tsx:billing-redirect",
                  message: "full navigation to billing (402/403)",
                  data: { billingUrl, fromPath: window.location.pathname },
                  timestamp: Date.now(),
                  hypothesisId: "H2",
                }),
              }).catch(() => {});
              // #endregion
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

// #region agent log
fetch("http://127.0.0.1:7242/ingest/529b7cc2-88c7-4df6-9032-42107fab9a7e", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "9914c5",
  },
  body: JSON.stringify({
    sessionId: "9914c5",
    location: "main.tsx:boot",
    message: "SPA boot",
    data: { pathname: window.location.pathname },
    timestamp: Date.now(),
    hypothesisId: "H1",
  }),
}).catch(() => {});
// #endregion

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


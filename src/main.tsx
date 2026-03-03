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
          response.status === 402 &&
          !billingRedirectInProgress &&
          window.location.pathname !== "/billing"
        ) {
          try {
            const data = await response.clone().json().catch(() => null);
            if (data?.code === "SUBSCRIPTION_REQUIRED") {
              billingRedirectInProgress = true;
              const from = `${window.location.pathname}${window.location.search}`;
              window.location.assign(`/billing?from=${encodeURIComponent(from)}`);
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


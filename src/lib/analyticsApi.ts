/**
 * Analytics API responses — surface server `code` / `error` in the UI (prod often 401/403 while local dev returns 200 + zeros).
 */
export async function fetchAnalyticsJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (response.ok) {
    return response.json() as Promise<T>;
  }
  const status = response.status;
  let message = `Could not load data (${status}).`;
  try {
    const data = (await response.json()) as {
      code?: string;
      error?: string;
    };
    // #region agent log
    {
      const pathOnly = url.split("?")[0];
      fetch("http://127.0.0.1:7520/ingest/529b7cc2-88c7-4df6-9032-42107fab9a7e", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "24a4ce",
        },
        body: JSON.stringify({
          sessionId: "24a4ce",
          runId: "pre-fix",
          hypothesisId: "H2-H4",
          location: "src/lib/analyticsApi.ts:fetchAnalyticsJson",
          message: "Analytics fetch non-OK",
          data: {
            status,
            pathOnly,
            code: data?.code ?? null,
            errorPrefix:
              typeof data?.error === "string"
                ? data.error.slice(0, 80)
                : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    if (data?.code === "PLAN_UPGRADE_REQUIRED") {
      message =
        "Analytics requires a Pro plan. Open Billing to review your subscription.";
    } else if (data?.code === "SUBSCRIPTION_REQUIRED") {
      message =
        "An active subscription is required. Open Billing to continue.";
    } else if (status === 401) {
      message = "Session expired or invalid. Sign in again.";
    } else if (typeof data?.error === "string" && data.error.trim()) {
      message = data.error;
    }
  } catch {
    if (status === 401) message = "Session expired or invalid. Sign in again.";
  }
  throw new Error(message);
}

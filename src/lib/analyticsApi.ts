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

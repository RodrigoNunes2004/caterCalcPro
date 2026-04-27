/**
 * Support email — override with VITE_SUPPORT_EMAIL at build time.
 * Must stay aligned with public-facing copy (e.g. landing, billing).
 */
export function getSupportEmail(): string {
  return String(import.meta.env?.VITE_SUPPORT_EMAIL || "support@gastrogrid.com").trim() ||
    "support@gastrogrid.com";
}

export function buildSupportMailto(options: {
  subject?: string;
  bodyPrefix?: string;
} = {}): string {
  const email = getSupportEmail();
  const subject = options.subject ?? "Gastro Grid support";
  const body = (options.bodyPrefix ?? "").trim();
  const params = new URLSearchParams();
  params.set("subject", subject);
  if (body) params.set("body", body);
  return `mailto:${email}?${params.toString()}`;
}

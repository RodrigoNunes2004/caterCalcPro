/**
 * Application constants - configurable via environment variables.
 * No hardcoded defaults for production; use VITE_ prefixed vars for build-time config.
 */

export const DEFAULT_GUEST_COUNT =
  parseInt(import.meta.env.VITE_DEFAULT_GUEST_COUNT || "50", 10) || 50;

export const ANALYTICS_CONSENT_KEY = "omni.analytics.consent";
export const ANALYTICS_SESSION_KEY = "omni.analytics.session";

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "server-session-unavailable";
  const existing = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existing) return existing;
  const value =
    typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, value);
  return value;
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted";
}

import { createInternalNeonAuth } from '@neondatabase/auth';

/**
 * IOS-PWA-1 (2026-10-16): the auth server lives on a THIRD-PARTY domain
 * (`*.neon.tech`), so its session cookie is a third-party cookie — which WebKit
 * strips, with no exemption in a standalone iOS PWA. We therefore talk to the
 * **same-origin** proxy (`/api/v2/auth/*`) and only *it* reaches Neon Auth; the
 * proxy rewrites every `Set-Cookie` to first-party. The client never needs to
 * know the upstream host.
 *
 * A relative `VITE_NEON_AUTH_URL` is honoured (e.g. a different mount); an
 * absolute cross-site URL is deliberately IGNORED, because pointing the client
 * back at `*.neon.tech` would silently restore the third-party cookie.
 */
const SAME_ORIGIN_AUTH_PATH = '/api/v2/auth';
const configured = (import.meta.env.VITE_NEON_AUTH_URL as string | undefined)?.trim();
const relativeOverride = configured && configured.startsWith('/') ? configured : null;
// In the browser the origin is real. In a non-browser context (SSR, unit tests)
// there is no `window`, and better-auth rejects a relative base URL — fall back
// to a syntactically valid origin; it is never used for a real request there.
const authOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
const authUrl = `${authOrigin}${relativeOverride ?? SAME_ORIGIN_AUTH_PATH}`;
const neonAuth = createInternalNeonAuth(authUrl);
export const authClient = neonAuth?.adapter ?? null;

/**
 * Return the short-lived Neon Auth JWT for protected Omni API calls.
 * The browser session cookie contains an opaque session token and must not be
 * sent as a bearer token; `/token` exchanges the HttpOnly session for a JWT.
 */
export async function getAuthToken(): Promise<string | null> {
  if (!neonAuth) return null;
  // Un token peut échouer transitoirement (cookie tiers, aller-retour réseau pendant
  // un tap sur « Mes demandes »). Un échec ponctuel ne veut PAS dire « déconnecté » :
  // sans réessai, l'app redemandait la connexion à un utilisateur déjà connecté.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = await fetchAuthTokenOnce();
    if (token) return token;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
  }
  return null;
}

async function fetchAuthTokenOnce(): Promise<string | null> {
  if (!neonAuth) return null;
  try {
    const response = await fetch(`${authUrl}/token`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { token?: unknown };
    return typeof payload.token === 'string' && payload.token.split('.').length === 3 ? payload.token : null;
  } catch {
    return null;
  }
}

export type OmniSession = {
  session: unknown;
  user: { id?: string; email?: string | null; name?: string | null };
};

import { createInternalNeonAuth } from '@neondatabase/auth';

const DEFAULT_NEON_AUTH_URL = 'https://ep-plain-butterfly-amn21o8h.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth';
const authUrl = ((import.meta.env.VITE_NEON_AUTH_URL as string | undefined) ?? DEFAULT_NEON_AUTH_URL).trim();
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

import { handleAuthProxyRequest } from '@neondatabase/auth/server';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Same-origin auth proxy (IOS-PWA-1, 2026-10-16).
 *
 * The Neon Auth server lives on a DIFFERENT registrable domain
 * (`*.neon.tech`) than the app (`omni.sparkafrika.online`). Every auth call is
 * therefore cross-site and the session cookie is a THIRD-PARTY cookie. WebKit
 * (Safari / iOS) blocks third-party cookies via ITP, with no exemption in a
 * standalone PWA, so an iPhone installed to the home screen never restores the
 * session and keeps asking to sign in — while desktop, Android and desktop-PWA
 * work because they tolerate the third-party cookie.
 *
 * Serving the same calls from `/api/v2/auth/*` on our own origin makes the
 * cookie FIRST-PARTY. `handleAuthProxyRequest` is the vendor-supported path: it
 * forwards to Neon Auth and, critically, REWRITES every `Set-Cookie` — it drops
 * `Partitioned`, forces `SameSite` (`lax` by default) and `Secure`, and keeps
 * `HttpOnly`. A bare Vercel `rewrite` cannot do that (it does not touch
 * `Set-Cookie`), which is why this proxy exists.
 *
 * The client only needs `VITE_NEON_AUTH_URL` pointed at `/api/v2/auth`; the
 * whole SDK is already parameterised by that one URL.
 */

/** Our same-origin mount. `vercel.json` sends `/api/v2/:path*` here. */
const AUTH_PROXY_PREFIX = '/api/v2/auth';
/** The Neon Auth webhook already lives under the prefix but is NOT part of the
 * proxy: it is a signed server-to-server POST verified by `handleApi`. Routing
 * it through the proxy would break signature verification and 404 it. */
const AUTH_WEBHOOK_PATH = '/api/v2/auth/webhook';
/** Neon Auth endpoints this app actually uses. Anything else is refused: the
 * proxy must never become an open relay to the auth host. */
const ALLOWED_AUTH_PATHS = new Set([
  'get-session',
  'sign-in/email',
  'sign-up/email',
  'sign-out',
  'email-otp/send-verification-otp',
  'email-otp/verify-email',
  'token',
]);

/**
 * Upstream Neon Auth base URL. Kept server-side only: it must never reach the
 * client bundle (the client uses the same-origin mount instead). The default is
 * the project's Neon Auth host, which was already public (it shipped in the old
 * client bundle); `NEON_AUTH_URL` overrides it for other branches/environments.
 */
const DEFAULT_UPSTREAM_AUTH_URL = 'https://ep-plain-butterfly-amn21o8h.neonauth.c-5.us-east-1.aws.neon.tech/neondb/auth';

export function upstreamAuthBaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const raw = (env.NEON_AUTH_URL ?? env.VITE_NEON_AUTH_URL ?? DEFAULT_UPSTREAM_AUTH_URL).trim();
  return raw ? raw.replace(/\/$/, '') : null;
}

/** Cookie signing secret for the `session_data` cache cookie the proxy mints.
 * Optional: without it the proxy still forwards and rewrites `Set-Cookie`; it
 * simply cannot add the fast-path session cache. */
export function authCookieSecret(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const raw = (env.NEON_AUTH_COOKIE_SECRET ?? '').trim();
  return raw.length >= 32 ? raw : undefined;
}

/** Is this request addressed to the same-origin auth proxy? */
export function isAuthProxyPath(pathname: string): boolean {
  if (pathname === AUTH_WEBHOOK_PATH) return false;
  return pathname === AUTH_PROXY_PREFIX || pathname.startsWith(`${AUTH_PROXY_PREFIX}/`);
}

/** Extract the Neon Auth endpoint from the same-origin path, or null if the
 * path is not an allowed endpoint. */
export function authProxyEndpoint(pathname: string): string | null {
  const rest = pathname.slice(AUTH_PROXY_PREFIX.length).replace(/^\/+/, '');
  return ALLOWED_AUTH_PATHS.has(rest) ? rest : null;
}

/** Build a Web `Request` from the Node request so the vendor handler can use it. */
async function toWebRequest(req: IncomingMessage, url: URL): Promise<Request> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(', '));
  }
  const method = req.method ?? 'GET';
  const body = method === 'GET' || method === 'HEAD' ? undefined : new Uint8Array(await readIncomingBody(req));
  return new Request(url.toString(), { method, headers, body });
}

async function readIncomingBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

/**
 * Handle a same-origin auth request. Returns true when it was handled (including
 * a deliberate refusal), false when the path is not ours so the caller can carry
 * on with the normal API routing.
 */
export async function handleAuthProxy(req: IncomingMessage, res: ServerResponse, pathname: string, url: URL): Promise<boolean> {
  if (!isAuthProxyPath(pathname)) return false;

  const endpoint = authProxyEndpoint(pathname);
  if (!endpoint) {
    // Unknown auth sub-path: refuse explicitly. Never relay an unlisted endpoint
    // (defence in depth — this must not become a generic proxy to the auth host).
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Unknown auth endpoint.', code: 'AUTH_ENDPOINT_NOT_ALLOWED' }));
    return true;
  }

  const baseUrl = upstreamAuthBaseUrl();
  if (!baseUrl) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Authentication is not configured.', code: 'AUTH_NOT_CONFIGURED' }));
    return true;
  }

  let upstream: Response;
  try {
    upstream = await handleAuthProxyRequest({
      request: await toWebRequest(req, url),
      path: endpoint,
      baseUrl,
      // A secret is required by the type, but the vendor only uses it for the
      // optional session-data cache. A stable fallback keeps this stateless
      // without weakening the session cookie (which upstream sets, we only rewrite).
      cookieSecret: authCookieSecret() ?? 'omni-auth-proxy-session-data-cache-fallback',
      sameSite: 'lax',
    });
  } catch {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Authentication is temporarily unavailable.', code: 'AUTH_UPSTREAM_UNAVAILABLE' }));
    return true;
  }

  res.statusCode = upstream.status;
  for (const header of ['content-type'] as const) {
    const value = upstream.headers.get(header);
    if (value) res.setHeader('Content-Type', value);
  }
  res.setHeader('Cache-Control', 'no-store');
  // Re-emit every rewritten Set-Cookie (the whole point: first-party cookies).
  const cookies = upstream.headers.getSetCookie();
  if (cookies.length > 0) res.setHeader('Set-Cookie', cookies);
  const payload = Buffer.from(await upstream.arrayBuffer());
  res.end(payload);
  return true;
}

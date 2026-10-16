import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { authProxyEndpoint, isAuthProxyPath, upstreamAuthBaseUrl, authCookieSecret } from './auth-proxy';

/**
 * IOS-PWA-1 — the session must survive on an iPhone installed as a PWA.
 *
 * The auth server lives on `*.neon.tech`, a DIFFERENT registrable domain than the
 * app, so its cookie was THIRD-PARTY. WebKit/ITP strips that cookie and a
 * standalone iOS PWA has no exemption, so the session never restored (desktop,
 * Android and desktop-PWA tolerated it). The fix is a same-origin proxy that
 * rewrites `Set-Cookie`; the client talks only to `/api/v2/auth/*`.
 *
 * These guards lock the invariants that make that true. They fail if the client
 * is pointed back at the third-party host, or if the proxy stops being wired.
 */
const authSource = readFileSync(new URL('../auth.ts', import.meta.url), 'utf8');
const httpSource = readFileSync(new URL('./http.ts', import.meta.url), 'utf8');
const proxySource = readFileSync(new URL('./auth-proxy.ts', import.meta.url), 'utf8');

describe('IOS-PWA-1 — auth same-origin, jamais cross-site', () => {
  it('the client never hardcodes the third-party neon.tech host', () => {
    // Match an actual URL literal, not prose: the file *documents* `*.neon.tech`
    // in a comment, so a bare `/neon\.tech/` would false-positive on the comment
    // (and, worse, an anchored variant let a real sabotage through). Target a
    // complete `http(s)://…neon.tech` literal, and strip comments first so a
    // future comment can never mask a genuine hardcode.
    const code = authSource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(code).not.toMatch(/https?:\/\/[^\s'"`]*neon\.tech/i);
    expect(authSource).toContain('/api/v2/auth');
  });

  it('an absolute cross-site auth URL is ignored (only relative mounts honoured)', () => {
    // The client must degrade a cross-site URL rather than silently go back to a
    // third-party cookie: only a path starting with "/" is accepted.
    expect(authSource).toMatch(/startsWith\('\/'\)/);
  });

  it('the proxy is wired into handleApi before the auth webhook', () => {
    expect(httpSource).toContain('isAuthProxyPath');
    expect(httpSource).toContain('handleAuthProxy');
  });

  it('the proxy rewrites Set-Cookie to first-party (drops Partitioned, forces SameSite)', () => {
    // The vendor handler does the rewrite; our module relies on it and must pass
    // sameSite + re-emit getSetCookie(). If this disappears the cookie is no
    // longer first-party and iOS PWA regresses silently.
    expect(proxySource).toContain('handleAuthProxyRequest');
    expect(proxySource).toContain("sameSite: 'lax'");
    expect(proxySource).toContain('getSetCookie()');
  });

  it('the auth webhook is carved out (its signature would break through the proxy)', () => {
    expect(isAuthProxyPath('/api/v2/auth/webhook')).toBe(false);
    expect(isAuthProxyPath('/api/v2/auth/get-session')).toBe(true);
    expect(isAuthProxyPath('/api/v2/auth/token')).toBe(true);
    expect(isAuthProxyPath('/api/v2/other')).toBe(false);
  });

  it('only the endpoints the app uses are relayed (never an open relay)', () => {
    expect(authProxyEndpoint('/api/v2/auth/get-session')).toBe('get-session');
    expect(authProxyEndpoint('/api/v2/auth/sign-in/email')).toBe('sign-in/email');
    expect(authProxyEndpoint('/api/v2/auth/email-otp/verify-email')).toBe('email-otp/verify-email');
    expect(authProxyEndpoint('/api/v2/auth/token')).toBe('token');
    expect(authProxyEndpoint('/api/v2/auth/admin/set-role')).toBeNull();
    expect(authProxyEndpoint('/api/v2/auth/whatever')).toBeNull();
  });

  it('upstream base URL is read server-side from NEON_AUTH_URL', () => {
    expect(upstreamAuthBaseUrl({ NEON_AUTH_URL: 'https://x.neon.tech/neondb/auth/' } as NodeJS.ProcessEnv))
      .toBe('https://x.neon.tech/neondb/auth');
    // Default is the project host (already public in the old client bundle), so
    // the proxy works without new configuration.
    expect(upstreamAuthBaseUrl({} as NodeJS.ProcessEnv)).toContain('neon.tech');
  });

  it('the cookie secret is optional but must be long enough when present', () => {
    expect(authCookieSecret({ NEON_AUTH_COOKIE_SECRET: 'short' } as NodeJS.ProcessEnv)).toBeUndefined();
    expect(authCookieSecret({ NEON_AUTH_COOKIE_SECRET: 'x'.repeat(32) } as NodeJS.ProcessEnv)).toHaveLength(32);
  });
});

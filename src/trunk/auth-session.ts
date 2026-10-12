export type SessionUser = { id: string; email: string | null; name: string | null };

type AuthUser = { id?: string; email?: string | null; name?: string | null };

type AuthSessionResult = {
  data?: {
    user?: AuthUser | null;
    session?: { user?: AuthUser | null } | null;
  } | null;
};

export function sessionUserFromAuthResult(result: unknown): SessionUser | null {
  const data = (result as AuthSessionResult | null | undefined)?.data;
  const user = data?.user ?? data?.session?.user;
  return user?.id ? { id: user.id, email: user.email ?? null, name: user.name ?? null } : null;
}

/**
 * A sign-up/sign-in that actually OPENED a session carries a session (or the opaque session
 * token Better Auth returns alongside it). When email verification is REQUIRED, Neon returns
 * `{ user }` (unverified) but NO session — the account exists, the session does not. Reading
 * the user alone would therefore let an unverified signup skip verification.
 */
export function authResultHasSession(result: unknown): boolean {
  const data = (result as { data?: { token?: unknown; session?: unknown } | null } | null | undefined)?.data;
  if (!data) return false;
  if (typeof data.token === 'string' && data.token.length > 0) return true;
  return data.session != null;
}

type AuthErrorLike = { message?: string; code?: string; status?: number };

/**
 * Extract an error from an SDK result or a thrown value. Better Auth is configured
 * `throw: false`, so a rejected call arrives as `{ error }`; a thrown error (a
 * `BetterAuthError`) carries `message`/`code` directly. Reading both in one place keeps
 * the success path from mistaking an error object for "no session".
 */
export function authErrorOf(result: unknown): AuthErrorLike | null {
  if (!result || typeof result !== 'object') return null;
  const wrapped = (result as { error?: AuthErrorLike | null }).error;
  if (wrapped) return wrapped;
  const direct = result as AuthErrorLike;
  return typeof direct.message === 'string' || typeof direct.code === 'string' ? direct : null;
}


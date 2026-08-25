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

export type SessionUser = { id: string; email: string | null; name: string | null };

type AuthSessionResult = {
  data?: {
    session?: {
      user?: { id?: string; email?: string | null; name?: string | null } | null;
    } | null;
  } | null;
};

export function sessionUserFromAuthResult(result: unknown): SessionUser | null {
  const session = (result as AuthSessionResult | null | undefined)?.data?.session;
  const user = session?.user;
  return user?.id ? { id: user.id, email: user.email ?? null, name: user.name ?? null } : null;
}

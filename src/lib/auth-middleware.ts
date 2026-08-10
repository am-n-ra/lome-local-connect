import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { ensureProfile, isStaff, verifyToken, type AuthUser } from "./neon-auth.server";

function bearer(): string | null {
  const header = getRequestHeader("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1]! : null;
}

/** Rejects the call when no valid Neon Auth token is present. */
export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const token = bearer();
    const user = token ? await verifyToken(token) : null;
    if (!user) throw new Error("UNAUTHORIZED");
    await ensureProfile(user);
    return next({ context: { user, userId: user.userId } });
  },
);

/** Adds the identity when present, but never blocks the call. */
export const optionalAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const token = bearer();
    const user: AuthUser | null = token ? await verifyToken(token) : null;
    if (user) await ensureProfile(user);
    return next({ context: { user, userId: user?.userId ?? null } });
  },
);

/** Staff-only guard: admin, moderator or acquisition role required. */
export const requireStaff = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const token = bearer();
    const user = token ? await verifyToken(token) : null;
    if (!user) throw new Error("UNAUTHORIZED");
    await ensureProfile(user);
    if (!(await isStaff(user))) throw new Error("FORBIDDEN");
    return next({ context: { user, userId: user.userId } });
  },
);

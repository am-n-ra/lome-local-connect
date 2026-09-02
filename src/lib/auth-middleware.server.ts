import { createMiddleware } from "@tanstack/react-start";
import type { AuthUser } from "./neon-auth.server";

type ServerRequestHeaderReader = Pick<
  typeof import("@tanstack/react-start/server"),
  "getRequestHeader"
>;
type NeonAuthServer = typeof import("./neon-auth.server");

async function serverDeps(): Promise<ServerRequestHeaderReader & NeonAuthServer> {
  const [{ getRequestHeader }, auth] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("./neon-auth.server"),
  ]);
  return { getRequestHeader, ...auth };
}

async function bearer(): Promise<string | null> {
  const { getRequestHeader } = await serverDeps();
  const header = getRequestHeader("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1]! : null;
}

/** Rejects the call when no valid Neon Auth token is present. */
export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { ensureProfile, verifyToken } = await serverDeps();
  const token = await bearer();
  const user = token ? await verifyToken(token) : null;
  if (!user) throw new Error("UNAUTHORIZED");
  await ensureProfile(user);
  return next({ context: { user, userId: user.userId } });
});

/** Adds the identity when present, but never blocks the call. */
export const optionalAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { ensureProfile, verifyToken } = await serverDeps();
  const token = await bearer();
  const user: AuthUser | null = token ? await verifyToken(token) : null;
  if (user) await ensureProfile(user);
  return next({ context: { user, userId: user?.userId ?? null } });
});

/** Staff-only guard: admin, moderator or acquisition role required. */
export const requireStaff = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { ensureProfile, isStaff, verifyToken } = await serverDeps();
  const token = await bearer();
  const user = token ? await verifyToken(token) : null;
  if (!user) throw new Error("UNAUTHORIZED");
  await ensureProfile(user);
  if (!(await isStaff(user))) throw new Error("FORBIDDEN");
  return next({ context: { user, userId: user.userId } });
});

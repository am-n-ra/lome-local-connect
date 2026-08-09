import { createRemoteJWKSet, jwtVerify } from "jose";
import { query, queryOne } from "./db.server";

/** Verified identity coming from Neon Auth. */
export type AuthUser = {
  userId: string;
  email: string | null;
  name: string | null;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  if (!jwks) {
    const url = process.env["NEON_AUTH_JWKS_URL"];
    if (!url) throw new Error("NEON_AUTH_JWKS_URL is not configured");
    jwks = createRemoteJWKSet(new URL(url));
  }
  return jwks;
}

export function neonAuthBaseUrl(): string {
  const base = process.env["NEON_AUTH_BASE_URL"];
  if (!base) throw new Error("NEON_AUTH_BASE_URL is not configured");
  return base.replace(/\/$/, "");
}

/** Verifies a Neon Auth JWT and returns the identity it carries. */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwks());
    const userId = (payload.sub ?? (payload as { id?: string }).id) as
      | string
      | undefined;
    if (!userId) return null;
    return {
      userId,
      email: (payload as { email?: string }).email ?? null,
      name: (payload as { name?: string }).name ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Makes sure a profile row mirrors the Neon Auth user, then returns it.
 * Called on every authenticated request so sign-ups need no extra step.
 */
export async function ensureProfile(user: AuthUser) {
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM public.profiles WHERE id = $1",
    [user.userId],
  );
  if (!existing) {
    await query(
      `INSERT INTO public.profiles (id, name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [user.userId, user.name ?? "", user.email],
    );
  }
  return user.userId;
}

export async function hasRole(userId: string, role: string): Promise<boolean> {
  const row = await queryOne(
    "SELECT 1 AS ok FROM public.user_roles WHERE user_id = $1 AND role = $2",
    [userId, role],
  );
  return row !== null;
}

export async function isStaff(userId: string): Promise<boolean> {
  const row = await queryOne(
    `SELECT 1 AS ok FROM public.user_roles
     WHERE user_id = $1 AND role IN ('admin','moderator','acquisition')`,
    [userId],
  );
  return row !== null;
}

export async function writeAudit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  detail: unknown = null,
) {
  await query(
    `INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, detail)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorId, action, entityType, entityId, detail === null ? null : JSON.stringify(detail)],
  );
}

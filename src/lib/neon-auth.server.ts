import { createRemoteJWKSet, jwtVerify } from "jose";
import { query, queryOne } from "./db.server";

/** Verified identity coming from Neon Auth. */
export type AuthUser = {
  userId: string;
  email: string | null;
  name: string | null;
  /** Roles carried directly by the provider token, when present. */
  claimRoles?: string[];
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
      claimRoles: readClaimRoles(payload as Record<string, unknown>),
    };
  } catch {
    return null;
  }
}

/**
 * Roles can also be carried by the identity provider itself (Neon Auth
 * metadata) instead of public.user_roles, so both sources are read dynamically.
 */
function readClaimRoles(payload: Record<string, unknown>): string[] {
  const buckets: unknown[] = [
    payload["role"],
    payload["roles"],
    (payload["server_metadata"] as Record<string, unknown> | undefined)?.["role"],
    (payload["server_metadata"] as Record<string, unknown> | undefined)?.["roles"],
    (payload["client_metadata"] as Record<string, unknown> | undefined)?.["role"],
    (payload["client_metadata"] as Record<string, unknown> | undefined)?.["roles"],
  ];
  const out = new Set<string>();
  for (const bucket of buckets) {
    if (typeof bucket === "string") out.add(bucket.trim().toLowerCase());
    else if (Array.isArray(bucket))
      for (const item of bucket) if (typeof item === "string") out.add(item.trim().toLowerCase());
  }
  return [...out].filter(Boolean);
}

/** Emails listed in ADMIN_EMAILS are always treated as platform admins. */
function adminEmails(): string[] {
  return (process.env["ADMIN_EMAILS"] ?? "")
    .split(/[,\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Effective roles for a signed-in user: active public.user_roles, plus roles
 * carried by the auth provider, plus the ADMIN_EMAILS allowlist. Provider and
 * allowlist roles are deliberately not persisted so revocation is immediate.
 */
export async function rolesFor(user: AuthUser): Promise<string[]> {
  const rows = await query<{ role: string }>(
    `SELECT role FROM public.user_roles
     WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > now())`,
    [user.userId],
  );
  const roles = new Set(rows.map((r) => r.role));

  // Provider claims and the allowlist are evaluated on every request. They are
  // deliberately not persisted so removing a claim/email takes effect immediately.
  for (const role of user.claimRoles ?? [])
    if (["admin", "moderator", "acquisition"].includes(role)) roles.add(role);
  if (user.email && adminEmails().includes(user.email.toLowerCase())) roles.add("admin");

  return [...roles];
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
    "SELECT 1 AS ok FROM public.user_roles WHERE user_id = $1 AND role = $2 AND (expires_at IS NULL OR expires_at > now())",
    [userId, role],
  );
  return row !== null;
}

export async function isStaff(user: AuthUser): Promise<boolean> {
  const roles = await rolesFor(user);
  return roles.some((role) => ["admin", "moderator", "acquisition"].includes(role));
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

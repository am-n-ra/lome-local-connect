import { createFileRoute } from "@tanstack/react-router";
import { query, queryOne, rolesFor, verifyToken } from "@/lib/neon-auth.server";

/**
 * GET /api/v2/account/context
 * Returns the authenticated account context (identity, roles, profile, owned
 * companies and facilities) for the current session. The auth token is read
 * from the `Authorization: Bearer <neon-auth-jwt>` header, the same way the
 * rest of the auth gating does. Never 404s: an unauthenticated caller gets a
 * JSON body with `authenticated: false` so the client can branch on it.
 */
function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1]! : null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/v2/account/context")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = bearerToken(request);
        const user = token ? await verifyToken(token) : null;
        if (!user) {
          return json({ authenticated: false, user: null });
        }
        const roles = await rolesFor(user);
        const profile = await queryOne(
          `SELECT id, name, email, phone, market_code, wallet_balance, onboarding_done
             FROM public.profiles
            WHERE id = $1`,
          [user.userId],
        );
        const companies = await query(
          `SELECT id, owner_id, name, legal_name, country_code, status
             FROM public.companies
            WHERE owner_id = $1
            ORDER BY created_at ASC`,
          [user.userId],
        );
        const facilities = await query(
          `SELECT id, owner_id, name, category, status, is_online, latitude, longitude
             FROM public.facilities
            WHERE owner_id = $1
            ORDER BY updated_at DESC`,
          [user.userId],
        );
        return json({
          authenticated: true,
          user: { id: user.userId, email: user.email, name: user.name },
          roles,
          profile: profile ?? null,
          companies,
          facilities,
        });
      },
    },
  },
});

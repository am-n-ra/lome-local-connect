import { createFileRoute } from "@tanstack/react-router";

/**
 * Same-origin proxy in front of Neon Auth.
 * Keeps the auth host out of the browser, avoids CORS, and rewrites cookies so
 * the session cookie belongs to this app's origin.
 */
async function proxy(request: Request, splat: string): Promise<Response> {
  const base = process.env["NEON_AUTH_BASE_URL"];
  if (!base) return new Response("Auth is not configured", { status: 500 });

  const incoming = new URL(request.url);
  const target = `${base.replace(/\/$/, "")}/${splat}${incoming.search}`;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  if (cookie) headers.set("cookie", cookie);
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", request.headers.get("accept") ?? "application/json");
  headers.set("x-forwarded-host", incoming.host);
  headers.set("origin", incoming.origin);

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const upstream = await fetch(target, {
    method,
    headers,
    body: body ?? null,
    redirect: "manual",
  });

  const out = new Headers();
  const type = upstream.headers.get("content-type");
  if (type) out.set("content-type", type);
  const location = upstream.headers.get("location");
  if (location) out.set("location", location);

  // Strip the upstream Domain so cookies stick to this origin.
  const setCookies =
    typeof (upstream.headers as unknown as { getSetCookie?: () => string[] })
      .getSetCookie === "function"
      ? (upstream.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : upstream.headers.get("set-cookie")
        ? [upstream.headers.get("set-cookie")!]
        : [];

  for (const raw of setCookies) {
    const cleaned = raw
      .split(";")
      .filter((part) => !/^\s*domain=/i.test(part))
      .join(";");
    out.append("set-cookie", cleaned);
  }

  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => proxy(request, params._splat ?? ""),
      POST: async ({ request, params }) => proxy(request, params._splat ?? ""),
      PUT: async ({ request, params }) => proxy(request, params._splat ?? ""),
      PATCH: async ({ request, params }) => proxy(request, params._splat ?? ""),
      DELETE: async ({ request, params }) => proxy(request, params._splat ?? ""),
    },
  },
});

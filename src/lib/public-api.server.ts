import { z } from "zod";
import { query } from "@/lib/db.server";
import { enforceRateLimit } from "@/lib/rate-limit.server";

/** Shared helpers for the public read-only OmniView API (`/api/public/v1/*`). */

export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
  "cache-control": "public, max-age=60",
} as const;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS },
  });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** 120 requests per minute per IP on the public API. */
export async function guard(request: Request): Promise<void> {
  await enforceRateLimit({
    bucket: "public-api",
    subject: clientIp(request),
    limit: 120,
    windowSeconds: 60,
    message: "Rate limit exceeded",
  });
}

export const PUBLIC_FACILITY_SELECT = `
  SELECT f.id, f.name, f.category, f.description, f.address, f.neighbourhood,
         f.latitude, f.longitude, f.status, f.type, f.is_online,
         COALESCE(p.cnt, 0)::int AS product_count,
         p.min_price::int AS min_price,
         m.url AS cover_url
  FROM public.facilities f
  LEFT JOIN LATERAL (
    SELECT COALESCE(fm.thumb_url, fm.url) AS url
    FROM public.facility_media fm
    WHERE fm.facility_id = f.id AND fm.kind = 'image'
    ORDER BY fm.position ASC, fm.created_at ASC
    LIMIT 1
  ) m ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt, min(price) AS min_price
    FROM public.products pr WHERE pr.facility_id = f.id AND pr.in_stock
  ) p ON true
`;

export type PublicFacility = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  neighbourhood: string | null;
  latitude: number;
  longitude: number;
  status: string;
  type: string;
  is_online: boolean;
  product_count: number;
  min_price: number | null;
  cover_url: string | null;
};


export const listQuerySchema = z.object({
  search: z.string().max(120).optional(),
  category: z.string().max(40).optional(),
  status: z.enum(["unclaimed", "unconfirmed", "certified", "confirmed"]).optional(),
  neighbourhood: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

export async function listPublicFacilities(
  params: z.infer<typeof listQuerySchema>,
): Promise<PublicFacility[]> {
  const clauses: string[] = ["f.market_code = 'TG-LOME'"];
  const values: unknown[] = [];

  if (params.category) {
    values.push(params.category);
    clauses.push(`f.category = $${values.length}`);
  }
  if (params.status) {
    values.push(params.status);
    clauses.push(`f.status = $${values.length}`);
  }
  if (params.neighbourhood) {
    values.push(`%${params.neighbourhood}%`);
    clauses.push(`f.neighbourhood ILIKE $${values.length}`);
  }
  if (params.search?.trim()) {
    values.push(`%${params.search.trim()}%`);
    const i = values.length;
    clauses.push(`(f.name ILIKE $${i} OR f.description ILIKE $${i} OR f.neighbourhood ILIKE $${i})`);
  }

  values.push(params.limit, params.offset);
  return query<PublicFacility>(
    `${PUBLIC_FACILITY_SELECT} WHERE ${clauses.join(" AND ")}
     ORDER BY f.name ASC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
}

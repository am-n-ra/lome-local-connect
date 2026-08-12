/**
 * Omni search engine — queries the unified `search_documents` index.
 * Server-only: this file is never bundled for the browser.
 */
import { query } from "./db.server";
import { expandProblemQuery } from "./ai-search.server";

export type OmniObjectType =
  | "facility"
  | "product"
  | "service"
  | "offer"
  | "image"
  | "video"
  | "article";

export type OmniSearchMode = "all" | OmniObjectType;

export type OmniResult = {
  object_type: OmniObjectType;
  object_id: string;
  facility_id: string;
  title: string;
  body: string | null;
  category: string | null;
  price: number | null;
  discount_percent: number;
  available: boolean;
  latitude: number | null;
  longitude: number | null;
  facility_status: string;
  media_url: string | null;
  facility_name: string;
  facility_online: boolean;
  facility_type: string;
  tier: string;
  sponsored: boolean;
  rating: number | null;
  review_count: number;
  transaction_count: number;
  distance_km: number | null;
  score: number;
};

export type SearchParams = {
  q: string;
  mode: OmniSearchMode;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  maxPrice?: number | null;
  minDiscount?: number | null;
  availableOnly?: boolean;
  sort?: "relevance" | "distance" | "price";
  limit?: number;
};

const TYPES_FOR_MODE: Record<OmniSearchMode, OmniObjectType[] | null> = {
  all: null,
  facility: ["facility"],
  product: ["product", "service"],
  service: ["service"],
  offer: ["offer"],
  image: ["image"],
  video: ["video"],
  article: ["article"],
};

/** Turns free text into a Postgres tsquery-safe websearch string. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function runQuery(params: SearchParams, terms: string): Promise<OmniResult[]> {
  const args: unknown[] = [];
  const where: string[] = [];

  const push = (value: unknown) => {
    args.push(value);
    return `$${args.length}`;
  };

  const hasTerms = terms.length > 0;
  const qParam = hasTerms ? push(terms) : null;

  if (hasTerms) {
    where.push(`(
      d.tsv @@ websearch_to_tsquery('french', ${qParam})
      OR d.title ILIKE '%' || ${qParam} || '%'
      OR public.unaccent_safe(d.title) % public.unaccent_safe(${qParam})
    )`);
  }

  const types = TYPES_FOR_MODE[params.mode];
  if (types) where.push(`d.object_type = ANY(${push(types)}::text[])`);
  if (params.category && params.category !== "all")
    where.push(`d.category = ${push(params.category)}`);
  if (params.maxPrice != null) where.push(`(d.price IS NULL OR d.price <= ${push(params.maxPrice)})`);
  if (params.minDiscount) where.push(`d.discount_percent >= ${push(params.minDiscount)}`);
  if (params.availableOnly) where.push("d.available");

  const lat = params.lat ?? null;
  const lng = params.lng ?? null;
  const latParam = push(lat);
  const lngParam = push(lng);

  const distanceExpr =
    `CASE WHEN ${latParam}::float8 IS NULL OR d.latitude IS NULL THEN NULL ELSE
       6371 * acos(LEAST(1, GREATEST(-1,
         cos(radians(${latParam}::float8)) * cos(radians(d.latitude)) *
         cos(radians(d.longitude) - radians(${lngParam}::float8)) +
         sin(radians(${latParam}::float8)) * sin(radians(d.latitude))
       ))) END`;

  const relevanceExpr = hasTerms
    ? `ts_rank(d.tsv, websearch_to_tsquery('french', ${qParam})) * 100`
    : "0";

  const limit = Math.min(params.limit ?? 200, 400);

  const sql = `
    WITH base AS (
      SELECT d.*, ${distanceExpr} AS distance_km, ${relevanceExpr} AS relevance
      FROM public.search_documents d
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    )
    SELECT b.object_type, b.object_id, b.facility_id, b.title, b.body, b.category,
           b.price, b.discount_percent, b.available, b.latitude, b.longitude,
           b.facility_status, b.media_url, b.distance_km,
           f.name AS facility_name, f.is_online AS facility_online, f.type AS facility_type,
           COALESCE(s.tier, 'free') AS tier,
           EXISTS (
             SELECT 1 FROM public.ad_campaigns c
             WHERE c.facility_id = b.facility_id
               AND c.campaign_active_until IS NOT NULL
               AND c.campaign_active_until > now()
           ) AS sponsored,
           r.rating AS rating,
           COALESCE(r.review_count, 0)::int AS review_count,
           COALESCE(t.tx_count, 0)::int AS transaction_count,
           (
             b.relevance
             + b.quality_score
             + COALESCE(r.rating, 0) * 3
             + LEAST(COALESCE(t.tx_count, 0), 20)
             + LEAST(b.discount_percent, 50) * 0.25
             + CASE WHEN b.available THEN 5 ELSE 0 END
             + CASE WHEN b.distance_km IS NULL THEN 0
                    ELSE GREATEST(0, 30 - b.distance_km * 2) END
             + CASE WHEN EXISTS (
                 SELECT 1 FROM public.ad_campaigns c
                 WHERE c.facility_id = b.facility_id
                   AND c.campaign_active_until IS NOT NULL
                   AND c.campaign_active_until > now()
               ) AND b.relevance > 0 THEN 12 ELSE 0 END
           )::float8 AS score
    FROM base b
    JOIN public.facilities f ON f.id = b.facility_id
    LEFT JOIN public.subscriptions s ON s.facility_id = b.facility_id
    LEFT JOIN LATERAL (
      SELECT avg(rating)::numeric(3,2) AS rating, count(*) AS review_count
      FROM public.reviews rv WHERE rv.facility_id = b.facility_id
    ) r ON true
    LEFT JOIN LATERAL (
      SELECT count(*) AS tx_count FROM public.transactions tx
      WHERE tx.facility_id = b.facility_id AND tx.status IN ('completed','user_confirmed')
    ) t ON true
    ${params.radiusKm ? `WHERE b.distance_km IS NULL OR b.distance_km <= ${push(params.radiusKm)}` : ""}
    ORDER BY ${
      params.sort === "distance"
        ? "b.distance_km NULLS LAST, score DESC"
        : params.sort === "price"
          ? "b.price NULLS LAST, score DESC"
          : "score DESC"
    }
    LIMIT ${limit}
  `;

  const rows = await query<OmniResult & { rating: string | null }>(sql, args);
  return rows.map((row) => ({
    ...row,
    rating: row.rating === null ? null : Number(row.rating),
    price: row.price === null ? null : Number(row.price),
    distance_km: row.distance_km === null ? null : Number(row.distance_km),
    score: Number(row.score),
  })) as OmniResult[];
}

export type SearchOutcome = {
  results: OmniResult[];
  total: number;
  interpretedAs: string | null;
  suggestions: string[];
};

/**
 * Runs the query, and when literal matching fails, asks the AI layer to turn
 * a problem statement ("mon PC chauffe") into concrete supply keywords.
 */
export async function omniSearchQuery(params: SearchParams): Promise<SearchOutcome> {
  const terms = normalise(params.q ?? "");
  let results = await runQuery(params, terms);
  let interpretedAs: string | null = null;
  let suggestions: string[] = [];

  if (terms.length > 2 && results.length < 3) {
    const expansion = await expandProblemQuery(params.q).catch(() => null);
    if (expansion && expansion.keywords.length) {
      suggestions = expansion.keywords;
      const merged = normalise(expansion.keywords.join(" "));
      const expanded = await runQuery({ ...params, q: merged }, merged);
      if (expanded.length > results.length) {
        results = expanded;
        interpretedAs = expansion.keywords.join(", ");
      }
    }
  }

  return { results, total: results.length, interpretedAs, suggestions };
}

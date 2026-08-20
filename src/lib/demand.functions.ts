import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware.server";
import { query, queryOne } from "./db.server";
import { enforceRateLimit } from "./rate-limit.server";
import { MAX_AVAILABILITY_TARGETS } from "./omni-v1-contracts";

export type DemandResponseRow = {
  id: string;
  facility_id: string;
  facility_name: string;
  available: boolean;
  kind: "available" | "partial" | "unavailable" | string;
  price: number | null;
  quantity: number | null;
  message: string | null;
  created_at: string;
};

export type DemandRequestRow = {
  id: string;
  search_term: string;
  quantity: number;
  radius_km: number | null;
  status: string;
  expires_at: string;
  created_at: string;
  response_count: number;
  targeted_count: number;
  ai_summary: string | null;
  ai_recommended_facility_id: string | null;
  ai_recommended_facility_name: string | null;
  credit_cost: number;
  mode: "bulk" | "manual" | string;
};

export type VendorDemandRequest = {
  id: string;
  search_term: string;
  quantity: number;
  mode: "bulk" | "manual" | string;
  created_at: string;
  expires_at: string;
  buyer_name: string | null;
  distance_km: number | null;
  answered: boolean;
  matched_product_id: string | null;
  matched_product_name: string | null;
  matched_product_price: number | null;
  matched_product_quantity: number | null;
  matched_product_photo_url: string | null;
};

/** Mode B — one search broadcast to every nearby seller. */
export const createDemandRequest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        searchTerm: z.string().min(2).max(120),
        quantity: z.number().int().min(1).max(999).default(1),
        latitude: z.number().min(-90).max(90).nullable().optional(),
        longitude: z.number().min(-180).max(180).nullable().optional(),
        radiusKm: z.number().min(0.5).max(50).nullable().optional(),
        budgetMax: z.number().int().min(0).max(100_000_000).nullable().optional(),
        // Keep one bounded safety cap while allowing the complete visible result set for Pro bulk.
        targetFacilityIds: z.array(z.string().uuid()).max(MAX_AVAILABILITY_TARGETS).default([]),
        mode: z.enum(["bulk", "manual"]).default("bulk"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit({
      bucket: "demand_request",
      subject: context.userId,
      limit: 10,
      windowSeconds: 600,
      message: "Trop de demandes groupées. Réessayez dans quelques minutes.",
    });

    const plan = await queryOne<{
      plan: string;
      requests_used: number;
      extra_credits: number;
      period_month: string;
    }>(
      `INSERT INTO public.user_plans (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET
         period_month = CASE WHEN public.user_plans.period_month <> to_char(now(), 'YYYY-MM') THEN to_char(now(), 'YYYY-MM') ELSE public.user_plans.period_month END,
         requests_used = CASE WHEN public.user_plans.period_month <> to_char(now(), 'YYYY-MM') THEN 0 ELSE public.user_plans.requests_used END
       RETURNING plan, requests_used, extra_credits, period_month`,
      [context.userId],
    );
    const buyerPlan = plan?.plan === "pro" ? "pro" : "free";
    const isBuyerPro = buyerPlan === "pro";
    if (data.mode === "bulk" && !isBuyerPro) {
      throw new Error(
        "La vérification groupée est réservée au plan Pro. Le plan gratuit conserve la vérification facility par facility.",
      );
    }
    if (data.mode === "manual" && data.targetFacilityIds.length !== 1) {
      throw new Error("Une vérification manuelle doit cibler exactement un commerce.");
    }

    // Bulk targets the map's active result IDs when present. Geographic limits are owned by search filters.
    const targets = await query<{
      id: string;
      owner_id: string | null;
      name: string;
      seller_plan: string;
    }>(
      `SELECT f.id, f.owner_id, f.name, COALESCE(s.tier, 'free') AS seller_plan
       FROM public.facilities f
       LEFT JOIN public.subscriptions s ON s.facility_id = f.id
       WHERE (
           cardinality($1::uuid[]) > 0 AND f.id = ANY($1::uuid[])
         ) OR (
           cardinality($1::uuid[]) = 0
           AND ($2::float8 IS NULL OR $3::float8 IS NULL OR $4::float8 IS NULL OR (
             6371 * acos(LEAST(1, GREATEST(-1,
               cos(radians($2)) * cos(radians(f.latitude)) *
               cos(radians(f.longitude) - radians($3)) +
               sin(radians($2)) * sin(radians(f.latitude))
             ))) <= $4
           ))
           AND (f.name ILIKE '%' || $5 || '%' OR f.category ILIKE '%' || $5 || '%' OR EXISTS (
             SELECT 1 FROM public.products p WHERE p.facility_id = f.id AND p.name ILIKE '%' || $5 || '%'
           ))
         )
         LIMIT ${MAX_AVAILABILITY_TARGETS}`,
      [
        data.targetFacilityIds,
        data.latitude ?? null,
        data.longitude ?? null,
        data.radiusKm ?? null,
        data.searchTerm.trim(),
      ],
    );

    if (data.mode === "bulk" && targets.length === 0) {
      throw new Error("Aucun commerce éligible dans cette zone.");
    }
    const creditCost = 0;
    const radiusKm = data.radiusKm ?? 10;

    const row = await queryOne<{ id: string }>(
      `INSERT INTO public.demand_requests
         (buyer_id, search_term, quantity, latitude, longitude, radius_km, budget_max, targeted_count, credit_cost, mode, ai_summary, ai_recommended_facility_id, ai_summary_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NULL,NULL,NULL) RETURNING id`,
      [
        context.userId,
        data.searchTerm.trim(),
        data.quantity,
        data.latitude ?? null,
        data.longitude ?? null,
        radiusKm,
        data.budgetMax ?? null,
        targets.length,
        creditCost,
        data.mode,
      ],
    );

    const owners = targets.filter((t) => t.owner_id).map((t) => ({ owner_id: t.owner_id! }));
    for (const o of owners) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          o.owner_id,
          "Nouvelle demande à proximité",
          `Un acheteur cherche : ${data.searchTerm.trim()}`,
          "/vendeur",
        ],
      );
    }

    // Automatic answers only when the facility is open AND the product has
    // stock explicitly allocated to Omni. Everything else stays manual.
    const { autoAnswerDemand } = await import("./availability.server");
    const autoAnswered = await autoAnswerDemand({
      requestId: row!.id,
      buyerId: context.userId,
      searchTerm: data.searchTerm,
      quantity: data.quantity,
      facilityIds: targets.map((t) => t.id),
    });

    return {
      id: row!.id,
      notified: owners.length,
      targeted: targets.length,
      aiAnswered: autoAnswered,
      creditCost,
      buyerPlan,
      bulkUnlimited: isBuyerPro,
    };
  });

/** Seller correction of an answer produced automatically in their name. */
export const correctAutoResponse = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        responseId: z.string().uuid(),
        kind: z.enum(["available", "partial", "unavailable"]),
        quantity: z.number().int().min(0).max(999).nullable().optional(),
        price: z.number().int().min(0).max(100_000_000).nullable().optional(),
        message: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const owned = await queryOne<{ id: string; buyer_id: string; facility_name: string }>(
      `SELECT r.id, d.buyer_id, f.name AS facility_name
       FROM public.demand_responses r
       JOIN public.facilities f ON f.id = r.facility_id
       JOIN public.demand_requests d ON d.id = r.request_id
       WHERE r.id = $1 AND f.owner_id = $2`,
      [data.responseId, context.userId],
    );
    if (!owned) throw new Error("Cette réponse ne vous appartient pas.");

    await query(
      `UPDATE public.demand_responses
       SET kind = $2, available = $3, quantity = $4, price = COALESCE($5, price),
           message = COALESCE($6, message), corrected_at = now()
       WHERE id = $1`,
      [
        data.responseId,
        data.kind,
        data.kind !== "unavailable",
        data.quantity ?? null,
        data.price ?? null,
        data.message?.trim() || null,
      ],
    );

    await query(
      `INSERT INTO public.notifications (user_id, title, body, link) VALUES ($1,$2,$3,$4)`,
      [
        owned.buyer_id,
        "Réponse corrigée par le vendeur",
        `${owned.facility_name} a corrigé sa réponse de disponibilité.`,
        "/",
      ],
    );
    return { ok: true };
  });


export const listMyDemandRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const requests = await query<DemandRequestRow>(
      `SELECT d.id, d.search_term, d.quantity, d.radius_km::float8 AS radius_km, d.status,
              d.expires_at, d.created_at, d.targeted_count, d.mode, d.ai_summary, d.ai_recommended_facility_id,
              rf.name AS ai_recommended_facility_name, COALESCE(d.credit_cost, d.targeted_count, 1)::int AS credit_cost,
              (SELECT count(*)::int FROM public.demand_responses r WHERE r.request_id = d.id)
                AS response_count
       FROM public.demand_requests d
       LEFT JOIN public.facilities rf ON rf.id = d.ai_recommended_facility_id
       WHERE d.buyer_id = $1
       ORDER BY d.created_at DESC LIMIT 30`,
      [context.userId],
    );
    if (requests.length === 0)
      return { requests, responses: [] as (DemandResponseRow & { request_id: string })[] };

    const responses = await query<DemandResponseRow & { request_id: string }>(
      `SELECT r.id, r.request_id, r.facility_id, f.name AS facility_name, r.available, r.kind,
              r.price, r.quantity, r.message, r.created_at
       FROM public.demand_responses r
       JOIN public.facilities f ON f.id = r.facility_id
       WHERE r.request_id = ANY($1::uuid[])
       ORDER BY CASE WHEN r.kind = 'partial' THEN 1 WHEN r.available THEN 0 ELSE 2 END,
                r.price ASC NULLS LAST`,
      [requests.map((r) => r.id)],
    );
    return { requests, responses };
  });

export const closeDemandRequest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await query(
      "UPDATE public.demand_requests SET status = 'closed' WHERE id = $1 AND buyer_id = $2",
      [data.id, context.userId],
    );
    return { ok: true };
  });

export type BuyerAvailabilityEntitlement = {
  plan: "free" | "pro";
  bulkAllowed: boolean;
  maxTargets: number;
};

export const getBuyerAvailabilityEntitlement = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const plan = await queryOne<{ plan: string }>(
      "SELECT plan FROM public.user_plans WHERE user_id = $1",
      [context.userId],
    );
    const isPro = plan?.plan === "pro";
    return {
      plan: isPro ? "pro" : "free",
      bulkAllowed: isPro,
      maxTargets: MAX_AVAILABILITY_TARGETS,
    } satisfies BuyerAvailabilityEntitlement;
  });

/** Seller side: open requests near one of my facilities. */
export const listDemandForFacility = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const facility = await queryOne<{ latitude: number; longitude: number }>(
      "SELECT latitude, longitude FROM public.facilities WHERE id = $1 AND owner_id = $2",
      [data.facilityId, context.userId],
    );
    if (!facility) throw new Error("Ce commerce ne vous appartient pas.");

    return query<VendorDemandRequest>(
      `SELECT d.id, d.search_term, d.quantity, d.mode, d.created_at, d.expires_at,
              p.name AS buyer_name,
              CASE WHEN d.latitude IS NULL THEN NULL ELSE
                6371 * acos(LEAST(1, GREATEST(-1,
                  cos(radians(d.latitude)) * cos(radians($2)) *
                  cos(radians($3) - radians(d.longitude)) +
                  sin(radians(d.latitude)) * sin(radians($2))
                )))
              END AS distance_km,
              match.id AS matched_product_id,
              match.name AS matched_product_name,
              match.price AS matched_product_price,
              match.quantity_available AS matched_product_quantity,
              match.photo_url AS matched_product_photo_url,
              EXISTS (
                SELECT 1 FROM public.demand_responses r
                WHERE r.request_id = d.id AND r.facility_id = $1
              ) AS answered
       FROM public.demand_requests d
       JOIN public.profiles p ON p.id = d.buyer_id
       LEFT JOIN LATERAL (
         SELECT pr.id, pr.name, pr.price, pr.quantity_available, pr.photo_url
         FROM public.products pr
         WHERE pr.facility_id = $1
           AND pr.name ILIKE '%' || d.search_term || '%'
           AND pr.in_stock = true
           AND COALESCE(pr.status, 'active') = 'active'
           AND COALESCE(pr.quantity_available, 1) > 0
           AND COALESCE(pr.omni_allocation_percent, 100) > 0
         ORDER BY pr.quantity_available DESC, pr.last_confirmed_at DESC NULLS LAST, pr.name ASC
         LIMIT 1
       ) match ON true
       WHERE d.status = 'open' AND d.expires_at > now()
       ORDER BY d.created_at DESC
       LIMIT 40`,
      [data.facilityId, facility.latitude, facility.longitude],
    );
  });

export const respondToDemand = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        requestId: z.string().uuid(),
        kind: z.enum(["available", "partial", "unavailable"]).default("available"),
        price: z.number().int().min(0).max(100_000_000).nullable().optional(),
        quantity: z.number().int().min(0).max(999).nullable().optional(),
        message: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const owned = await queryOne<{ id: string; name: string }>(
      "SELECT id, name FROM public.facilities WHERE id = $1 AND owner_id = $2",
      [data.facilityId, context.userId],
    );
    if (!owned) throw new Error("Ce commerce ne vous appartient pas.");

    const request = await queryOne<{ buyer_id: string; search_term: string }>(
      `SELECT buyer_id, search_term
       FROM public.demand_requests
       WHERE id = $1 AND status = 'open' AND expires_at > now()`,
      [data.requestId],
    );
    if (!request) throw new Error("Cette demande n’est plus ouverte.");

    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM public.demand_responses WHERE request_id = $1 AND facility_id = $2",
      [data.requestId, data.facilityId],
    );
    if (existing) throw new Error("Vous avez déjà répondu à cette demande.");

    const inserted = await query<{ id: string }>(
      `INSERT INTO public.demand_responses
         (request_id, facility_id, available, kind, price, quantity, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (request_id, facility_id) DO NOTHING
       RETURNING id`,
      [
        data.requestId,
        data.facilityId,
        data.kind !== "unavailable",
        data.kind,
        data.price ?? null,
        data.quantity ?? null,
        data.message?.trim() || null,
      ],
    );
    if (inserted.length === 0) throw new Error("Vous avez déjà répondu à cette demande.");
    const responseId = inserted[0]?.id;
    if (!responseId) throw new Error("La réponse vendeur n’a pas pu être identifiée.");

    if (request) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          request.buyer_id,
          data.kind === "unavailable" ? "Réponse à votre demande" : "Un vendeur a répondu",
          `${owned.name} a répondu (${data.kind === "partial" ? "partiel" : data.kind === "available" ? "disponible" : "indisponible"}) à « ${request.search_term} ».`,
          `/carte?requestId=${encodeURIComponent(data.requestId)}&responseId=${encodeURIComponent(responseId)}`,
        ],
      );
    }
    return { ok: true };
  });

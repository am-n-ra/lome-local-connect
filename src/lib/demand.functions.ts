import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware";
import { query, queryOne } from "./db.server";
import { OMNI_CONFIG } from "./omni.config";
import { enforceRateLimit } from "./rate-limit.server";

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
};

export type VendorDemandRequest = {
  id: string;
  search_term: string;
  quantity: number;
  created_at: string;
  expires_at: string;
  buyer_name: string | null;
  distance_km: number | null;
  answered: boolean;
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
        targetFacilityIds: z.array(z.string().uuid()).max(700).default([]),
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
    const includedCredits = plan?.plan === "pro" ? 30 : OMNI_CONFIG.freeBuyerBulkLimit;

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
       LIMIT 700`,
      [
        data.targetFacilityIds,
        data.latitude ?? null,
        data.longitude ?? null,
        data.radiusKm ?? null,
        data.searchTerm.trim(),
      ],
    );

    const creditCost = Math.max(1, targets.length);
    const remainingCredits =
      Math.max(0, includedCredits - (plan?.requests_used ?? 0)) + (plan?.extra_credits ?? 0);
    if (remainingCredits < creditCost) {
      throw new Error(
        `Crédits de vérification insuffisants : ${creditCost} crédit(s) requis, ${remainingCredits} disponible(s). Le plan gratuit inclut 3 crédits/mois, soit 3 vérifications normales.`,
      );
    }

    const proTargets = targets.filter((t) => t.seller_plan === "pro");
    const recommendedFacilityId = proTargets[0]?.id ?? targets[0]?.id ?? null;
    const aiSummary =
      targets.length > 0
        ? `${targets.length} commerce(s) ciblé(s), ${proTargets.length} réponse(s) IA priorisée(s).`
        : "Aucun commerce ciblé par les filtres actuels.";

    const row = await queryOne<{ id: string }>(
      `INSERT INTO public.demand_requests
         (buyer_id, search_term, quantity, latitude, longitude, radius_km, budget_max, targeted_count, credit_cost, ai_summary, ai_recommended_facility_id, ai_summary_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now()) RETURNING id`,
      [
        context.userId,
        data.searchTerm.trim(),
        data.quantity,
        data.latitude ?? null,
        data.longitude ?? null,
        data.radiusKm ?? null,
        data.budgetMax ?? null,
        targets.length,
        creditCost,
        aiSummary,
        recommendedFacilityId,
      ],
    );

    await query(
      `UPDATE public.user_plans SET
         requests_used = requests_used + LEAST($3, GREATEST(0, $2 - requests_used)),
         extra_credits = GREATEST(0, extra_credits - GREATEST(0, $3 - GREATEST(0, $2 - requests_used))),
         updated_at = now()
       WHERE user_id = $1`,
      [context.userId, includedCredits, creditCost],
    );

    for (const t of proTargets.slice(0, 120)) {
      await query(
        `INSERT INTO public.demand_responses (request_id, facility_id, available, price, quantity, message, answered_by)
         VALUES ($1,$2,true,NULL,$3,$4,'ai')
         ON CONFLICT (request_id, facility_id) DO NOTHING`,
        [
          row!.id,
          t.id,
          data.quantity,
          `Agent IA ${t.name} : disponibilité à confirmer, vendeur pro priorisé.`,
        ],
      );
    }

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

    return {
      id: row!.id,
      notified: owners.length,
      targeted: targets.length,
      aiAnswered: proTargets.length,
      creditCost,
    };
  });

export const listMyDemandRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const requests = await query<DemandRequestRow>(
      `SELECT d.id, d.search_term, d.quantity, d.radius_km::float8 AS radius_km, d.status,
              d.expires_at, d.created_at, d.targeted_count, d.ai_summary, d.ai_recommended_facility_id,
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
       ORDER BY r.available DESC, r.price ASC NULLS LAST`,
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
      `SELECT d.id, d.search_term, d.quantity, d.created_at, d.expires_at,
              p.name AS buyer_name,
              CASE WHEN d.latitude IS NULL THEN NULL ELSE
                6371 * acos(LEAST(1, GREATEST(-1,
                  cos(radians(d.latitude)) * cos(radians($2)) *
                  cos(radians($3) - radians(d.longitude)) +
                  sin(radians(d.latitude)) * sin(radians($2))
                )))
              END AS distance_km,
              EXISTS (
                SELECT 1 FROM public.demand_responses r
                WHERE r.request_id = d.id AND r.facility_id = $1
              ) AS answered
       FROM public.demand_requests d
       JOIN public.profiles p ON p.id = d.buyer_id
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

    await query(
      `INSERT INTO public.demand_responses
         (request_id, facility_id, available, kind, price, quantity, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (request_id, facility_id) DO UPDATE
         SET available = EXCLUDED.available, kind = EXCLUDED.kind, price = EXCLUDED.price,
             quantity = EXCLUDED.quantity, message = EXCLUDED.message`,
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

    const buyer = await queryOne<{ buyer_id: string; search_term: string }>(
      "SELECT buyer_id, search_term FROM public.demand_requests WHERE id = $1",
      [data.requestId],
    );
    if (buyer) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          buyer.buyer_id,
          data.kind === "unavailable" ? "Réponse à votre demande" : "Un vendeur a répondu",
          `${owned.name} a répondu (${data.kind === "partial" ? "partiel" : data.kind === "available" ? "disponible" : "indisponible"}) à « ${buyer.search_term} ».`,
          "/carte",
        ],
      );
    }
    return { ok: true };
  });

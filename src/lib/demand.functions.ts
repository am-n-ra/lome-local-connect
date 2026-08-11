import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware";
import { query, queryOne } from "./db.server";
import { enforceRateLimit } from "./rate-limit.server";

export type DemandResponseRow = {
  id: string;
  facility_id: string;
  facility_name: string;
  available: boolean;
  price: number | null;
  quantity: number | null;
  message: string | null;
  created_at: string;
};

export type DemandRequestRow = {
  id: string;
  search_term: string;
  quantity: number;
  radius_km: number;
  status: string;
  expires_at: string;
  created_at: string;
  response_count: number;
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
        radiusKm: z.number().min(0.5).max(50).default(5),
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

    const row = await queryOne<{ id: string }>(
      `INSERT INTO public.demand_requests
         (buyer_id, search_term, quantity, latitude, longitude, radius_km)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [
        context.userId,
        data.searchTerm.trim(),
        data.quantity,
        data.latitude ?? null,
        data.longitude ?? null,
        data.radiusKm,
      ],
    );

    // Notify nearby claimed sellers so they can answer with availability.
    const owners = await query<{ owner_id: string }>(
      `SELECT DISTINCT f.owner_id
       FROM public.facilities f
       WHERE f.owner_id IS NOT NULL
         AND ($1::float8 IS NULL OR (
           6371 * acos(LEAST(1, GREATEST(-1,
             cos(radians($1)) * cos(radians(f.latitude)) *
             cos(radians(f.longitude) - radians($2)) +
             sin(radians($1)) * sin(radians(f.latitude))
           ))) <= $3
         ))
       LIMIT 60`,
      [data.latitude ?? null, data.longitude ?? null, data.radiusKm],
    );
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

    return { id: row!.id, notified: owners.length };
  });

export const listMyDemandRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const requests = await query<DemandRequestRow>(
      `SELECT d.id, d.search_term, d.quantity, d.radius_km::float8 AS radius_km, d.status,
              d.expires_at, d.created_at,
              (SELECT count(*)::int FROM public.demand_responses r WHERE r.request_id = d.id)
                AS response_count
       FROM public.demand_requests d
       WHERE d.buyer_id = $1
       ORDER BY d.created_at DESC LIMIT 30`,
      [context.userId],
    );
    if (requests.length === 0) return { requests, responses: [] as (DemandResponseRow & { request_id: string })[] };

    const responses = await query<DemandResponseRow & { request_id: string }>(
      `SELECT r.id, r.request_id, r.facility_id, f.name AS facility_name, r.available,
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
  .inputValidator((input: unknown) =>
    z.object({ facilityId: z.string().uuid() }).parse(input),
  )
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
        available: z.boolean(),
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
         (request_id, facility_id, available, price, quantity, message)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (request_id, facility_id) DO UPDATE
         SET available = EXCLUDED.available, price = EXCLUDED.price,
             quantity = EXCLUDED.quantity, message = EXCLUDED.message`,
      [
        data.requestId,
        data.facilityId,
        data.available,
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
          data.available ? "Un vendeur a votre produit" : "Réponse à votre demande",
          `${owned.name} a répondu à « ${buyer.search_term} ».`,
          "/carte",
        ],
      );
    }
    return { ok: true };
  });

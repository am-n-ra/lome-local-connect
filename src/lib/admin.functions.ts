import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireStaff } from "./auth-middleware";
import { query, queryOne } from "./db.server";
import { writeAudit } from "./neon-auth.server";

export type AdminFacilityRow = {
  id: string;
  name: string;
  category: string;
  status: string;
  type: string;
  address: string | null;
  neighbourhood: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  source: string;
  owner_id: string | null;
  contacted_at: string | null;
  contact_outcome: string | null;
  contact_notes: string | null;
  created_at: string;
};

export type AdminStats = {
  total: number;
  non_reclame: number;
  non_confirme: number;
  verifie: number;
  confirme: number;
  contacted: number;
  products: number;
  wishlists: number;
  campaigns_active: number;
};

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async () => {
    const row = await queryOne<AdminStats>(`
      SELECT
        (SELECT count(*) FROM public.facilities)::int AS total,
        (SELECT count(*) FROM public.facilities WHERE status = 'non_reclame')::int AS non_reclame,
        (SELECT count(*) FROM public.facilities WHERE status = 'non_confirme')::int AS non_confirme,
        (SELECT count(*) FROM public.facilities WHERE status = 'verifie')::int AS verifie,
        (SELECT count(*) FROM public.facilities WHERE status = 'confirme')::int AS confirme,
        (SELECT count(*) FROM public.facilities WHERE contacted_at IS NOT NULL)::int AS contacted,
        (SELECT count(*) FROM public.products)::int AS products,
        (SELECT count(*) FROM public.wishlists)::int AS wishlists,
        (SELECT count(*) FROM public.ad_campaigns
          WHERE campaign_active_until IS NOT NULL AND campaign_active_until > now())::int AS campaigns_active
    `);
    return row!;
  });

export const listAdminFacilities = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) =>
    z
      .object({
        search: z.string().max(120).optional(),
        status: z.string().max(20).optional(),
        category: z.string().max(40).optional(),
        neighbourhood: z.string().max(80).optional(),
        contacted: z.enum(["any", "yes", "no"]).optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const clauses: string[] = ["1 = 1"];
    const params: unknown[] = [];

    if (data.status && data.status !== "all") {
      params.push(data.status);
      clauses.push(`status = $${params.length}`);
    }
    if (data.category && data.category !== "all") {
      params.push(data.category);
      clauses.push(`category = $${params.length}`);
    }
    if (data.neighbourhood && data.neighbourhood.trim()) {
      params.push(`%${data.neighbourhood.trim()}%`);
      clauses.push(`neighbourhood ILIKE $${params.length}`);
    }
    if (data.search && data.search.trim()) {
      params.push(`%${data.search.trim()}%`);
      const i = params.length;
      clauses.push(`(name ILIKE $${i} OR address ILIKE $${i} OR phone ILIKE $${i})`);
    }
    if (data.contacted === "yes") clauses.push("contacted_at IS NOT NULL");
    if (data.contacted === "no") clauses.push("contacted_at IS NULL");

    params.push(data.limit ?? 60);

    return query<AdminFacilityRow>(
      `SELECT id, name, category, status, type, address, neighbourhood, phone,
              latitude, longitude, source, owner_id, contacted_at, contact_outcome,
              contact_notes, created_at
       FROM public.facilities
       WHERE ${clauses.join(" AND ")}
       ORDER BY (contacted_at IS NULL) DESC, created_at DESC
       LIMIT $${params.length}`,
      params,
    );
  });

export const listNeighbourhoods = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async () =>
    query<{ neighbourhood: string; count: number }>(
      `SELECT neighbourhood, count(*)::int AS count
       FROM public.facilities
       WHERE neighbourhood IS NOT NULL AND neighbourhood <> ''
       GROUP BY neighbourhood ORDER BY count DESC LIMIT 40`,
    ),
  );

export const markContacted = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        outcome: z.enum(["interesse", "rappeler", "refus", "injoignable"]),
        notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await query(
      `UPDATE public.facilities
       SET contacted_at = now(), contact_outcome = $2, contact_notes = $3
       WHERE id = $1`,
      [data.facilityId, data.outcome, data.notes?.trim() || null],
    );
    await writeAudit(context.userId, "facility.contacted", "facility", data.facilityId, {
      outcome: data.outcome,
    });
    return { ok: true };
  });

/** Admin/moderator state change. `confirme` is earned, never set by hand. */
export const setFacilityStatus = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        status: z.enum(["non_reclame", "non_confirme", "verifie"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await query(
      `UPDATE public.facilities
       SET status = $2,
           verified_at = CASE WHEN $2 = 'verifie' THEN now() ELSE verified_at END
       WHERE id = $1`,
      [data.facilityId, data.status],
    );
    await writeAudit(context.userId, "facility.status", "facility", data.facilityId, {
      status: data.status,
    });
    return { ok: true };
  });

export const updateAdminFacility = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        name: z.string().min(2).max(120),
        category: z.string().min(2).max(40),
        neighbourhood: z.string().max(80).nullable().optional(),
        address: z.string().max(180).nullable().optional(),
        phone: z.string().max(40).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await query(
      `UPDATE public.facilities
       SET name = $2, category = $3, neighbourhood = $4, address = $5, phone = $6
       WHERE id = $1`,
      [
        data.facilityId,
        data.name.trim(),
        data.category,
        data.neighbourhood?.trim() || null,
        data.address?.trim() || null,
        data.phone?.trim() || null,
      ],
    );
    await writeAudit(context.userId, "facility.updated", "facility", data.facilityId, null);
    return { ok: true };
  });

export type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async () =>
    query<AuditRow>(
      `SELECT id, actor_id, action, entity_type, entity_id, created_at
       FROM public.audit_log ORDER BY created_at DESC LIMIT 50`,
    ),
  );

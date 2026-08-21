import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireStaff } from "./auth-middleware.server";
import { query, queryOne } from "./db.server";
import { writeAudit } from "./neon-auth.server";
import { appendWalletEntry, ensureWalletAccount, listWalletBalances } from "./wallet.server";

export type AdminFacilityRow = {
  id: string;
  name: string;
  company_id: string | null;
  company_name: string | null;
  company_status: string | null;
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
  unclaimed: number;
  unconfirmed: number;
  certified: number;
  confirmed: number;
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
        (SELECT count(*) FROM public.facilities WHERE status = 'unclaimed')::int AS unclaimed,
        (SELECT count(*) FROM public.facilities WHERE status = 'unconfirmed')::int AS unconfirmed,
        (SELECT count(*) FROM public.facilities WHERE status = 'certified')::int AS certified,
        (SELECT count(*) FROM public.facilities WHERE status = 'confirmed')::int AS confirmed,
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
      `SELECT f.id, f.name, f.company_id, c.name AS company_name, c.status AS company_status,
              f.category, f.status, f.type, f.address, f.neighbourhood, f.phone,
              f.latitude, f.longitude, f.source, f.owner_id, f.contacted_at, f.contact_outcome,
              f.contact_notes, f.created_at
       FROM public.facilities f
       LEFT JOIN public.companies c ON c.id = f.company_id
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

/** Admin/moderator state change. `confirmed` is earned, never set by hand. */
export const setFacilityStatus = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        status: z.enum(["unclaimed", "unconfirmed", "certified"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.status !== "unclaimed") {
      throw new Error(
        "Les statuts certifiée et non confirmée doivent provenir d'une revue de certification auditée.",
      );
    }
    await query(
      `UPDATE public.facilities
       SET status = 'unclaimed', owner_id = NULL, claimed_at = NULL,
           updated_at = now()
       WHERE id = $1`,
      [data.facilityId],
    );
    await writeAudit(context.userId, "facility.status.repair", "facility", data.facilityId, {
      status: "unclaimed",
      reason: "manual_admin_repair",
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

// ── Phase 4 — plateforme : paiements, portefeuilles, modération financière ──

export type PlatformMetrics = {
  deposits_total: number;
  deposits_approved: number;
  deposits_pending: number;
  wallet_total: number;
  payout_total: number;
  pro_facilities: number;
  carts_pending: number;
  users: number;
};

export const getPlatformMetrics = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async () => {
    const row = await queryOne<PlatformMetrics>(`
      SELECT
        (SELECT COALESCE(sum(amount), 0) FROM public.wallet_deposits WHERE status = 'approved')::int AS deposits_total,
        (SELECT count(*) FROM public.wallet_deposits WHERE status = 'approved')::int AS deposits_approved,
        (SELECT count(*) FROM public.wallet_deposits WHERE status = 'pending')::int AS deposits_pending,
        (SELECT COALESCE(sum(available_amount) FILTER (WHERE bucket = 'wallet'), 0)
         FROM public.wallet_balance_snapshots)::int AS wallet_total,
        (SELECT COALESCE(sum(available_amount) FILTER (WHERE bucket = 'payout'), 0)
         FROM public.wallet_balance_snapshots)::int AS payout_total,
        (SELECT count(*) FROM public.subscriptions WHERE tier = 'pro')::int AS pro_facilities,
        (SELECT count(*) FROM public.carts WHERE status = 'pending')::int AS carts_pending,
        (SELECT count(*) FROM public.profiles)::int AS users
    `);
    return row!;
  });

export type AdminDepositRow = {
  id: string;
  facility_id: string;
  facility_name: string;
  amount: number;
  status: string;
  provider_txn_id: string | null;
  created_at: string;
  credited_at: string | null;
};

export const listAdminDeposits = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async () =>
    query<AdminDepositRow>(
      `SELECT d.id, d.facility_id, f.name AS facility_name, d.amount, d.status,
              d.provider_txn_id, d.created_at, d.credited_at
       FROM public.wallet_deposits d
       JOIN public.facilities f ON f.id = d.facility_id
       ORDER BY d.created_at DESC LIMIT 40`,
    ),
  );

/** Manual wallet correction (refund, goodwill credit). Always audited. */
export const adjustWallet = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        amount: z
          .number()
          .int()
          .min(-1_000_000)
          .max(1_000_000)
          .refine((v) => v !== 0, {
            message: "Montant requis",
          }),
        reason: z.string().min(3).max(300),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const accountId = await ensureWalletAccount({ facilityId: data.facilityId });
    const entryId = await appendWalletEntry({
      accountId,
      bucket: "wallet",
      amount: data.amount,
      referenceType: "admin_adjustment",
      referenceId: data.facilityId,
      idempotencyKey: `admin:wallet-adjustment:${context.userId}:${crypto.randomUUID()}`,
      actorUserId: context.userId,
      source: "admin",
      metadata: { reason: data.reason },
    });
    const balances = await listWalletBalances(accountId);
    const balance = balances.find((row) => row.bucket === "wallet")?.availableAmount ?? 0;
    await writeAudit(context.userId, "wallet.adjust", "facility", data.facilityId, {
      amount: data.amount,
      reason: data.reason,
      entryId,
      balance,
    });
    return { balance, entryId };
  });

export type AdminCompanyRow = {
  id: string;
  name: string;
  legal_name: string | null;
  country_code: string | null;
  status: string;
  owner_name: string | null;
  facilities_count: number;
  certified_count: number;
  created_at: string;
};

/** Certification happens at company level; facilities inherit the trust badge. */
export const listAdminCompanies = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(["all", "unverified", "pending", "certified", "rejected"]).default("all"),
        search: z.string().trim().max(120).optional(),
        limit: z.number().int().min(1).max(200).default(60),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const params: unknown[] = [];
    const clauses: string[] = [];
    if (data.status !== "all") {
      params.push(data.status);
      clauses.push(`c.status = $${params.length}`);
    }
    if (data.search) {
      params.push(`%${data.search}%`);
      clauses.push(`(c.name ILIKE $${params.length} OR c.legal_name ILIKE $${params.length})`);
    }
    params.push(data.limit);
    return query<AdminCompanyRow>(
      `SELECT c.id, c.name, c.legal_name, c.country_code, c.status,
              p.name AS owner_name,
              (SELECT count(*) FROM public.facilities f WHERE f.company_id = c.id)::int AS facilities_count,
              (SELECT count(*) FROM public.facilities f
                WHERE f.company_id = c.id AND f.status IN ('certified','confirmed'))::int AS certified_count,
              c.created_at
       FROM public.companies c
       LEFT JOIN public.profiles p ON p.id = c.owner_id
       ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
       ORDER BY (c.status = 'pending') DESC, c.created_at DESC
       LIMIT $${params.length}`,
      params,
    );
  });

/** Certifying a company promotes its claimed facilities to the certified trust level. */
export const setCompanyStatus = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) =>
    z
      .object({
        companyId: z.string().uuid(),
        status: z.enum(["unverified", "pending", "certified", "rejected"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await query(`UPDATE public.companies SET status = $2, updated_at = now() WHERE id = $1`, [
      data.companyId,
      data.status,
    ]);
    // Company certification is supporting evidence only. Facility status changes
    // require a facility-specific verification request and audited review outcome.
    await writeAudit(context.userId, "company.status", "company", data.companyId, {
      status: data.status,
    });
    return { ok: true };
  });

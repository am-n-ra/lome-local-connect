import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware.server";
import { query, queryOne } from "./db.server";
import { writeAudit } from "./neon-auth.server";
import { campaignCostFor, extendedProUntil, FREE_PRODUCT_CAP, QUALIFYING_AMOUNT } from "./vendor";
import { currentMonthKey, haversineKm } from "./omni";
import { OMNI_CONFIG } from "./omni.config";
import {
  consumeWalletBucket,
  ensureWalletAccount,
  listWalletBalances,
} from "./wallet.server";

export type VendorCompany = {
  id: string;
  owner_id: string;
  name: string;
  legal_name: string | null;
  country_code: string | null;
  status: string;
};

export type VendorFacility = {
  id: string;
  name: string;
  company_id: string | null;
  company_name: string | null;
  company_status: string | null;
  category: string;
  description: string | null;
  address: string | null;
  neighbourhood: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  status: string;
  type: string;
  is_online: boolean;
  last_position_update: string | null;
  operating_hours: string | null;
  manual_open: boolean;
  discovery_mode: boolean;
  discovery_until: string | null;
  emergency_shutdown: boolean;
  created_at: string;
};

export type VendorProduct = {
  id: string;
  facility_id: string;
  name: string;
  price: number;
  discount_percent: number;
  in_stock: boolean;
  status: string;
  quantity_available: number;
  omni_allocation_percent: number;
  quantity_allocated_omni: number;
  photo_url: string | null;
  last_confirmed_at: string | null;
};

export type VendorSubscription = {
  facility_id: string;
  tier: string;
  wallet_balance: number;
  payout_balance: number;
  pro_active_until: string | null;
  last_qualifying_action_month: string | null;
};

export type VendorCampaign = {
  id: string;
  facility_id: string;
  product_ids: string[];
  radius_km: number | null;
  is_city_wide: boolean;
  cost_fcfa: number;
  reach_estimate: number;
  campaign_active_until: string | null;
  created_at: string;
};

export type VendorCoupon = {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  created_at: string;
  redemption_count: number;
};

export type VendorBalance = { bucket: string; amount: number };

export type VendorUnlock = {
  unlock_type: string;
  status: string;
  qualifying_count: number;
  required_count: number;
  expires_at: string | null;
};

export type VendorRequest = {
  id: string;
  status: string;
  created_at: string;
  buyer_name: string | null;
  items: { name: string; quantity: number; price_at_time: number }[];
  total: number;
};

export type DemandSignal = { search_term: string; hits: number; last_seen: string };

export type VendorShell = {
  facilities: VendorFacility[];
  companies: VendorCompany[];
  subscription: VendorSubscription | null;
  balances: VendorBalance[];
  unlock: VendorUnlock | null;
  counts: {
    products: number;
    requests: number;
    coupons: number;
    campaigns: number;
  };
};

async function assertOwner(userId: string, facilityId: string) {
  const row = await queryOne<{ id: string }>(
    "SELECT id FROM public.facilities WHERE id = $1 AND owner_id = $2",
    [facilityId, userId],
  );
  if (!row) throw new Error("Ce commerce ne vous appartient pas.");
}

async function ensureSubscription(facilityId: string): Promise<VendorSubscription> {
  const existing = await queryOne<VendorSubscription>(
    "SELECT * FROM public.subscriptions WHERE facility_id = $1",
    [facilityId],
  );
  if (existing) return existing;
  const created = await queryOne<VendorSubscription>(
    "INSERT INTO public.subscriptions (facility_id) VALUES ($1) RETURNING *",
    [facilityId],
  );
  return created!;
}

/** Everything the vendor dashboard renders, in one round trip. */
export const getVendorDashboard = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const facilities = await query<VendorFacility>(
      `SELECT f.id, f.name, f.company_id, c.name AS company_name, c.status AS company_status,
              f.category, f.description, f.address, f.neighbourhood, f.latitude, f.longitude,
              f.phone, f.status, f.type, f.is_online, f.last_position_update, f.operating_hours,
              f.manual_open, f.discovery_mode, f.discovery_until, f.emergency_shutdown, f.created_at
       FROM public.facilities f
       LEFT JOIN public.companies c ON c.id = f.company_id
       WHERE f.owner_id = $1 ORDER BY f.created_at ASC LIMIT ${OMNI_CONFIG.sellerFreeFacilityLimit}`,
      [context.userId],
    );
    if (facilities.length === 0) {
      return {
        facilities: [],
        subscription: null,
        products: [],
        campaigns: [],
        coupons: [],
        requests: [],
        demand: [],
        walletBalance: 0,
        balances: [],
        unlock: null,
      };
    }

    const facility = facilities[0]!;
    const walletAccountId = await ensureWalletAccount({ facilityId: facility.id });
    const subscription = await ensureSubscription(facility.id);

    // Pro is monthly and must be re-earned: drop it when it lapsed without a
    // qualifying deposit or ad spend during the current month.
    let effective = subscription;
    const lapsed =
      subscription.tier === "pro" &&
      (!subscription.pro_active_until ||
        new Date(subscription.pro_active_until).getTime() < Date.now()) &&
      subscription.last_qualifying_action_month !== currentMonthKey();
    if (lapsed) {
      effective =
        (await queryOne<VendorSubscription>(
          `UPDATE public.subscriptions SET tier = 'free', pro_active_until = NULL
           WHERE facility_id = $1 RETURNING *`,
          [facility.id],
        )) ?? subscription;
    }

    const [products, campaigns, coupons, requestRows, demand, balances, unlock] = await Promise.all(
      [
        query<VendorProduct>(
          `SELECT id, facility_id, name, price, discount_percent, in_stock,
                COALESCE(status, CASE WHEN in_stock THEN 'active' ELSE 'sold_out' END) AS status,
                COALESCE(quantity_available, CASE WHEN in_stock THEN 1 ELSE 0 END)::int AS quantity_available,
                COALESCE(omni_allocation_percent, 100)::int AS omni_allocation_percent,
                COALESCE(quantity_allocated_omni, 0)::int AS quantity_allocated_omni,
                photo_url, last_confirmed_at
         FROM public.products WHERE facility_id = $1 ORDER BY created_at DESC`,
          [facility.id],
        ),
        query<VendorCampaign>(
          `SELECT id, facility_id, product_ids, radius_km, is_city_wide, cost_fcfa,
                reach_estimate, campaign_active_until, created_at
         FROM public.ad_campaigns WHERE facility_id = $1 ORDER BY created_at DESC`,
          [facility.id],
        ),
        query<VendorCoupon>(
          `SELECT c.id, c.code, c.description, c.discount_percent, c.created_at,
                (SELECT count(*) FROM public.redemptions r WHERE r.coupon_id = c.id)::int AS redemption_count
         FROM public.coupons c WHERE c.facility_id = $1 ORDER BY c.created_at DESC`,
          [facility.id],
        ),
        query<{
          id: string;
          status: string;
          created_at: string;
          buyer_name: string | null;
          items: { name: string; quantity: number; price_at_time: number }[] | null;
        }>(
          `SELECT ca.id, ca.status, ca.created_at, p.name AS buyer_name,
                COALESCE(
                  json_agg(json_build_object('name', pr.name, 'quantity', ci.quantity,
                                             'price_at_time', ci.price_at_time))
                  FILTER (WHERE ci.id IS NOT NULL), '[]'
                ) AS items
         FROM public.carts ca
         LEFT JOIN public.profiles p ON p.id = ca.buyer_id
         LEFT JOIN public.cart_items ci ON ci.cart_id = ca.id
         LEFT JOIN public.products pr ON pr.id = ci.product_id
         WHERE ca.facility_id = $1
         GROUP BY ca.id, p.name
         ORDER BY ca.created_at DESC LIMIT 50`,
          [facility.id],
        ),
        query<DemandSignal>(
          `SELECT lower(search_term) AS search_term, count(*)::int AS hits,
                max(created_at) AS last_seen
         FROM public.wishlists
         WHERE created_at > now() - interval '30 days'
         GROUP BY lower(search_term)
         ORDER BY hits DESC, last_seen DESC LIMIT 20`,
        ),
        listWalletBalances(walletAccountId).then((rows) =>
          rows.map((row) => ({ bucket: row.bucket, amount: row.availableAmount })),
        ),
        queryOne<VendorUnlock>(
          `SELECT unlock_type, status, qualifying_count, required_count, expires_at
         FROM public.seller_unlocks
         WHERE facility_id = $1 AND unlock_type = 'pro_test_credit_20_usd'`,
          [facility.id],
        ),
      ],
    );

    const requests: VendorRequest[] = requestRows.map((r) => {
      const items = r.items ?? [];
      return {
        id: r.id,
        status: r.status,
        created_at: r.created_at,
        buyer_name: r.buyer_name,
        items,
        total: items.reduce((s, i) => s + i.quantity * i.price_at_time, 0),
      };
    });

    const walletBalance = balances.find((row) => row.bucket === "wallet")?.amount ?? 0;
    const effectiveWithWallet = { ...effective, wallet_balance: walletBalance };
    return {
      facilities,
      subscription: effectiveWithWallet,
      products,
      campaigns,
      coupons,
      requests,
      demand,
      walletBalance,
      balances,
      unlock,
    };
  });

/** Lightweight map-first payload. Heavy sections load when their surface opens. */
export const getVendorShell = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<VendorShell> => {
    const facilities = await query<VendorFacility>(
      `SELECT f.id, f.name, f.company_id, c.name AS company_name, c.status AS company_status,
              f.category, f.description, f.address, f.neighbourhood, f.latitude, f.longitude,
              f.phone, f.status, f.type, f.is_online, f.last_position_update, f.operating_hours,
              f.manual_open, f.discovery_mode, f.discovery_until, f.emergency_shutdown, f.created_at
       FROM public.facilities f
       LEFT JOIN public.companies c ON c.id = f.company_id
       WHERE f.owner_id = $1 ORDER BY f.created_at ASC LIMIT ${OMNI_CONFIG.sellerFreeFacilityLimit}`,
      [context.userId],
    );
    const companies = await query<VendorCompany>(
      `SELECT id, owner_id, name, legal_name, country_code, status
       FROM public.companies WHERE owner_id = $1 ORDER BY created_at ASC`,
      [context.userId],
    );
    if (facilities.length === 0) {
      return {
        facilities: [],
        companies,
        subscription: null,
        balances: [],
        unlock: null,
        counts: { products: 0, requests: 0, coupons: 0, campaigns: 0 },
      };
    }
    const facility = facilities[0]!;
    const walletAccountId = await ensureWalletAccount({ facilityId: facility.id });
    const [subscription, balances, unlock, counts] = await Promise.all([
      ensureSubscription(facility.id),
      listWalletBalances(walletAccountId).then((rows) =>
        rows.map((row) => ({ bucket: row.bucket, amount: row.availableAmount })),
      ),
      queryOne<VendorUnlock>(
        `SELECT unlock_type, status, qualifying_count, required_count, expires_at
         FROM public.seller_unlocks WHERE facility_id = $1 AND unlock_type = 'pro_test_credit_20_usd'`,
        [facility.id],
      ),
      queryOne<VendorShell["counts"]>(
        `SELECT
          (SELECT count(*)::int FROM public.products WHERE facility_id = $1) AS products,
          (SELECT count(*)::int FROM public.carts WHERE facility_id = $1 AND status IN ('pending','requested')) AS requests,
          (SELECT count(*)::int FROM public.coupons WHERE facility_id = $1) AS coupons,
          (SELECT count(*)::int FROM public.ad_campaigns WHERE facility_id = $1) AS campaigns`,
        [facility.id],
      ),
    ]);
    const walletBalance = balances.find((row) => row.bucket === "wallet")?.amount ?? 0;
    return {
      facilities,
      companies,
      subscription: { ...subscription, wallet_balance: walletBalance },
      balances,
      unlock,
      counts: counts ?? { products: 0, requests: 0, coupons: 0, campaigns: 0 },
    };
  });

export const getVendorProducts = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    return query<VendorProduct>(
      `SELECT id, facility_id, name, price, discount_percent, in_stock,
              COALESCE(status, CASE WHEN in_stock THEN 'active' ELSE 'sold_out' END) AS status,
              COALESCE(quantity_available, CASE WHEN in_stock THEN 1 ELSE 0 END)::int AS quantity_available,
              COALESCE(omni_allocation_percent, 100)::int AS omni_allocation_percent,
              COALESCE(quantity_allocated_omni, 0)::int AS quantity_allocated_omni,
              photo_url, last_confirmed_at
       FROM public.products WHERE facility_id = $1 ORDER BY created_at DESC`,
      [data.facilityId],
    );
  });

export const getVendorRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    const rows = await query<{
      id: string;
      status: string;
      created_at: string;
      buyer_name: string | null;
      items: { name: string; quantity: number; price_at_time: number }[] | null;
    }>(
      `SELECT ca.id, ca.status, ca.created_at, p.name AS buyer_name,
              COALESCE(json_agg(json_build_object('name', pr.name, 'quantity', ci.quantity,
                                                   'price_at_time', ci.price_at_time))
                       FILTER (WHERE ci.id IS NOT NULL), '[]') AS items
       FROM public.carts ca
       LEFT JOIN public.profiles p ON p.id = ca.buyer_id
       LEFT JOIN public.cart_items ci ON ci.cart_id = ca.id
       LEFT JOIN public.products pr ON pr.id = ci.product_id
       WHERE ca.facility_id = $1
       GROUP BY ca.id, p.name
       ORDER BY ca.created_at DESC LIMIT 50`,
      [data.facilityId],
    );
    return rows.map((row) => {
      const items = row.items ?? [];
      return {
        ...row,
        items,
        total: items.reduce((sum, item) => sum + item.quantity * item.price_at_time, 0),
      } satisfies VendorRequest;
    });
  });

export const getVendorCoupons = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    return query<VendorCoupon>(
      `SELECT c.id, c.code, c.description, c.discount_percent, c.created_at,
              (SELECT count(*) FROM public.redemptions r WHERE r.coupon_id = c.id)::int AS redemption_count
       FROM public.coupons c WHERE c.facility_id = $1 ORDER BY c.created_at DESC`,
      [data.facilityId],
    );
  });

export const getVendorCampaigns = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    return query<VendorCampaign>(
      `SELECT id, facility_id, product_ids, radius_km, is_city_wide, cost_fcfa,
              reach_estimate, campaign_active_until, created_at
       FROM public.ad_campaigns WHERE facility_id = $1 ORDER BY created_at DESC`,
      [data.facilityId],
    );
  });

export const createFacility = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(2).max(120),
        category: z.string().min(2).max(40),
        description: z.string().max(600).optional(),
        address: z.string().max(200).optional(),
        neighbourhood: z.string().max(120).optional(),
        phone: z.string().max(40).optional(),
        type: z.enum(["fixe", "mobile"]),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        claimFacilityId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    let facility: VendorFacility | null;

    if (data.claimFacilityId) {
      // Claiming an imported (unclaimed) listing.
      facility = await queryOne<VendorFacility>(
        `UPDATE public.facilities
         SET owner_id = $1, name = $2, category = $3, description = $4, address = $5,
             neighbourhood = $6, phone = $7, type = $8, latitude = $9, longitude = $10,
             status = 'unconfirmed', claimed_at = now()
         WHERE id = $11 AND owner_id IS NULL AND status = 'unclaimed'
         RETURNING *`,
        [
          context.userId,
          data.name,
          data.category,
          data.description ?? null,
          data.address ?? null,
          data.neighbourhood ?? null,
          data.phone ?? null,
          data.type,
          data.latitude,
          data.longitude,
          data.claimFacilityId,
        ],
      );
      if (!facility) throw new Error("Cette fiche a déjà été réclamée.");
    } else {
      facility = await queryOne<VendorFacility>(
        `INSERT INTO public.facilities
           (owner_id, name, category, description, address, neighbourhood, phone, type,
            latitude, longitude, status, claimed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'unconfirmed', now())
         RETURNING *`,
        [
          context.userId,
          data.name,
          data.category,
          data.description ?? null,
          data.address ?? null,
          data.neighbourhood ?? null,
          data.phone ?? null,
          data.type,
          data.latitude,
          data.longitude,
        ],
      );
    }

    await ensureSubscription(facility!.id);
    await query("UPDATE public.profiles SET onboarding_done = true WHERE id = $1", [
      context.userId,
    ]);
    await writeAudit(context.userId, "facility.create", "facility", facility!.id, {
      claimed: Boolean(data.claimFacilityId),
    });
    return facility!;
  });

export const updateCompany = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        companyId: z.string().uuid(),
        name: z.string().min(2).max(120),
        legalName: z.string().max(160).nullable().optional(),
        countryCode: z.string().max(3).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const updated = await queryOne<{ id: string }>(
      `UPDATE public.companies
       SET name = $1, legal_name = $2, country_code = $3, updated_at = now()
       WHERE id = $4 AND owner_id = $5
       RETURNING id`,
      [
        data.name.trim(),
        data.legalName?.trim() || null,
        data.countryCode?.trim().toUpperCase() || null,
        data.companyId,
        context.userId,
      ],
    );
    if (!updated) throw new Error("Compagnie introuvable ou non autorisée.");
    return { ok: true };
  });

export const updateFacility = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        name: z.string().min(2).max(120).optional(),
        description: z.string().max(600).nullable().optional(),
        address: z.string().max(200).nullable().optional(),
        phone: z.string().max(40).nullable().optional(),
        category: z.string().max(40).optional(),
        isOnline: z.boolean().optional(),
        operatingHours: z.string().max(200).nullable().optional(),
        emergencyShutdown: z.boolean().optional(),
        manualOpen: z.boolean().optional(),
        discoveryMode: z.boolean().optional(),
        discoveryMinutes: z.number().int().min(15).max(720).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);

    const sets: string[] = [];
    const params: unknown[] = [];
    const push = (column: string, value: unknown) => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };
    if (data.name !== undefined) push("name", data.name);
    if (data.description !== undefined) push("description", data.description);
    if (data.address !== undefined) push("address", data.address);
    if (data.phone !== undefined) push("phone", data.phone);
    if (data.category !== undefined) push("category", data.category);
    if (data.isOnline !== undefined) push("is_online", data.isOnline);
    if (data.operatingHours !== undefined) push("operating_hours", data.operatingHours);
    if (data.emergencyShutdown !== undefined) {
      push("emergency_shutdown", data.emergencyShutdown);
      if (data.emergencyShutdown) push("is_online", false);
    }
    if (data.manualOpen !== undefined) push("manual_open", data.manualOpen);
    if (data.discoveryMode !== undefined) {
      push("discovery_mode", data.discoveryMode);
      if (data.discoveryMode) {
        params.push(data.discoveryMinutes ?? 120);
        sets.push(`discovery_until = now() + ($${params.length} || ' minutes')::interval`);
        sets.push("last_position_update = now()");
      } else {
        sets.push("discovery_until = NULL");
      }
    }
    if (data.latitude !== undefined) push("latitude", data.latitude);
    if (data.longitude !== undefined) {
      push("longitude", data.longitude);
      sets.push("last_position_update = now()");
    }
    if (sets.length === 0) return { ok: true };

    params.push(data.facilityId);
    await query(
      `UPDATE public.facilities SET ${sets.join(", ")} WHERE id = $${params.length}`,
      params,
    );
    return { ok: true };
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        productId: z.string().uuid().nullable().optional(),
        name: z.string().min(1).max(120),
        price: z.number().int().min(0).max(100_000_000),
        inStock: z.boolean(),
        status: z.enum(["draft", "active", "paused", "sold_out"]).optional(),
        quantityAvailable: z.number().int().min(0).max(1_000_000).optional(),
        omniAllocationPercent: z.number().int().min(0).max(100).optional(),
        quantityAllocatedOmni: z.number().int().min(0).max(1_000_000).optional(),
        discountPercent: z.number().int().min(0).max(90).optional(),
        photoUrl: z.string().url().max(500).nullable().optional(),
        coupon: z
          .object({
            code: z.string().min(3).max(24),
            description: z.string().max(200).optional(),
            discountPercent: z.number().int().min(1).max(90),
          })
          .nullable()
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);

    if (data.productId) {
      const updated = await queryOne<{ id: string }>(
        `UPDATE public.products
         SET name = $1, price = $2, in_stock = $3, discount_percent = $4,
             photo_url = $5, last_confirmed_at = now(), status = $8,
             quantity_available = $9, omni_allocation_percent = $10,
             quantity_allocated_omni = LEAST($11, $9)
         WHERE id = $6 AND facility_id = $7
         RETURNING id`,
        [
          data.name,
          data.price,
          data.inStock,
          data.discountPercent ?? 0,
          data.photoUrl ?? null,
          data.productId,
          data.facilityId,
          data.status ?? (data.inStock ? "active" : "sold_out"),
          data.quantityAvailable ?? (data.inStock ? 1 : 0),
          data.omniAllocationPercent ?? 100,
          data.quantityAllocatedOmni ?? 0,
        ],
      );
      if (!updated) throw new Error("Produit introuvable.");
      if (data.coupon) {
        await query(
          `INSERT INTO public.coupons (facility_id, product_id, code, description, discount_percent, status)
           VALUES ($1,$2,upper($3),$4,$5,'active')
           ON CONFLICT (facility_id, upper(code)) DO UPDATE
           SET product_id = EXCLUDED.product_id, description = EXCLUDED.description,
               discount_percent = EXCLUDED.discount_percent, status = 'active'`,
          [
            data.facilityId,
            updated.id,
            data.coupon.code.trim(),
            data.coupon.description ?? null,
            data.coupon.discountPercent,
          ],
        );
      }
      return { ok: true, productId: updated.id };
    }

    const subscription = await ensureSubscription(data.facilityId);
    const proActive =
      subscription.tier === "pro" &&
      !!subscription.pro_active_until &&
      new Date(subscription.pro_active_until).getTime() >= Date.now();
    if (!proActive) {
      const count = await queryOne<{ c: number }>(
        "SELECT count(*)::int AS c FROM public.products WHERE facility_id = $1",
        [data.facilityId],
      );
      if ((count?.c ?? 0) >= FREE_PRODUCT_CAP) {
        throw new Error(
          `Limite gratuite atteinte (${FREE_PRODUCT_CAP} produits). Passez en Pro pour en ajouter davantage.`,
        );
      }
    }

    const created = await queryOne<{ id: string }>(
      `INSERT INTO public.products
         (facility_id, name, price, in_stock, discount_percent, photo_url, last_confirmed_at,
          status, quantity_available, omni_allocation_percent, quantity_allocated_omni)
       VALUES ($1,$2,$3,$4,$5,$6, now(), $7, $8, $9, LEAST($10, $8))
       RETURNING id`,
      [
        data.facilityId,
        data.name,
        data.price,
        data.inStock,
        data.discountPercent ?? 0,
        data.photoUrl ?? null,
        data.status ?? (data.inStock ? "active" : "sold_out"),
        data.quantityAvailable ?? (data.inStock ? 1 : 0),
        data.omniAllocationPercent ?? 100,
        data.quantityAllocatedOmni ?? 0,
      ],
    );
    if (data.coupon && created) {
      await query(
        `INSERT INTO public.coupons (facility_id, product_id, code, description, discount_percent, status)
         VALUES ($1,$2,upper($3),$4,$5,'active')
         ON CONFLICT (facility_id, upper(code)) DO UPDATE
         SET product_id = EXCLUDED.product_id, description = EXCLUDED.description,
             discount_percent = EXCLUDED.discount_percent, status = 'active'`,
        [
          data.facilityId,
          created.id,
          data.coupon.code.trim(),
          data.coupon.description ?? null,
          data.coupon.discountPercent,
        ],
      );
    }
    return { ok: true, productId: created?.id ?? null };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z.object({ facilityId: z.string().uuid(), productId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    await query("DELETE FROM public.products WHERE id = $1 AND facility_id = $2", [
      data.productId,
      data.facilityId,
    ]);
    return { ok: true };
  });

export const confirmStock = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    await query("UPDATE public.products SET last_confirmed_at = now() WHERE facility_id = $1", [
      data.facilityId,
    ]);
    return { ok: true };
  });

export const updateMobilePosition = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        active: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    await query(
      `INSERT INTO public.mobile_presence (facility_id, active, latitude, longitude, last_position_update)
       VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (facility_id) DO UPDATE
         SET active = EXCLUDED.active, latitude = EXCLUDED.latitude,
             longitude = EXCLUDED.longitude, last_position_update = now()`,
      [data.facilityId, data.active, data.latitude, data.longitude],
    );
    await query(
      `UPDATE public.facilities
       SET latitude = $1, longitude = $2, is_online = $3, last_position_update = now()
       WHERE id = $4`,
      [data.latitude, data.longitude, data.active, data.facilityId],
    );
    return { ok: true };
  });

/** Server-side reach estimate so the number cannot be forged by the client. */
export const estimateCampaignReach = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        radiusKm: z.number().int().min(1).max(50).nullable(),
        cityWide: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    const facility = await queryOne<{ latitude: number; longitude: number }>(
      "SELECT latitude, longitude FROM public.facilities WHERE id = $1",
      [data.facilityId],
    );
    const signals = await query<{ latitude: number | null; longitude: number | null }>(
      `SELECT latitude, longitude FROM public.wishlists
       WHERE created_at > now() - interval '60 days'`,
    );
    const near = data.cityWide
      ? signals
      : signals.filter(
          (s) =>
            s.latitude !== null &&
            s.longitude !== null &&
            haversineKm(
              { lat: facility!.latitude, lng: facility!.longitude },
              { lat: s.latitude, lng: s.longitude },
            ) <= (data.radiusKm ?? 0),
        );
    const base = data.cityWide ? 4 : Math.max(1, data.radiusKm ?? 1);
    return {
      reach: Math.max(12, Math.round((near.length + 3) * base * 7)),
      cost: campaignCostFor(data.radiusKm, data.cityWide),
    };
  });

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        productIds: z.array(z.string().uuid()).min(1).max(20),
        radiusKm: z.number().int().min(1).max(50).nullable(),
        cityWide: z.boolean(),
        durationDays: z.number().int().min(1).max(30).default(7),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    const subscription = await ensureSubscription(data.facilityId);
    const walletAccountId = await ensureWalletAccount({ facilityId: data.facilityId });
    const walletBalances = await listWalletBalances(walletAccountId);
    const walletBalance = walletBalances.find((row) => row.bucket === "wallet")?.availableAmount ?? 0;
    const cost = campaignCostFor(data.radiusKm, data.cityWide);
    if (cost <= 0) throw new Error("Choisissez un rayon ou la couverture ville entière.");
    if (walletBalance < cost) {
      throw new Error("Solde insuffisant. Rechargez votre portefeuille.");
    }

    const activeUntil = new Date();
    activeUntil.setDate(activeUntil.getDate() + data.durationDays);

    const reach = await queryOne<{ c: number }>(
      "SELECT count(*)::int AS c FROM public.wishlists WHERE created_at > now() - interval '60 days'",
    );
    const reachEstimate = Math.max(
      12,
      Math.round(((reach?.c ?? 0) + 3) * (data.cityWide ? 4 : Math.max(1, data.radiusKm ?? 1)) * 7),
    );

    const campaign = await queryOne<VendorCampaign>(
      `INSERT INTO public.ad_campaigns
         (facility_id, product_ids, radius_km, is_city_wide, cost_fcfa, reach_estimate, campaign_active_until)
       VALUES ($1,$2::uuid[],$3,$4,$5,$6,$7) RETURNING *`,
      [
        data.facilityId,
        data.productIds,
        data.radiusKm,
        data.cityWide,
        cost,
        reachEstimate,
        activeUntil.toISOString(),
      ],
    );

    let ledgerEntryId: string;
    try {
      ledgerEntryId = await consumeWalletBucket({
        accountId: walletAccountId,
        bucket: "wallet",
        amount: cost,
        referenceType: "ad_campaign",
        referenceId: campaign!.id,
        idempotencyKey: `ad-campaign:${campaign!.id}`,
        actorUserId: context.userId,
        source: "seller_ad_campaign",
        metadata: { facility_id: data.facilityId, duration_days: data.durationDays },
      });
    } catch (error) {
      await query(
        "UPDATE public.ad_campaigns SET campaign_active_until = now() WHERE id = $1",
        [campaign!.id],
      );
      throw error;
    }

    const qualifies = cost >= QUALIFYING_AMOUNT;
    if (qualifies) {
      await query(
        `UPDATE public.subscriptions
         SET tier = 'pro', pro_active_until = $1::date, last_qualifying_action_month = $2
         WHERE facility_id = $3`,
        [extendedProUntil(subscription.pro_active_until), currentMonthKey(), data.facilityId],
      );
    }

    await writeAudit(context.userId, "campaign.create", "ad_campaign", campaign!.id, {
      cost,
      ledgerEntryId,
    });
    return campaign!;
  });

export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        code: z.string().min(3).max(24),
        description: z.string().max(200).optional(),
        discountPercent: z.number().int().min(1).max(90),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    await query(
      `INSERT INTO public.coupons (facility_id, code, description, discount_percent)
       VALUES ($1, upper($2), $3, $4)
       ON CONFLICT (facility_id, upper(code)) DO UPDATE
         SET description = EXCLUDED.description, discount_percent = EXCLUDED.discount_percent`,
      [data.facilityId, data.code.trim(), data.description ?? null, data.discountPercent],
    );
    return { ok: true };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z.object({ facilityId: z.string().uuid(), couponId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    await query("DELETE FROM public.coupons WHERE id = $1 AND facility_id = $2", [
      data.couponId,
      data.facilityId,
    ]);
    return { ok: true };
  });

export const respondToRequest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        cartId: z.string().uuid(),
        accept: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.facilityId);
    const cart = await queryOne<{ buyer_id: string }>(
      `UPDATE public.carts SET status = $1, responded_at = now()
       WHERE id = $2 AND facility_id = $3 RETURNING buyer_id`,
      [data.accept ? "confirmed" : "declined", data.cartId, data.facilityId],
    );
    if (cart?.buyer_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1, $2, $3, $4)`,
        [
          cart.buyer_id,
          data.accept ? "Demande acceptée" : "Demande refusée",
          data.accept
            ? "Le commerçant a accepté votre demande. Vous pouvez passer récupérer votre commande."
            : "Le commerçant ne peut pas honorer votre demande pour le moment.",
          "/carte",
        ],
      );
    }
    return { ok: true };
  });

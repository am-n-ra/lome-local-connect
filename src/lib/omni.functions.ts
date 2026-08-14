import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { optionalAuth, requireAuth } from "./auth-middleware";
import { query, queryOne } from "./db.server";
import { enforceRateLimit } from "./rate-limit.server";

export type MapFacility = {
  id: string;
  name: string;
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
  owner_id: string | null;
  product_count: number;
  min_price: number | null;
  max_discount_percent: number;

  sponsored: boolean;
  tier: string;
  cover_url: string | null;
};
export type FacilityMediaRow = {
  id: string;
  kind: "image" | "video";
  url: string;
  thumb_url: string | null;
  position: number;
  duration_s: number | null;
};

export type ProductRow = {
  id: string;
  facility_id: string;
  name: string;
  price: number;
  discount_percent: number;
  in_stock: boolean;
  status: string;
  quantity_available: number;
  omni_allocation_percent: number;
  photo_url: string | null;
  last_confirmed_at: string | null;
};

export type OfferRow = {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  active_until: string | null;
};

export type PublicCouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
};

export type ProfileRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  market_code: string;
  wallet_balance: number;
  onboarding_done: boolean;
};

export type OwnedFacility = {
  id: string;
  name: string;
  status: string;
  type: string;
};

export type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const FACILITY_SELECT = `
  SELECT f.id, f.name, f.category, f.description, f.address, f.neighbourhood,
         f.latitude, f.longitude, f.phone, f.status, f.type, f.is_online,
         f.last_position_update, f.owner_id,
         m.url AS cover_url,
         COALESCE(p.cnt, 0)::int AS product_count,

         p.min_price::int        AS min_price,
         COALESCE(p.max_discount, 0)::int AS max_discount_percent,

         COALESCE(s.tier, 'free') AS tier,
         EXISTS (
           SELECT 1 FROM public.ad_campaigns c
           WHERE c.facility_id = f.id
             AND c.campaign_active_until IS NOT NULL
             AND c.campaign_active_until > now()
         ) AS sponsored
  FROM public.facilities f
  LEFT JOIN LATERAL (
    SELECT COALESCE(fm.thumb_url, fm.url) AS url
    FROM public.facility_media fm
    WHERE fm.facility_id = f.id AND fm.kind = 'image'
    ORDER BY fm.position ASC, fm.created_at ASC
    LIMIT 1
  ) m ON true

  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt, min(price) AS min_price, max(discount_percent) AS max_discount
    FROM public.products pr WHERE pr.facility_id = f.id AND pr.in_stock
      AND COALESCE(pr.status, 'active') = 'active'
      AND COALESCE(pr.quantity_available, 1) > 0
      AND COALESCE(pr.omni_allocation_percent, 100) > 0
  ) p ON true
  LEFT JOIN public.subscriptions s ON s.facility_id = f.id
`;

/** Everything the buyer map needs, optionally filtered by search or category. */
export const listFacilities = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        search: z.string().max(120).optional(),
        category: z.string().max(40).optional(),
        includeUnclaimed: z.boolean().optional(),
        market_code: z.string().max(20).default("TG-LOME"),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const clauses: string[] = [
      "f.market_code = $1",
      "(f.is_online = true OR f.status = 'unclaimed')",
      "COALESCE(f.emergency_shutdown, false) = false",
    ];
    const params: unknown[] = [data.market_code];

    if (data.category && data.category !== "all") {
      params.push(data.category);
      clauses.push(`f.category = $${params.length}`);
    }
    if (data.search && data.search.trim()) {
      params.push(`%${data.search.trim()}%`);
      const i = params.length;
      clauses.push(`(
        f.name ILIKE $${i} OR f.description ILIKE $${i} OR f.neighbourhood ILIKE $${i}
        OR EXISTS (SELECT 1 FROM public.products pr WHERE pr.facility_id = f.id AND pr.in_stock AND COALESCE(pr.status, 'active') = 'active' AND COALESCE(pr.quantity_available, 1) > 0 AND COALESCE(pr.omni_allocation_percent, 100) > 0 AND pr.name ILIKE $${i})
      )`);
    }
    if (data.includeUnclaimed === false) {
      clauses.push("f.status <> 'unclaimed'");
    }

    return query<MapFacility>(
      `${FACILITY_SELECT} WHERE ${clauses.join(" AND ")} ORDER BY sponsored DESC, f.name ASC LIMIT 800`,
      params,
    );
  });

export const getFacility = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const facility = await queryOne<MapFacility>(`${FACILITY_SELECT} WHERE f.id = $1`, [data.id]);
    if (!facility) return null;

    const [productsResult, offersResult, couponsResult, mediaResult] = await Promise.allSettled([
      query<ProductRow>(
        `SELECT id, facility_id, name, price, discount_percent, in_stock,
                COALESCE(status, CASE WHEN in_stock THEN 'active' ELSE 'sold_out' END) AS status,
                COALESCE(quantity_available, CASE WHEN in_stock THEN 1 ELSE 0 END)::int AS quantity_available,
                COALESCE(omni_allocation_percent, 100)::int AS omni_allocation_percent,
                photo_url, last_confirmed_at
         FROM public.products WHERE facility_id = $1 ORDER BY in_stock DESC, name ASC`,
        [data.id],
      ),
      query<OfferRow>(
        `SELECT id, title, description, discount_percent, active_until
         FROM public.offers
         WHERE facility_id = $1 AND (active_until IS NULL OR active_until > now())`,
        [data.id],
      ),
      query<PublicCouponRow>(
        `SELECT id, code, description, discount_percent FROM public.coupons WHERE facility_id = $1`,
        [data.id],
      ),
      query<FacilityMediaRow>(
        `SELECT id, kind, url, thumb_url, position, duration_s
         FROM public.facility_media WHERE facility_id = $1
         ORDER BY position ASC, created_at ASC`,
        [data.id],
      ),
    ]);

    return {
      facility,
      products: productsResult.status === "fulfilled" ? productsResult.value : [],
      offers: offersResult.status === "fulfilled" ? offersResult.value : [],
      coupons: couponsResult.status === "fulfilled" ? couponsResult.value : [],
      media: mediaResult.status === "fulfilled" ? mediaResult.value : [],
    };
  });

/** Buyer demand signal: "Je cherche ce produit". */
export const recordWishlist = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        searchTerm: z.string().min(2).max(120),
        latitude: z.number().min(-90).max(90).nullable().optional(),
        longitude: z.number().min(-180).max(180).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit({
      bucket: "wishlist",
      subject: context.userId,
      limit: 20,
      windowSeconds: 300,
      message: "Trop de recherches enregistrées. Réessayez dans quelques minutes.",
    });
    await query(
      `INSERT INTO public.wishlists (user_id, search_term, latitude, longitude)
       VALUES ($1, $2, $3, $4)`,
      [context.userId, data.searchTerm.trim(), data.latitude ?? null, data.longitude ?? null],
    );
    return { ok: true };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM public.favorites WHERE user_id = $1 AND facility_id = $2",
      [context.userId, data.facilityId],
    );
    if (existing) {
      await query("DELETE FROM public.favorites WHERE id = $1", [existing.id]);
      return { favorite: false };
    }
    await query("INSERT INTO public.favorites (user_id, facility_id) VALUES ($1, $2)", [
      context.userId,
      data.facilityId,
    ]);
    return { favorite: true };
  });

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([optionalAuth])
  .handler(async ({ context }) => {
    if (!context.userId) return [] as { facility_id: string }[];
    return query<{ facility_id: string }>(
      "SELECT facility_id FROM public.favorites WHERE user_id = $1",
      [context.userId],
    );
  });

/** One-tap availability check before sending a cart request. */
export const checkAvailability = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ productIds: z.array(z.string().uuid()).min(1).max(40) }).parse(input),
  )
  .handler(async ({ data }) =>
    query<{
      id: string;
      in_stock: boolean;
      price: number;
      last_confirmed_at: string | null;
      facility_online: boolean;
    }>(
      `SELECT p.id, p.in_stock, p.price, p.last_confirmed_at, f.is_online AS facility_online
       FROM public.products p
       JOIN public.facilities f ON f.id = p.facility_id
       WHERE p.id = ANY($1::uuid[])`,
      [data.productIds],
    ),
  );

/** Sends the buyer's basket to the vendor as a request. */

export const submitCart = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        items: z
          .array(
            z.object({
              productId: z.string().uuid(),
              quantity: z.number().int().min(1).max(99),
            }),
          )
          .min(1)
          .max(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit({
      bucket: "cart",
      subject: context.userId,
      limit: 10,
      windowSeconds: 600,
      message: "Trop de demandes envoyées. Réessayez dans quelques minutes.",
    });
    const ids = data.items.map((i) => i.productId);
    const products = await query<{ id: string; price: number; facility_id: string }>(
      "SELECT id, price, facility_id FROM public.products WHERE id = ANY($1::uuid[])",
      [ids],
    );
    const valid = products.filter((p) => p.facility_id === data.facilityId);
    if (valid.length !== data.items.length) {
      throw new Error("Panier invalide : certains produits ne sont pas de ce commerce.");
    }

    const cart = await queryOne<{ id: string }>(
      `INSERT INTO public.carts (buyer_id, facility_id, status, submitted_at, expires_at)
       VALUES ($1, $2, 'pending', now(), now() + interval '2 hours') RETURNING id`,
      [context.userId, data.facilityId],
    );

    for (const item of data.items) {
      const price = valid.find((p) => p.id === item.productId)!.price;
      await query(
        `INSERT INTO public.cart_items (cart_id, product_id, quantity, price_at_time)
         VALUES ($1, $2, $3, $4)`,
        [cart!.id, item.productId, item.quantity, price],
      );
    }

    const owner = await queryOne<{ owner_id: string | null; name: string }>(
      "SELECT owner_id, name FROM public.facilities WHERE id = $1",
      [data.facilityId],
    );
    if (owner?.owner_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1, $2, $3, $4)`,
        [
          owner.owner_id,
          "Nouvelle demande client",
          "Un acheteur vient d'envoyer une demande de panier.",
          "/vendeur",
        ],
      );
    }

    return { cartId: cart!.id };
  });

/** Fan-out: one action sends the whole basket to up to 5 sellers at once. */
export const submitCarts = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        groups: z
          .array(
            z.object({
              facilityId: z.string().uuid(),
              items: z
                .array(
                  z.object({
                    productId: z.string().uuid(),
                    quantity: z.number().int().min(1).max(99),
                  }),
                )
                .min(1)
                .max(50),
            }),
          )
          .min(1)
          .max(5),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit({
      bucket: "cart",
      subject: context.userId,
      limit: 10,
      windowSeconds: 600,
      message: "Trop de demandes envoyées. Réessayez dans quelques minutes.",
    });

    const sent: string[] = [];
    const failed: { facilityId: string; error: string }[] = [];

    for (const group of data.groups) {
      try {
        const ids = group.items.map((i) => i.productId);
        const products = await query<{ id: string; price: number; facility_id: string }>(
          "SELECT id, price, facility_id FROM public.products WHERE id = ANY($1::uuid[])",
          [ids],
        );
        const valid = products.filter((p) => p.facility_id === group.facilityId);
        if (valid.length !== group.items.length) {
          throw new Error("Certains produits ne sont pas de ce commerce.");
        }

        const cart = await queryOne<{ id: string }>(
          `INSERT INTO public.carts (buyer_id, facility_id, status, submitted_at, expires_at)
           VALUES ($1, $2, 'pending', now(), now() + interval '2 hours') RETURNING id`,
          [context.userId, group.facilityId],
        );
        for (const item of group.items) {
          const price = valid.find((p) => p.id === item.productId)!.price;
          await query(
            `INSERT INTO public.cart_items (cart_id, product_id, quantity, price_at_time)
             VALUES ($1, $2, $3, $4)`,
            [cart!.id, item.productId, item.quantity, price],
          );
        }

        const owner = await queryOne<{ owner_id: string | null }>(
          "SELECT owner_id FROM public.facilities WHERE id = $1",
          [group.facilityId],
        );
        if (owner?.owner_id) {
          await query(
            `INSERT INTO public.notifications (user_id, title, body, link)
             VALUES ($1, $2, $3, $4)`,
            [
              owner.owner_id,
              "Nouvelle demande client",
              "Un acheteur vient d'envoyer une demande de panier (expire dans 2 h).",
              "/vendeur",
            ],
          );
        }
        sent.push(group.facilityId);
      } catch (error) {
        failed.push({
          facilityId: group.facilityId,
          error: error instanceof Error ? error.message : "Envoi impossible.",
        });
      }
    }

    return { sent, failed };
  });

/** Profile + owned facilities, used by the nav and the role switcher. */
export const getMe = createServerFn({ method: "GET" })
  .middleware([optionalAuth])
  .handler(async ({ context }) => {
    if (!context.userId) return null;
    const profile = await queryOne<ProfileRow>(
      `SELECT id, name, email, phone, market_code, wallet_balance, onboarding_done
       FROM public.profiles WHERE id = $1`,
      [context.userId],
    );
    const facilities = await query<OwnedFacility>(
      "SELECT id, name, status, type FROM public.facilities WHERE owner_id = $1 ORDER BY created_at",
      [context.userId],
    );
    const roles = await query<{ role: string }>(
      "SELECT role FROM public.user_roles WHERE user_id = $1",
      [context.userId],
    );
    return { profile, facilities, roles: roles.map((r) => r.role) };
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    query<NotificationRow>(
      `SELECT id, title, body, link, read_at, created_at
       FROM public.notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 30`,
      [context.userId],
    ),
  );

export type WishlistEntry = { id: string; search_term: string; created_at: string };

export const listWishlists = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    query<WishlistEntry>(
      `SELECT id, search_term, created_at FROM public.wishlists
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [context.userId],
    ),
  );

export const deleteWishlist = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await query("DELETE FROM public.wishlists WHERE id = $1 AND user_id = $2", [
      data.id,
      context.userId,
    ]);
    return { ok: true };
  });

/** "Est-ce votre commerce ?" — claims an unclaimed OSM listing. */
export const claimFacility = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        phone: z.string().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit({
      bucket: "claim",
      subject: context.userId,
      limit: 5,
      windowSeconds: 3600,
      message: "Trop de demandes de revendication. Réessayez plus tard.",
    });
    const facility = await queryOne<{ id: string; status: string; owner_id: string | null }>(
      "SELECT id, status, owner_id FROM public.facilities WHERE id = $1",
      [data.facilityId],
    );
    if (!facility) throw new Error("Commerce introuvable.");
    if (facility.owner_id) throw new Error("Ce commerce a déjà un propriétaire.");
    if (facility.status !== "unclaimed") throw new Error("Ce commerce n'est pas réclamable.");

    await query(
      `UPDATE public.facilities
       SET owner_id = $2, status = 'unconfirmed', claimed_at = now(),
           phone = COALESCE($3, phone)
       WHERE id = $1 AND owner_id IS NULL`,
      [data.facilityId, context.userId, data.phone?.trim() || null],
    );
    await query(
      `INSERT INTO public.subscriptions (facility_id) VALUES ($1)
       ON CONFLICT (facility_id) DO NOTHING`,
      [data.facilityId],
    );
    return { ok: true };
  });

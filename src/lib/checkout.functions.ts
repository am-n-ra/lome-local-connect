import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware";
import { query, queryOne } from "./db.server";
import { enforceRateLimit } from "./rate-limit.server";

export type BuyerOrder = {
  id: string;
  facility_id: string;
  facility_name: string;
  status: string;
  created_at: string;
  total: number;
  items: { name: string; quantity: number; price_at_time: number }[];
  qr_token: string | null;
  qr_expires_at: string | null;
  transaction_status: string | null;
  amount: number | null;
  platform_fee: number | null;
};

export type VendorTransaction = {
  id: string;
  amount: number;
  platform_fee: number;
  payout_amount: number;
  status: string;
  payment_mode: string;
  qr_authorised_at: string | null;
  completed_at: string | null;
  created_at: string;
  buyer_name: string | null;
};

const CODE_ALPHABET = "ACDEFGHJKLMNPQRSTUVWXYZ2345679";

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

async function feePercentFor(facilityId: string): Promise<number> {
  const row = await queryOne<{ pct: string | number }>(
    `SELECT m.default_platform_fee_percent AS pct
     FROM public.facilities f
     JOIN public.markets m ON m.market_code = f.market_code
     WHERE f.id = $1`,
    [facilityId],
  );
  const pct = Number(row?.pct ?? 2);
  return Number.isFinite(pct) ? pct : 2;
}

/** Buyer orders (carts) with their live QR checkout, if any. */
export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const carts = await query<BuyerOrder>(
      `SELECT c.id, c.facility_id, f.name AS facility_name, c.status, c.created_at,
              COALESCE(SUM(ci.price_at_time * ci.quantity), 0)::int AS total,
              t.qr_token, t.qr_expires_at,
              t.status AS transaction_status,
              t.amount, t.platform_fee
       FROM public.carts c
       JOIN public.facilities f ON f.id = c.facility_id
       LEFT JOIN public.cart_items ci ON ci.cart_id = c.id
       LEFT JOIN LATERAL (
         SELECT qr_token, qr_expires_at, status, amount, platform_fee
         FROM public.transactions tr
         WHERE tr.cart_id = c.id ORDER BY tr.created_at DESC LIMIT 1
       ) t ON true
       WHERE c.buyer_id = $1
       GROUP BY c.id, f.name, t.qr_token, t.qr_expires_at, t.status, t.amount, t.platform_fee
       ORDER BY c.created_at DESC
       LIMIT 30`,
      [context.userId],
    );
    if (carts.length === 0) return [];

    const items = await query<{
      cart_id: string;
      name: string;
      quantity: number;
      price_at_time: number;
    }>(
      `SELECT ci.cart_id, p.name, ci.quantity, ci.price_at_time
       FROM public.cart_items ci
       JOIN public.products p ON p.id = ci.product_id
       WHERE ci.cart_id = ANY($1::uuid[])`,
      [carts.map((c) => c.id)],
    );
    return carts.map((c) => ({
      ...c,
      items: items.filter((i) => i.cart_id === c.id),
    }));
  });

/**
 * Buyer generates the pickup QR for an accepted request.
 * Payment itself stays offline (cash at pickup) — "Mode démo" for card flows.
 */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z.object({ cartId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit({
      bucket: "checkout",
      subject: context.userId,
      limit: 20,
      windowSeconds: 600,
      message: "Trop de codes générés. Réessayez dans quelques minutes.",
    });

    const cart = await queryOne<{ id: string; facility_id: string; status: string }>(
      "SELECT id, facility_id, status FROM public.carts WHERE id = $1 AND buyer_id = $2",
      [data.cartId, context.userId],
    );
    if (!cart) throw new Error("Demande introuvable.");
    if (cart.status !== "confirmed" && cart.status !== "partially_confirmed") {
      throw new Error("Le commerçant doit d'abord accepter votre demande.");
    }

    const existing = await queryOne<{ id: string; qr_token: string; qr_expires_at: string }>(
      `SELECT id, qr_token, qr_expires_at FROM public.transactions
       WHERE cart_id = $1 AND status = 'pending' AND qr_expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [cart.id],
    );
    if (existing) {
      return { code: existing.qr_token, expiresAt: existing.qr_expires_at };
    }

    const totalRow = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(price_at_time * quantity), 0)::int AS total
       FROM public.cart_items WHERE cart_id = $1`,
      [cart.id],
    );
    const amount = totalRow?.total ?? 0;
    const feePercent = await feePercentFor(cart.facility_id);
    const platformFee = Math.round((amount * feePercent) / 100);

    const code = newCode();
    const txn = await queryOne<{ qr_token: string; qr_expires_at: string }>(
      `INSERT INTO public.transactions
         (facility_id, buyer_id, cart_id, kind, amount, platform_fee, payout_amount,
          fee_percent, payment_mode, status, qr_token, qr_expires_at)
       VALUES ($1,$2,$3,'in_app',$4,$5,$6,$7,'cash','pending',$8, now() + interval '2 hours')
       RETURNING qr_token, qr_expires_at`,
      [
        cart.facility_id,
        context.userId,
        cart.id,
        amount,
        platformFee,
        amount - platformFee,
        feePercent,
        code,
      ],
    );
    return { code: txn!.qr_token, expiresAt: txn!.qr_expires_at };
  });

/** Vendor scans or types the buyer code to close the sale. */
export const redeemCheckout = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        facilityId: z.string().uuid(),
        code: z.string().min(4).max(24),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const owns = await queryOne<{ id: string }>(
      "SELECT id FROM public.facilities WHERE id = $1 AND owner_id = $2",
      [data.facilityId, context.userId],
    );
    if (!owns) throw new Error("Commerce introuvable ou non autorisé.");

    await enforceRateLimit({
      bucket: "redeem",
      subject: context.userId,
      limit: 40,
      windowSeconds: 600,
      message: "Trop de tentatives. Réessayez dans quelques minutes.",
    });

    const code = data.code.trim().toUpperCase();
    const txn = await queryOne<{
      id: string;
      buyer_id: string | null;
      cart_id: string | null;
      amount: number;
      platform_fee: number;
      payout_amount: number;
      status: string;
      qr_expires_at: string | null;
    }>(
      `SELECT id, buyer_id, cart_id, amount, platform_fee, payout_amount, status, qr_expires_at
       FROM public.transactions WHERE qr_token = $1 AND facility_id = $2`,
      [code, data.facilityId],
    );
    if (!txn) throw new Error("Code inconnu pour ce commerce.");
    if (txn.status === "completed") throw new Error("Ce code a déjà été utilisé.");
    if (txn.qr_expires_at && new Date(txn.qr_expires_at).getTime() < Date.now()) {
      throw new Error("Ce code a expiré. Demandez au client d'en générer un nouveau.");
    }

    await query(
      `UPDATE public.transactions
       SET status = 'completed', qr_authorised_at = now(), completed_at = now()
       WHERE id = $1`,
      [txn.id],
    );
    await query(
      `INSERT INTO public.subscriptions (facility_id, payout_balance)
       VALUES ($1, $2)
       ON CONFLICT (facility_id) DO UPDATE
         SET payout_balance = public.subscriptions.payout_balance + EXCLUDED.payout_balance`,
      [data.facilityId, txn.payout_amount],
    );
    if (txn.cart_id) {
      await query("UPDATE public.carts SET status = 'completed' WHERE id = $1", [txn.cart_id]);
    }
    if (txn.buyer_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1, $2, $3, $4)`,
        [
          txn.buyer_id,
          "Achat confirmé",
          "Votre retrait a été validé par le commerçant. Merci !",
          "/carte",
        ],
      );
    }
    await query(
      `INSERT INTO public.notifications (user_id, title, body, link)
       VALUES ($1, $2, $3, $4)`,
      [
        context.userId,
        "Vente encaissée",
        `Transaction validée. Commission plateforme : ${txn.platform_fee} FCFA.`,
        "/vendeur",
      ],
    );

    const facility = await queryOne<{ status: string }>(
      "SELECT status FROM public.facilities WHERE id = $1",
      [data.facilityId],
    );
    return {
      amount: txn.amount,
      platformFee: txn.platform_fee,
      payout: txn.payout_amount,
      facilityStatus: facility?.status ?? null,
    };
  });

export const listVendorTransactions = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z.object({ facilityId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const owns = await queryOne<{ id: string }>(
      "SELECT id FROM public.facilities WHERE id = $1 AND owner_id = $2",
      [data.facilityId, context.userId],
    );
    if (!owns) throw new Error("Commerce introuvable ou non autorisé.");
    return query<VendorTransaction>(
      `SELECT t.id, t.amount, t.platform_fee, t.payout_amount, t.status, t.payment_mode,
              t.qr_authorised_at, t.completed_at, t.created_at, p.name AS buyer_name
       FROM public.transactions t
       LEFT JOIN public.profiles p ON p.id = t.buyer_id
       WHERE t.facility_id = $1
       ORDER BY t.created_at DESC LIMIT 50`,
      [data.facilityId],
    );
  });

/** Distinct QR-authorised buyers — drives the "confirmed" trust level. */
export const getConfirmationProgress = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z.object({ facilityId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const row = await queryOne<{ buyers: number; status: string }>(
      `SELECT (
         SELECT count(DISTINCT buyer_id)::int FROM public.transactions
         WHERE facility_id = f.id AND status = 'completed'
           AND qr_authorised_at IS NOT NULL AND buyer_id IS NOT NULL
       ) AS buyers, f.status
       FROM public.facilities f WHERE f.id = $1 AND f.owner_id = $2`,
      [data.facilityId, context.userId],
    );
    return { buyers: row?.buyers ?? 0, required: 3, status: row?.status ?? null };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await query(
      "UPDATE public.notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL",
      [context.userId],
    );
    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware.server";
import { query, queryOne } from "./db.server";
import { newTransactionCode } from "./qr";
import { appendWalletEntry, ensureWalletAccount } from "./wallet.server";
import { enforceRateLimit } from "./rate-limit.server";

export type BuyerOrder = {
  id: string;
  source: "cart" | "intent";
  facility_id: string;
  facility_name: string;
  status: string;
  created_at: string;
  total: number;
  items: { name: string; quantity: number; price_at_time: number }[];
  qr_token: string | null;
  qr_expires_at: string | null;
  transaction_id: string | null;
  transaction_status: string | null;
  intent_created_at: string | null;
  payment_mode: string | null;
  amount: number | null;
  platform_fee: number | null;
};

export type TransactionEvent = {
  id: string;
  transaction_id: string;
  event_type: string;
  actor_id: string | null;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
};

export type TransactionTimeline = {
  transaction: {
    id: string;
    facility_id: string;
    facility_name: string;
    buyer_id: string | null;
    status: string;
    amount: number;
    payment_mode: string;
    payment_preference: string | null;
    buyer_payment_declared_at: string | null;
    seller_payment_confirmed_at: string | null;
    fulfillment_started_at: string | null;
    seller_contact: string | null;
    qr_token: string | null;
    qr_expires_at: string | null;
    intent_created_at: string | null;
    paid_at: string | null;
    completed_at: string | null;
    viewer_role: "buyer" | "seller";
  };
  events: TransactionEvent[];
};

export type VendorTransaction = {
  id: string;
  amount: number;
  platform_fee: number;
  payout_amount: number;
  status: string;
  payment_mode: string;
  payment_preference: string | null;
  buyer_payment_declared_at: string | null;
  qr_authorised_at: string | null;
  seller_payment_confirmed_at: string | null;
  completed_at: string | null;
  created_at: string;
  buyer_name: string | null;
};

async function recordTransactionEvent(
  transactionId: string,
  eventType: string,
  actorId: string | null,
  metadata: Record<string, string | number | boolean | null> = {},
) {
  await query(
    `INSERT INTO public.transaction_events (transaction_id, event_type, actor_id, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [transactionId, eventType, actorId, JSON.stringify(metadata)],
  );
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

async function formatMoneyServer(facilityId: string, amount: number): Promise<string> {
  const row = await queryOne<{ currency_symbol: string; currency_decimals: number | null }>(
    `SELECT m.currency_symbol, m.currency_decimals
     FROM public.facilities f
     JOIN public.markets m ON m.market_code = f.market_code
     WHERE f.id = $1`,
    [facilityId],
  );
  const symbol = row?.currency_symbol ?? "FCFA";
  const decimals = row?.currency_decimals ?? 0;
  const formatted = new Intl.NumberFormat("fr", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.round(amount));
  return `${formatted} ${symbol}`;
}

/** Buyer orders (carts) with their live QR checkout, if any. */
export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const carts = await query<BuyerOrder>(
      `SELECT c.id, 'cart' AS source, c.facility_id, f.name AS facility_name, c.status, c.created_at,
              COALESCE(SUM(ci.price_at_time * ci.quantity), 0)::int AS total,
              t.id AS transaction_id, t.qr_token, t.qr_expires_at,
              t.status AS transaction_status, t.intent_created_at, t.payment_mode,
              t.amount, t.platform_fee
       FROM public.carts c
       JOIN public.facilities f ON f.id = c.facility_id
       LEFT JOIN public.cart_items ci ON ci.cart_id = c.id
       LEFT JOIN LATERAL (
         SELECT id, qr_token, qr_expires_at, status, intent_created_at, payment_mode, amount, platform_fee
         FROM public.transactions tr
         WHERE tr.cart_id = c.id ORDER BY tr.created_at DESC LIMIT 1
       ) t ON true
       WHERE c.buyer_id = $1
       GROUP BY c.id, f.name, t.id, t.qr_token, t.qr_expires_at, t.status, t.intent_created_at, t.payment_mode, t.amount, t.platform_fee
       ORDER BY c.created_at DESC
       LIMIT 30`,
      [context.userId],
    );
    const directRows = await query<{
      id: string;
      facility_id: string;
      facility_name: string;
      created_at: string;
      transaction_id: string;
      transaction_status: string;
      intent_created_at: string | null;
      payment_mode: string | null;
      qr_token: string | null;
      qr_expires_at: string | null;
      amount: number;
      search_term: string | null;
      quantity: number;
    }>(
      `SELECT t.id, t.facility_id, f.name AS facility_name, t.created_at,
              t.id AS transaction_id, t.status AS transaction_status, t.intent_created_at,
              t.payment_mode, t.qr_token, t.qr_expires_at, t.amount,
              t.intent_metadata->>'search_term' AS search_term,
              COALESCE((t.intent_metadata->>'quantity')::int, 1) AS quantity
       FROM public.transactions t
       JOIN public.facilities f ON f.id = t.facility_id
       WHERE t.buyer_id = $1 AND t.cart_id IS NULL AND t.intent_created_at IS NOT NULL
       ORDER BY t.created_at DESC LIMIT 30`,
      [context.userId],
    );
    const directOrders: BuyerOrder[] = directRows.map((row) => ({
      id: row.id,
      source: "intent",
      facility_id: row.facility_id,
      facility_name: row.facility_name,
      status: row.transaction_status,
      created_at: row.created_at,
      total: row.amount,
      items: [
        {
          name: row.search_term ?? "Intention d'achat",
          quantity: row.quantity,
          price_at_time: row.amount,
        },
      ],
      transaction_id: row.transaction_id,
      transaction_status: row.transaction_status,
      intent_created_at: row.intent_created_at,
      payment_mode: row.payment_mode,
      qr_token: row.qr_token,
      qr_expires_at: row.qr_expires_at,
      amount: row.amount,
      platform_fee: null,
    }));
    if (carts.length === 0) return directOrders;

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
    return [
      ...carts.map((c) => ({
        ...c,
        items: items.filter((i) => i.cart_id === c.id),
      })),
      ...directOrders,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

export const createPurchaseIntent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        cartId: z.string().uuid().optional(),
        demandResponseId: z.string().uuid().optional(),
        productId: z.string().uuid().optional(),
        facilityId: z.string().uuid().optional(),
        quantity: z.number().int().min(1).max(999).default(1),
        amount: z.number().int().min(0).max(100_000_000).optional(),
        offerId: z.string().uuid().optional(),
        couponCode: z.string().max(80).optional(),
        paymentMode: z.enum(["cash", "delivery"]).default("cash"),
      })
      .refine((value) => Boolean(value.cartId || value.demandResponseId || value.productId), {
        message: "Sélectionnez une réponse disponible ou un panier accepté.",
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    let facilityId = data.facilityId ?? null;
    let cartId = data.cartId ?? null;
    let amount = data.amount ?? 0;
    const metadata: Record<string, string | number | boolean | null> = {
      quantity: data.quantity,
      offer_id: data.offerId ?? null,
      coupon_code: data.couponCode ?? null,
      payment_mode: data.paymentMode,
    };

    if (data.cartId) {
      const cart = await queryOne<{ id: string; facility_id: string; status: string }>(
        `SELECT id, facility_id, status FROM public.carts WHERE id = $1 AND buyer_id = $2`,
        [data.cartId, context.userId],
      );
      if (!cart) throw new Error("Panier introuvable.");
      if (cart.status !== "confirmed" && cart.status !== "partially_confirmed") {
        throw new Error("Le vendeur doit d'abord accepter ce panier.");
      }
      facilityId = cart.facility_id;
      cartId = cart.id;
      const total = await queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(price_at_time * quantity), 0)::int AS total
         FROM public.cart_items WHERE cart_id = $1`,
        [cart.id],
      );
      amount = data.amount ?? total?.total ?? 0;
      metadata["cart_id"] = cart.id;
    }

    if (data.productId) {
      const product = await queryOne<{
        id: string;
        facility_id: string;
        facility_status: string;
        name: string;
        price: number;
        in_stock: boolean;
      }>(
        `SELECT p.id, p.facility_id, f.status AS facility_status, p.name, p.price, p.in_stock
         FROM public.products p JOIN public.facilities f ON f.id = p.facility_id WHERE p.id = $1`,
        [data.productId],
      );
      if (!product || (data.facilityId && data.facilityId !== product.facility_id)) {
        throw new Error("Produit introuvable pour ce commerce.");
      }
      if (product.facility_status === "unclaimed")
        throw new Error("Ce commerce doit être réclamé avant un achat.");
      if (!product.in_stock) throw new Error("Ce produit n'est plus disponible.");
      facilityId = product.facility_id;
      amount = data.amount ?? product.price * data.quantity;
      metadata["product_id"] = product.id;
      metadata["product_name"] = product.name;
    }

    if (data.demandResponseId) {
      const response = await queryOne<{
        facility_id: string;
        buyer_id: string;
        available: boolean;
        kind: string;
        price: number | null;
        quantity: number | null;
        search_term: string;
      }>(
        `SELECT r.facility_id, d.buyer_id, r.available, r.kind, r.price, r.quantity, d.search_term
         FROM public.demand_responses r
         JOIN public.demand_requests d ON d.id = r.request_id
         WHERE r.id = $1 AND d.buyer_id = $2`,
        [data.demandResponseId, context.userId],
      );
      if (!response) throw new Error("Réponse de disponibilité introuvable.");
      if (!response.available && response.kind !== "partial") {
        throw new Error("Cette réponse ne permet pas de créer une intention d'achat.");
      }
      facilityId = response.facility_id;
      amount = data.amount ?? response.price ?? 0;
      metadata["demand_response_id"] = data.demandResponseId;
      metadata["search_term"] = response.search_term;
      metadata["confirmed_quantity"] = response.quantity;
    }

    if (!facilityId) throw new Error("Commerce introuvable.");

    let appliedCoupon: { id: string; discountAmount: number } | null = null;
    if (data.offerId || data.couponCode) {
      const coupon = await queryOne<{
        id: string;
        product_id: string | null;
        discount_type: "percent" | "fixed";
        discount_percent: number;
        fixed_discount: number | null;
      }>(
        `SELECT c.id, c.product_id, c.discount_type, c.discount_percent, c.fixed_discount
         FROM public.coupons c
         LEFT JOIN public.coupon_assignments ca
           ON ca.coupon_id = c.id AND ca.user_id = $1
         WHERE c.facility_id = $2
           AND c.status = 'active'
           AND c.active_from <= now()
           AND (c.active_until IS NULL OR c.active_until > now())
           AND (c.id = $3::uuid OR ca.personalized_code = upper($4))
           AND (c.product_id IS NULL OR c.product_id = $5::uuid)
           AND (ca.status IS NULL OR ca.status IN ('offered', 'applied'))
         LIMIT 1`,
        [
          context.userId,
          facilityId,
          data.offerId ?? null,
          data.couponCode ?? "",
          data.productId ?? null,
        ],
      );
      if (!coupon) throw new Error("Cette offre n’est plus disponible pour cette transaction.");
      const rawDiscount =
        coupon.discount_type === "fixed"
          ? Number(coupon.fixed_discount ?? 0)
          : Math.round((amount * Number(coupon.discount_percent)) / 100);
      const discountAmount = Math.max(0, Math.min(amount, rawDiscount));
      amount = Math.max(0, amount - discountAmount);
      appliedCoupon = { id: coupon.id, discountAmount };
      metadata["coupon_id"] = coupon.id;
      metadata["discount_amount"] = discountAmount;
    }

    const existing = await queryOne<{
      id: string;
      amount: number;
      status: string;
      qr_token: string | null;
      qr_expires_at: string | null;
    }>(
      `SELECT id, amount, status, qr_token, qr_expires_at FROM public.transactions
       WHERE buyer_id = $1 AND facility_id = $2 AND ($3::uuid IS NULL OR cart_id = $3)
         AND status IN ('pending','qr_generated','qr_verified','payment_pending','paid','fulfillment','received','rating_pending')
       ORDER BY created_at DESC LIMIT 1`,
      [context.userId, facilityId, cartId],
    );
    if (existing) {
      const qrStillActive = Boolean(
        existing.qr_token &&
          existing.qr_expires_at &&
          new Date(existing.qr_expires_at).getTime() > Date.now(),
      );
      if (qrStillActive) {
        return {
          transactionId: existing.id,
          amount: existing.amount,
          status: existing.status,
          code: existing.qr_token,
          expiresAt: existing.qr_expires_at,
        };
      }
      if (existing.status === "pending") {
        const code = newTransactionCode();
        const upgraded = await queryOne<{ qr_token: string; qr_expires_at: string }>(
          `UPDATE public.transactions
           SET status = 'qr_generated', qr_token = $2, qr_expires_at = now() + interval '2 hours'
           WHERE id = $1 AND status = 'pending'
           RETURNING qr_token, qr_expires_at`,
          [existing.id, code],
        );
        if (upgraded) {
          await recordTransactionEvent(existing.id, "offer_confirmed", context.userId, {
            amount: existing.amount,
          });
          await recordTransactionEvent(existing.id, "qr_generated", context.userId, {
            expires_at: upgraded.qr_expires_at,
          });
          return {
            transactionId: existing.id,
            amount: existing.amount,
            status: "qr_generated",
            code: upgraded.qr_token,
            expiresAt: upgraded.qr_expires_at,
          };
        }
      }
      return {
        transactionId: existing.id,
        amount: existing.amount,
        status: existing.status,
        code: existing.qr_token,
        expiresAt: existing.qr_expires_at,
      };
    }

    const feePercent = await feePercentFor(facilityId);
    const platformFee = Math.round((amount * feePercent) / 100);
    const code = newTransactionCode();
    const txn = await queryOne<{ id: string; qr_token: string; qr_expires_at: string }>(
      `INSERT INTO public.transactions
         (facility_id, buyer_id, cart_id, kind, amount, platform_fee, payout_amount,
          fee_percent, payment_mode, status, qr_token, qr_expires_at, intent_created_at, intent_metadata)
       VALUES ($1,$2,$3,'in_app',$4,$5,$6,$7,$8,'qr_generated',$9,now() + interval '2 hours',now(),$10::jsonb)
       RETURNING id, qr_token, qr_expires_at`,
      [
        facilityId,
        context.userId,
        cartId,
        amount,
        platformFee,
        amount - platformFee,
        feePercent,
        data.paymentMode,
        code,
        JSON.stringify(metadata),
      ],
    );
    await recordTransactionEvent(txn!.id, "intent_created", context.userId, metadata);
    await recordTransactionEvent(txn!.id, "offer_confirmed", context.userId, { amount });
    await recordTransactionEvent(txn!.id, "qr_generated", context.userId, {
      expires_at: txn!.qr_expires_at,
    });
    if (appliedCoupon) {
      await recordTransactionEvent(txn!.id, "coupon_applied", context.userId, {
        discount_amount: appliedCoupon.discountAmount,
      });
    }

    if (appliedCoupon) {
      await query(
        `INSERT INTO public.redemptions (coupon_id, facility_id, user_id, transaction_id, discount_amount)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (coupon_id, user_id, transaction_id) DO NOTHING`,
        [appliedCoupon.id, facilityId, context.userId, txn!.id, appliedCoupon.discountAmount],
      );
      await query(
        `UPDATE public.coupon_assignments
         SET status = 'consumed', transaction_id = $2
         WHERE coupon_id = $1 AND user_id = $3 AND status IN ('offered','applied')`,
        [appliedCoupon.id, txn!.id, context.userId],
      );
      await query(
        `INSERT INTO public.offer_events (coupon_id, facility_id, user_id, transaction_id, event_type, metadata)
         VALUES ($1,$2,$3,$4,'consumed',$5::jsonb)`,
        [
          appliedCoupon.id,
          facilityId,
          context.userId,
          txn!.id,
          JSON.stringify({ discount_amount: appliedCoupon.discountAmount }),
        ],
      );
    }

    const owner = await queryOne<{ owner_id: string | null; name: string }>(
      `SELECT owner_id, name FROM public.facilities WHERE id = $1`,
      [facilityId],
    );
    if (owner?.owner_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          owner.owner_id,
          "Nouvelle intention d'achat · QR prêt",
          `Un acheteur souhaite acheter chez ${owner.name}. Le QR de transaction est prêt à vérifier.`,
          `/vendeur?transactionId=${txn!.id}`,
        ],
      );
    }
    return {
      transactionId: txn!.id,
      amount,
      status: "qr_generated",
      code: txn!.qr_token,
      expiresAt: txn!.qr_expires_at,
    };
  });

/**
 * Buyer generates the pickup QR for an accepted request.
 * Payment itself stays offline (cash at pickup) — "Mode démo" for card flows.
 */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ cartId: z.string().uuid() }).parse(input))
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
       WHERE cart_id = $1 AND status IN ('pending','qr_generated') AND qr_expires_at > now()
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

    const code = newTransactionCode();
    const txn = await queryOne<{ id: string; qr_token: string; qr_expires_at: string }>(
      `INSERT INTO public.transactions
         (facility_id, buyer_id, cart_id, kind, amount, platform_fee, payout_amount,
          fee_percent, payment_mode, status, qr_token, qr_expires_at, intent_created_at, intent_metadata)
       VALUES ($1,$2,$3,'in_app',$4,$5,$6,$7,'cash','qr_generated',$8, now() + interval '2 hours', now(),
               jsonb_build_object('buyer_id', $2, 'facility_id', $1, 'cart_id', $3, 'amount', $4, 'platform_fee', $5, 'payout_amount', $6, 'payment_mode', 'cash'))
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
    await recordTransactionEvent(txn!.id, "offer_confirmed", context.userId, { cart_id: cart.id });
    await recordTransactionEvent(txn!.id, "qr_generated", context.userId, {
      expires_at: txn!.qr_expires_at,
    });
    return { code: txn!.qr_token, expiresAt: txn!.qr_expires_at };
  });

export const createTransactionQr = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ transactionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await enforceRateLimit({
      bucket: "checkout",
      subject: context.userId,
      limit: 20,
      windowSeconds: 600,
      message: "Trop de codes générés. Réessayez dans quelques minutes.",
    });
    const transaction = await queryOne<{
      id: string;
      facility_id: string;
      status: string;
      amount: number;
      qr_token: string | null;
      qr_expires_at: string | null;
    }>(
      `SELECT id, facility_id, status, amount, qr_token, qr_expires_at
       FROM public.transactions WHERE id = $1 AND buyer_id = $2`,
      [data.transactionId, context.userId],
    );
    if (!transaction) throw new Error("Transaction introuvable.");
    const qrExpired =
      transaction.status === "qr_generated" &&
      Boolean(transaction.qr_expires_at) &&
      new Date(transaction.qr_expires_at!).getTime() <= Date.now();
    if (transaction.status !== "pending" && !qrExpired)
      throw new Error("Cette intention n'est plus en attente d'offre.");
    if (
      transaction.qr_token &&
      transaction.qr_expires_at &&
      new Date(transaction.qr_expires_at).getTime() > Date.now()
    ) {
      return { code: transaction.qr_token, expiresAt: transaction.qr_expires_at };
    }
    const code = newTransactionCode();
    const updated = await queryOne<{ qr_token: string; qr_expires_at: string }>(
      `UPDATE public.transactions
       SET status = 'qr_generated', qr_token = $2, qr_expires_at = now() + interval '2 hours'
       WHERE id = $1
       RETURNING qr_token, qr_expires_at`,
      [data.transactionId, code],
    );
    if (!qrExpired) {
      await recordTransactionEvent(data.transactionId, "offer_confirmed", context.userId, {
        amount: transaction.amount,
      });
    }
    await recordTransactionEvent(data.transactionId, "qr_generated", context.userId, {
      expires_at: updated!.qr_expires_at,
      ...(qrExpired ? { regenerated: true } : {}),
    });
    const owner = await queryOne<{ owner_id: string | null }>(
      "SELECT owner_id FROM public.facilities WHERE id = $1",
      [transaction.facility_id],
    );
    if (owner?.owner_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          owner.owner_id,
          "Offre confirmée",
          "Un QR de retrait a été généré pour une intention d'achat.",
          `/vendeur?transactionId=${data.transactionId}`,
        ],
      );
    }
    return { code: updated!.qr_token, expiresAt: updated!.qr_expires_at };
  });

export const resolveTransactionQr = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ token: z.string().min(4).max(64) }).parse(input))
  .handler(async ({ data, context }) => {
    const row = await queryOne<{
      id: string;
      facility_id: string;
      buyer_id: string | null;
      owner_id: string | null;
    }>(
      `SELECT t.id, t.facility_id, t.buyer_id, f.owner_id
       FROM public.transactions t
       JOIN public.facilities f ON f.id = t.facility_id
       WHERE t.qr_token = $1
         AND t.status IN ('qr_generated','qr_verified','payment_pending','paid','fulfillment','received','rating_pending')
         AND (t.buyer_id = $2 OR f.owner_id = $2)`,
      [data.token.trim().toUpperCase(), context.userId],
    );
    if (!row) throw new Error("Ce lien QR n’est pas accessible avec ce compte.");
    return {
      transactionId: row.id,
      facilityId: row.facility_id,
      role: row.buyer_id === context.userId ? "buyer" : "seller",
    } as const;
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

    const authorised = await queryOne<{ id: string }>(
      `UPDATE public.transactions
       SET status = 'payment_pending', qr_authorised_at = now()
       WHERE id = $1 AND status IN ('qr_generated', 'qr_verified')
       RETURNING id`,
      [txn.id],
    );
    if (!authorised) {
      throw new Error("Ce code a déjà été vérifié ou n'est plus actif.");
    }
    await recordTransactionEvent(txn.id, "seller_verified", context.userId, {
      facility_id: data.facilityId,
    });
    await recordTransactionEvent(txn.id, "payment_pending", context.userId, {
      payment_mode: txn.status,
    });
    if (txn.buyer_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1, $2, $3, $4)`,
        [
          txn.buyer_id,
          "Retrait vérifié",
          "Le commerçant a vérifié votre QR. Confirmez le paiement puis la réception du produit.",
          `/carte?transactionId=${txn.id}`,
        ],
      );
    }
    await query(
      `INSERT INTO public.notifications (user_id, title, body, link)
       VALUES ($1,$2,$3,$4)`,
      [
        context.userId,
        "Retrait vérifié",
        `Le QR a été vérifié. Le paiement reste à confirmer par l'acheteur. Commission prévue : ${await formatMoneyServer(data.facilityId, txn.platform_fee)}.`,
        `/vendeur?transactionId=${txn.id}`,
      ],
    );

    const facility = await queryOne<{ status: string }>(
      "SELECT status FROM public.facilities WHERE id = $1",
      [data.facilityId],
    );
    return {
      transactionId: txn.id,
      amount: txn.amount,
      platformFee: txn.platform_fee,
      payout: txn.payout_amount,
      facilityStatus: facility?.status ?? null,
    };
  });

export const getTransactionTimeline = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ transactionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const transaction = await queryOne<TransactionTimeline["transaction"]>(
      `SELECT t.id, t.facility_id, f.name AS facility_name, t.buyer_id, t.status, t.amount,
              t.payment_mode, t.payment_preference, t.buyer_payment_declared_at,
              t.seller_payment_confirmed_at, t.fulfillment_started_at,
              CASE WHEN t.status IN ('payment_pending','paid','fulfillment','received','rating_pending','completed')
                   THEN f.phone ELSE NULL END AS seller_contact,
              CASE WHEN t.buyer_id = $2 THEN 'buyer' ELSE 'seller' END AS viewer_role,
              t.qr_token, t.qr_expires_at, t.intent_created_at, t.paid_at, t.completed_at
       FROM public.transactions t
       JOIN public.facilities f ON f.id = t.facility_id
       WHERE t.id = $1 AND (t.buyer_id = $2 OR f.owner_id = $2)`,
      [data.transactionId, context.userId],
    );
    if (!transaction) throw new Error("Transaction introuvable.");
    const events = await query<TransactionEvent>(
      `SELECT id, transaction_id, event_type, actor_id, metadata, created_at
       FROM public.transaction_events WHERE transaction_id = $1 ORDER BY created_at ASC`,
      [data.transactionId],
    );
    return { transaction, events };
  });

export const selectTransactionPaymentPreference = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        transactionId: z.string().uuid(),
        method: z.enum(["cash_on_delivery", "tmoney", "flooz", "external_other"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const txn = await queryOne<{ id: string; facility_id: string }>(
      `UPDATE public.transactions
       SET payment_preference = $2
       WHERE id = $1 AND buyer_id = $3 AND status = 'payment_pending'
       RETURNING id, facility_id`,
      [data.transactionId, data.method, context.userId],
    );
    if (!txn) {
      const existing = await queryOne<{ payment_preference: string | null; status: string }>(
        "SELECT payment_preference, status FROM public.transactions WHERE id = $1 AND buyer_id = $2",
        [data.transactionId, context.userId],
      );
      if (existing?.status === "payment_pending" && existing.payment_preference === data.method) {
        const facility = await queryOne<{ phone: string | null }>(
          "SELECT phone FROM public.facilities WHERE id = (SELECT facility_id FROM public.transactions WHERE id = $1)",
          [data.transactionId],
        );
        return {
          ok: true,
          method: data.method,
          sellerContact: data.method === "cash_on_delivery" ? null : (facility?.phone ?? null),
        };
      }
      throw new Error("Le choix du paiement n’est plus disponible.");
    }
    await recordTransactionEvent(txn.id, "payment_preference_selected", context.userId, {
      method: data.method,
      remote: data.method !== "cash_on_delivery",
    });
    const facility = await queryOne<{
      phone: string | null;
      owner_id: string | null;
      name: string;
    }>("SELECT phone, owner_id, name FROM public.facilities WHERE id = $1", [txn.facility_id]);
    if (facility?.owner_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          facility.owner_id,
          "Mode de paiement choisi",
          `Le buyer a choisi ${data.method}.`,
          `/vendeur?transactionId=${txn.id}`,
        ],
      );
    }
    return {
      ok: true,
      method: data.method,
      sellerContact: data.method === "cash_on_delivery" ? null : (facility?.phone ?? null),
    };
  });

export const declareTransactionPayment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ transactionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const txn = await queryOne<{
      id: string;
      facility_id: string;
      amount: number;
      payment_preference: string;
    }>(
      `UPDATE public.transactions
       SET buyer_payment_declared_at = now()
       WHERE id = $1 AND buyer_id = $2 AND status = 'payment_pending'
         AND payment_preference IS NOT NULL
       RETURNING id, facility_id, amount, payment_preference`,
      [data.transactionId, context.userId],
    );
    if (!txn) throw new Error("Choisissez d’abord un mode de paiement.");
    await recordTransactionEvent(txn.id, "payment_declared", context.userId, {
      method: txn.payment_preference,
      amount: txn.amount,
    });
    const owner = await queryOne<{ owner_id: string | null }>(
      "SELECT owner_id FROM public.facilities WHERE id = $1",
      [txn.facility_id],
    );
    if (owner?.owner_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          owner.owner_id,
          "Paiement déclaré",
          "Le buyer indique avoir effectué le paiement externe.",
          `/vendeur?transactionId=${txn.id}`,
        ],
      );
    }
    return { ok: true };
  });

/** Seller-only source of truth for external payment receipt. */
export const confirmTransactionPayment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ transactionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const txn = await queryOne<{
      id: string;
      buyer_id: string | null;
      facility_id: string;
      amount: number;
      payment_preference: string | null;
    }>(
      `UPDATE public.transactions t
       SET status = 'paid', paid_at = now(), seller_payment_confirmed_at = now()
       FROM public.facilities f
       WHERE t.id = $1 AND t.facility_id = f.id AND f.owner_id = $2
         AND t.status = 'payment_pending'
         AND (t.payment_preference = 'cash_on_delivery' OR t.buyer_payment_declared_at IS NOT NULL)
       RETURNING t.id, t.buyer_id, t.facility_id, t.amount, t.payment_preference`,
      [data.transactionId, context.userId],
    );
    if (!txn) throw new Error("Le paiement ne peut pas encore être confirmé.");
    await recordTransactionEvent(txn.id, "payment_confirmed", context.userId, {
      amount: txn.amount,
      method: txn.payment_preference,
      confirmed_by: "seller",
    });
    if (txn.buyer_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          txn.buyer_id,
          "Paiement reçu",
          "Le vendeur a confirmé la réception du paiement.",
          `/carte?transactionId=${txn.id}`,
        ],
      );
    }
    return { ok: true };
  });

export const startTransactionFulfillment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ transactionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const txn = await queryOne<{ id: string; buyer_id: string | null }>(
      `UPDATE public.transactions t
       SET status = 'fulfillment', fulfillment_started_at = now()
       FROM public.facilities f
       WHERE t.id = $1 AND t.facility_id = f.id AND f.owner_id = $2 AND t.status = 'paid'
       RETURNING t.id, t.buyer_id`,
      [data.transactionId, context.userId],
    );
    if (!txn) throw new Error("La remise ne peut pas encore être lancée.");
    await recordTransactionEvent(txn.id, "fulfillment_started", context.userId);
    if (txn.buyer_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          txn.buyer_id,
          "Colis en route",
          "Le vendeur a confirmé la remise ou l’envoi.",
          `/carte?transactionId=${txn.id}`,
        ],
      );
    }
    return { ok: true };
  });

export const confirmProductReceived = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ transactionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const txn = await queryOne<{ id: string; facility_id: string; cart_id: string | null }>(
      `UPDATE public.transactions
       SET status = 'rating_pending', user_confirmed_at = now()
       WHERE id = $1 AND buyer_id = $2 AND status = 'fulfillment'
       RETURNING id, facility_id, cart_id`,
      [data.transactionId, context.userId],
    );
    if (!txn) {
      const existing = await queryOne<{ status: string }>(
        "SELECT status FROM public.transactions WHERE id = $1 AND buyer_id = $2",
        [data.transactionId, context.userId],
      );
      if (existing?.status === "rating_pending" || existing?.status === "received") {
        return { ok: true, alreadyReceived: true };
      }
      if (existing?.status === "completed") {
        return { ok: true, alreadyCompleted: true };
      }
      throw new Error("La réception ne peut pas encore être confirmée.");
    }
    await recordTransactionEvent(txn.id, "product_received", context.userId);
    await recordTransactionEvent(txn.id, "received_confirmed", context.userId);
    const owner = await queryOne<{ owner_id: string | null }>(
      "SELECT owner_id FROM public.facilities WHERE id = $1",
      [txn.facility_id],
    );
    if (owner?.owner_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          owner.owner_id,
          "Produit reçu",
          "L'acheteur a confirmé la réception. La transaction attend son avis.",
          `/vendeur?transactionId=${txn.id}`,
        ],
      );
    }
    return { ok: true, status: "rating_pending" as const };
  });

/** Buyer rating is the final gate before the transaction reaches completed. */
export const submitTransactionRating = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        transactionId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(600).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const txn = await queryOne<{
      id: string;
      facility_id: string;
      cart_id: string | null;
      payout_amount: number;
      owner_id: string | null;
    }>(
      `SELECT t.id, t.facility_id, t.cart_id, t.payout_amount, f.owner_id
       FROM public.transactions t
       JOIN public.facilities f ON f.id = t.facility_id
       WHERE t.id = $1 AND t.buyer_id = $2 AND t.status = 'rating_pending'`,
      [data.transactionId, context.userId],
    );
    if (!txn) throw new Error("La transaction attend d’abord la confirmation de réception.");

    await query(
      `INSERT INTO public.reviews (facility_id, buyer_id, transaction_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (transaction_id) DO UPDATE
         SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
      [txn.facility_id, context.userId, txn.id, data.rating, data.comment?.trim() || null],
    );
    const completed = await queryOne<{ id: string }>(
      `UPDATE public.transactions SET status = 'completed', completed_at = now()
       WHERE id = $1 AND buyer_id = $2 AND status = 'rating_pending'
       RETURNING id`,
      [txn.id, context.userId],
    );
    if (!completed) throw new Error("La transaction a déjà été finalisée.");
    await recordTransactionEvent(txn.id, "rating_submitted", context.userId, {
      rating: data.rating,
      comment: data.comment?.trim() || null,
    });
    await recordTransactionEvent(txn.id, "completed", context.userId);

    const payoutAccountId = await ensureWalletAccount({ facilityId: txn.facility_id });
    await appendWalletEntry({
      accountId: payoutAccountId,
      bucket: "payout",
      amount: txn.payout_amount,
      referenceType: "transaction_payout",
      referenceId: txn.id,
      idempotencyKey: `transaction:payout:${txn.id}`,
      source: "transaction",
      metadata: { transaction_id: txn.id },
    });
    await query(
      `INSERT INTO public.subscriptions (facility_id, payout_balance)
       VALUES ($1, $2)
       ON CONFLICT (facility_id) DO UPDATE
         SET payout_balance = public.subscriptions.payout_balance + EXCLUDED.payout_balance`,
      [txn.facility_id, txn.payout_amount],
    );
    if (txn.cart_id) {
      await query("UPDATE public.carts SET status = 'completed' WHERE id = $1", [txn.cart_id]);
    }
    if (txn.owner_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          txn.owner_id,
          "Nouvel avis client",
          `La transaction est terminée avec une note de ${data.rating}/5.`,
          `/vendeur?transactionId=${txn.id}`,
        ],
      );
    }
    return { ok: true, status: "completed" as const };
  });

export const listVendorTransactions = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const owns = await queryOne<{ id: string }>(
      "SELECT id FROM public.facilities WHERE id = $1 AND owner_id = $2",
      [data.facilityId, context.userId],
    );
    if (!owns) throw new Error("Commerce introuvable ou non autorisé.");
    return query<VendorTransaction>(
      `SELECT t.id, t.amount, t.platform_fee, t.payout_amount, t.status, t.payment_mode,
              t.payment_preference, t.buyer_payment_declared_at,
              t.qr_authorised_at, t.seller_payment_confirmed_at,
              t.completed_at, t.created_at, p.name AS buyer_name
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
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
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

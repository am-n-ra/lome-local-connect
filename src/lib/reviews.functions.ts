import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "./auth-middleware.server";
import { query, queryOne } from "./db.server";

export type FacilityReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  buyer_name: string | null;
};

export type PendingConfirmation = {
  transaction_id: string;
  cart_id: string | null;
  facility_id: string;
  facility_name: string;
  amount: number;
  completed_at: string | null;
  reviewed: boolean;
};

/** Public: ratings shown on a facility sheet. */
export const listFacilityReviews = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ facilityId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const summary = await queryOne<{ avg: string | null; count: number }>(
      `SELECT AVG(rating)::numeric(3,2) AS avg, count(*)::int AS count
       FROM public.reviews WHERE facility_id = $1`,
      [data.facilityId],
    );
    const reviews = await query<FacilityReview>(
      `SELECT r.id, r.rating, r.comment, r.created_at, p.name AS buyer_name
       FROM public.reviews r
       JOIN public.profiles p ON p.id = r.buyer_id
       WHERE r.facility_id = $1
       ORDER BY r.created_at DESC LIMIT 20`,
      [data.facilityId],
    );
    return {
      average: summary?.avg ? Number(summary.avg) : null,
      count: summary?.count ?? 0,
      reviews,
    };
  });

/** Transactions the buyer still has to confirm and/or rate. */
export const listPendingConfirmations = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    query<PendingConfirmation>(
      `SELECT t.id AS transaction_id, t.cart_id, t.facility_id, f.name AS facility_name,
              t.amount, t.completed_at,
              EXISTS (SELECT 1 FROM public.reviews rv WHERE rv.transaction_id = t.id) AS reviewed
       FROM public.transactions t
       JOIN public.facilities f ON f.id = t.facility_id
       WHERE t.buyer_id = $1 AND t.status = 'completed'
       ORDER BY t.completed_at DESC NULLS LAST LIMIT 20`,
      [context.userId],
    ),
  );

/** Buyer confirms the purchase actually happened. */
export const confirmCompletion = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => z.object({ transactionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const txn = await queryOne<{ id: string; cart_id: string | null }>(
      `UPDATE public.transactions SET buyer_confirmed_at = now()
       WHERE id = $1 AND buyer_id = $2 AND buyer_confirmed_at IS NULL
       RETURNING id, cart_id`,
      [data.transactionId, context.userId],
    );
    if (!txn) throw new Error("Transaction introuvable ou déjà confirmée.");
    if (txn.cart_id) {
      await query("UPDATE public.carts SET status = 'completed' WHERE id = $1", [txn.cart_id]);
    }
    return { ok: true };
  });

export const submitReview = createServerFn({ method: "POST" })
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
    const txn = await queryOne<{ facility_id: string; owner_id: string | null }>(
      `SELECT t.facility_id, f.owner_id
       FROM public.transactions t
       JOIN public.facilities f ON f.id = t.facility_id
       WHERE t.id = $1 AND t.buyer_id = $2 AND t.status = 'completed'`,
      [data.transactionId, context.userId],
    );
    if (!txn) throw new Error("Vous ne pouvez noter qu'un achat terminé.");

    await query(
      `INSERT INTO public.reviews (facility_id, buyer_id, transaction_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (transaction_id) DO UPDATE
         SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
      [
        txn.facility_id,
        context.userId,
        data.transactionId,
        data.rating,
        data.comment?.trim() || null,
      ],
    );
    if (txn.owner_id) {
      await query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1,$2,$3,$4)`,
        [
          txn.owner_id,
          "Nouvel avis client",
          `Vous avez reçu une note de ${data.rating}/5.`,
          "/vendeur",
        ],
      );
    }
    return { ok: true };
  });

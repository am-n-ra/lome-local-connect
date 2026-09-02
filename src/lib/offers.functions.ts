import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import { query, queryOne } from "./db.server";

export type ProductOffer =
  | {
      state: "active";
      couponId: string;
      code: string;
      discountType: "percent" | "fixed";
      discountValue: number;
      reason: string;
      expiresAt: string | null;
    }
  | { state: "none"; label: "Aucune remise active" };

export const getProductOffer = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        transactionId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<ProductOffer> => {
    const coupon = await queryOne<{
      id: string;
      code: string;
      discount_type: "percent" | "fixed";
      discount_percent: number;
      fixed_discount: number | null;
      active_until: string | null;
      reason: string;
    }>(
      `SELECT c.id, c.code, c.discount_type, c.discount_percent, c.fixed_discount,
              c.active_until,
              CASE WHEN c.product_id = $1 THEN 'product_offer' ELSE 'facility_offer' END AS reason
       FROM public.coupons c
       JOIN public.products p ON p.facility_id = c.facility_id
       WHERE p.id = $1
         AND c.status = 'active'
         AND (c.product_id = $1 OR c.product_id IS NULL)
         AND c.active_from <= now()
         AND (c.active_until IS NULL OR c.active_until > now())
         AND (c.max_redemptions IS NULL OR (SELECT count(*) FROM public.redemptions r WHERE r.coupon_id = c.id) < c.max_redemptions)
         AND NOT EXISTS (
           SELECT 1 FROM public.redemptions r
           WHERE r.coupon_id = c.id AND r.user_id = $2
           GROUP BY r.coupon_id
           HAVING count(*) >= c.per_user_limit
         )
       ORDER BY (c.product_id = $1) DESC, c.discount_percent DESC, c.created_at DESC
       LIMIT 1`,
      [data.productId, context.userId],
    );

    if (!coupon) return { state: "none", label: "Aucune remise active" };

    const personalizedCode = `${coupon.code}-${context.userId.slice(0, 6).toUpperCase()}`;
    await query(
      `INSERT INTO public.coupon_assignments
         (coupon_id, user_id, transaction_id, reason, personalized_code, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (coupon_id, user_id, transaction_id) DO UPDATE
         SET status = CASE WHEN public.coupon_assignments.status = 'consumed' THEN public.coupon_assignments.status ELSE 'offered' END
       `,
      [
        coupon.id,
        context.userId,
        data.transactionId ?? null,
        coupon.reason,
        personalizedCode,
        coupon.active_until,
      ],
    );
    await query(
      `INSERT INTO public.offer_events (coupon_id, product_id, facility_id, user_id, transaction_id, event_type, metadata)
       SELECT $1, p.id, p.facility_id, $2, $3, 'assigned', jsonb_build_object('reason', $4)
       FROM public.products p WHERE p.id = $5`,
      [coupon.id, context.userId, data.transactionId ?? null, coupon.reason, data.productId],
    );

    return {
      state: "active",
      couponId: coupon.id,
      code: personalizedCode,
      discountType: coupon.discount_type,
      discountValue:
        coupon.discount_type === "fixed"
          ? Number(coupon.fixed_discount ?? 0)
          : Number(coupon.discount_percent),
      reason: coupon.reason,
      expiresAt: coupon.active_until,
    };
  });

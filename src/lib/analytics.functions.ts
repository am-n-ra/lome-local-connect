import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireStaff } from "./auth-middleware";
import { query } from "./db.server";

const eventName = z.enum([
  "onboarding_started",
  "onboarding_completed",
  "search_authenticated",
  "search_submitted",
  "search_results_viewed",
  "facility_opened",
  "product_opened",
  "availability_requested",
  "availability_answered",
  "purchase_intent_created",
  "chat_started",
  "message_sent",
  "qr_generated",
  "qr_verified",
  "seller_verified",
  "payment_confirmed",
  "transaction_completed",
  "coupon_viewed",
  "coupon_applied",
  "coupon_consumed",
  "ad_impression",
  "ad_clicked",
  "balance_deposit_confirmed",
  "balance_deposit_approved",
  "balance_deposit_failed",
  "pwa_installed",
]);

export const recordProductEvent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        eventName,
        sessionId: z.string().min(12).max(120),
        role: z.enum(["buyer", "seller", "staff", "unknown"]).default("unknown"),
        marketCode: z.string().max(40).nullable().optional(),
        geoCell: z.string().max(80).nullable().optional(),
        objectType: z.string().max(50).nullable().optional(),
        objectId: z.string().max(120).nullable().optional(),
        source: z.string().max(50).nullable().optional(),
        metadata: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
          .default({}),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await query(
      `INSERT INTO public.product_events
         (event_name, user_id, session_id, role, market_code, geo_cell, object_type, object_id, source, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      [
        data.eventName,
        context.userId,
        data.sessionId,
        data.role,
        data.marketCode ?? null,
        data.geoCell ?? null,
        data.objectType ?? null,
        data.objectId ?? null,
        data.source ?? null,
        JSON.stringify(data.metadata),
      ],
    );
    return { ok: true };
  });

export type ProductFunnelSummary = {
  event_name: string;
  event_count: number;
  unique_users: number;
};

export const getProductFunnelSummary = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) =>
    z
      .object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30) })
      .parse(input),
  )
  .handler(async ({ data }) =>
    query<ProductFunnelSummary>(
      `SELECT event_name, count(*)::int AS event_count,
              count(DISTINCT user_id)::int AS unique_users
       FROM public.product_events
       WHERE created_at >= now() - ($1::int * interval '1 day')
       GROUP BY event_name
       ORDER BY event_count DESC, event_name ASC`,
      [data.days],
    ),
  );

export const saveAnalyticsConsent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        consentType: z.enum(["product_analytics", "marketing"]),
        granted: z.boolean(),
        policyVersion: z.string().max(30).default("2026-08-17"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await query(
      `INSERT INTO public.analytics_consents (user_id, consent_type, granted, policy_version)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, consent_type, policy_version) DO UPDATE
       SET granted = EXCLUDED.granted, created_at = now()`,
      [context.userId, data.consentType, data.granted, data.policyVersion],
    );
    return { ok: true };
  });

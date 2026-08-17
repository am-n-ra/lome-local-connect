import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware";
import { query } from "./db.server";

const eventName = z.enum([
  "onboarding_started",
  "onboarding_completed",
  "search_submitted",
  "search_results_viewed",
  "facility_opened",
  "product_opened",
  "availability_requested",
  "availability_answered",
  "chat_started",
  "message_sent",
  "qr_generated",
  "seller_verified",
  "payment_confirmed",
  "transaction_completed",
  "coupon_viewed",
  "coupon_applied",
  "ad_impression",
  "ad_clicked",
  "balance_deposit_confirmed",
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

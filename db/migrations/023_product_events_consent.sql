-- Omni product analytics: consented, pseudonymous and separated from operational data.

CREATE TABLE IF NOT EXISTS public.analytics_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('product_analytics', 'marketing')),
  granted boolean NOT NULL,
  policy_version text NOT NULL DEFAULT '2026-08-17',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type, policy_version)
);

CREATE TABLE IF NOT EXISTS public.product_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  role text CHECK (role IN ('buyer', 'seller', 'staff', 'unknown')),
  market_code text,
  geo_cell text,
  object_type text,
  object_id text,
  source text,
  ui_version text NOT NULL DEFAULT '2026-08-17',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_events_name_created_idx
  ON public.product_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS product_events_user_created_idx
  ON public.product_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS product_events_market_created_idx
  ON public.product_events (market_code, created_at DESC);

CREATE OR REPLACE VIEW public.omni_search_funnel_30d AS
SELECT
  count(*) FILTER (WHERE event_name = 'search_submitted')::int AS searches,
  count(*) FILTER (WHERE event_name = 'search_results_viewed')::int AS result_views,
  count(*) FILTER (WHERE event_name = 'availability_requested')::int AS availability_requests,
  count(*) FILTER (WHERE event_name = 'transaction_completed')::int AS completed_transactions,
  count(*) FILTER (WHERE event_name = 'coupon_applied')::int AS coupons_applied
FROM public.product_events
WHERE created_at >= now() - interval '30 days';

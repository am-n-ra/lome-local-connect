-- OmniView v3 schema — Neon Postgres
-- Rebuilds the public application schema. The neon_auth schema is NEVER touched.

BEGIN;

-- 1. Drop legacy application tables (PostGIS-managed relations are left alone)
DROP TABLE IF EXISTS public.auth_accounts CASCADE;
DROP TABLE IF EXISTS public.auth_sessions CASCADE;
DROP TABLE IF EXISTS public.auth_users CASCADE;
DROP TABLE IF EXISTS public.auth_verification_token CASCADE;
DROP TABLE IF EXISTS public.availability_requests CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.carts CASCADE;
DROP TABLE IF EXISTS public.delivery_planned_trips CASCADE;
DROP TABLE IF EXISTS public.delivery_profiles CASCADE;
DROP TABLE IF EXISTS public.delivery_requests CASCADE;
DROP TABLE IF EXISTS public.delivery_vehicles CASCADE;
DROP TABLE IF EXISTS public.escrow_holds CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.fedapay_webhook_events CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.proximity_log CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.wallet_deposit_intents CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;

-- New tables from previous runs of this script
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.certification_submissions CASCADE;
DROP TABLE IF EXISTS public.mobile_presence CASCADE;
DROP TABLE IF EXISTS public.ad_campaigns CASCADE;
DROP TABLE IF EXISTS public.redemptions CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.offers CASCADE;
DROP TABLE IF EXISTS public.user_interests CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.markets CASCADE;

-- 2. Markets — every country-specific value is a row here, never hardcoded
CREATE TABLE public.markets (
  market_code                    text PRIMARY KEY,
  country_name                   text NOT NULL,
  currency_code                  text NOT NULL,
  payment_provider               text NOT NULL,
  default_platform_fee_percent   numeric(5,2) NOT NULL DEFAULT 2,
  informal_certification_enabled boolean NOT NULL DEFAULT true,
  community_channel_type         text,
  community_channel_url          text,
  community_channel_explanation  text,
  active                         boolean NOT NULL DEFAULT true,
  created_at                     timestamptz NOT NULL DEFAULT now()
);

-- 3. Profiles — one row per Neon Auth user
CREATE TABLE public.profiles (
  id                uuid PRIMARY KEY,
  name              text NOT NULL DEFAULT '',
  email             text,
  phone             text,
  market_code       text NOT NULL DEFAULT 'TG-LOME' REFERENCES public.markets(market_code),
  wallet_balance    integer NOT NULL DEFAULT 0,
  onboarding_done   boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('admin','moderator','acquisition')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE public.user_interests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, interest)
);

-- 4. Facilities — four-state lifecycle
--    unclaimed  : imported listing, unclaimed (created by the OSM import)
--    unconfirmed : claimed by an owner, profile filled in
--    certified      : admin/acquisition team checked identity or documents
--    confirmed     : earned through QR-authorised transactions from distinct buyers
CREATE TABLE public.facilities (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_code          text NOT NULL DEFAULT 'TG-LOME' REFERENCES public.markets(market_code),
  owner_id             uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name                 text NOT NULL,
  category             text NOT NULL DEFAULT 'other',
  description          text,
  address              text,
  neighbourhood        text,
  latitude             double precision NOT NULL,
  longitude            double precision NOT NULL,
  phone                text,
  status               text NOT NULL DEFAULT 'unconfirmed'
                       CHECK (status IN ('unclaimed','unconfirmed','certified','confirmed')),
  type                 text NOT NULL DEFAULT 'fixe' CHECK (type IN ('fixe','mobile')),
  is_online            boolean NOT NULL DEFAULT true,
  last_position_update timestamptz,
  source               text NOT NULL DEFAULT 'manual',
  source_ref           text,
  claimed_at           timestamptz,
  verified_at          timestamptz,
  confirmed_at         timestamptz,
  contacted_at         timestamptz,
  contact_outcome      text,
  contact_notes        text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX facilities_source_ref_key ON public.facilities (source, source_ref)
  WHERE source_ref IS NOT NULL;
CREATE INDEX facilities_status_idx ON public.facilities (status);
CREATE INDEX facilities_market_idx ON public.facilities (market_code);
CREATE INDEX facilities_position_idx ON public.facilities (latitude, longitude);

CREATE TABLE public.products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id       uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name              text NOT NULL,
  price             integer NOT NULL DEFAULT 0,
  discount_percent  integer NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),
  in_stock          boolean NOT NULL DEFAULT true,
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','paused','sold_out')),
  quantity_available integer NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  omni_allocation_percent integer NOT NULL DEFAULT 100 CHECK (omni_allocation_percent BETWEEN 0 AND 100),
  photo_url         text,
  last_confirmed_at timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_facility_idx ON public.products (facility_id);

CREATE TABLE public.offers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id      uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),
  active_until     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coupons (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id      uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  code             text NOT NULL,
  description      text,
  discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 90),
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX coupons_facility_code_key ON public.coupons (facility_id, upper(code));

CREATE TABLE public.redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  facility_id                  uuid PRIMARY KEY REFERENCES public.facilities(id) ON DELETE CASCADE,
  tier                         text NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro')),
  wallet_balance               integer NOT NULL DEFAULT 0,
  payout_balance               integer NOT NULL DEFAULT 0,
  pro_active_until             date,
  last_qualifying_action_month text
);

CREATE TABLE public.ad_campaigns (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id           uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  product_ids           uuid[] NOT NULL DEFAULT '{}',
  radius_km             integer,
  is_city_wide          boolean NOT NULL DEFAULT false,
  cost_fcfa             integer NOT NULL DEFAULT 0,
  reach_estimate        integer NOT NULL DEFAULT 0,
  campaign_active_until timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.mobile_presence (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id          uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  active               boolean NOT NULL DEFAULT false,
  latitude             double precision,
  longitude            double precision,
  last_position_update timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX mobile_presence_facility_key ON public.mobile_presence (facility_id);

CREATE TABLE public.carts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','refused','completed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX carts_facility_idx ON public.carts (facility_id, status);

CREATE TABLE public.cart_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id       uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity      integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 99),
  price_at_time integer NOT NULL DEFAULT 0
);

CREATE TABLE public.transactions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id        uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  buyer_id           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  cart_id            uuid REFERENCES public.carts(id) ON DELETE SET NULL,
  kind               text NOT NULL DEFAULT 'in_app' CHECK (kind IN ('in_app','external','wallet_topup')),
  amount             integer NOT NULL DEFAULT 0,
  platform_fee       integer NOT NULL DEFAULT 0,
  payout_amount      integer NOT NULL DEFAULT 0,
  currency_code      text NOT NULL DEFAULT 'XOF',
  status             text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','completed','failed','refunded')),
  provider           text,
  provider_ref       text,
  qr_token           text,
  qr_authorised_at   timestamptz,
  completed_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX transactions_provider_ref_key ON public.transactions (provider, provider_ref)
  WHERE provider_ref IS NOT NULL;
CREATE INDEX transactions_facility_idx ON public.transactions (facility_id, status);

CREATE TABLE public.certification_submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('formal','informal')),
  document_url  text,
  reference     text,
  notes         text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wishlists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  market_code text NOT NULL DEFAULT 'TG-LOME' REFERENCES public.markets(market_code),
  search_term text NOT NULL,
  latitude    double precision,
  longitude   double precision,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wishlists_created_idx ON public.wishlists (created_at DESC);

CREATE TABLE public.favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, facility_id)
);

CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      text NOT NULL,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);

CREATE TABLE public.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   text,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON public.audit_log (created_at DESC);

-- 5. confirmed status is earned, never declared: three distinct buyers with a
--    completed, QR-authorised transaction promote the facility automatically.
CREATE OR REPLACE FUNCTION public.refresh_facility_confirmation() RETURNS trigger AS $$
DECLARE
  distinct_buyers integer;
  current_status  text;
BEGIN
  SELECT count(DISTINCT buyer_id) INTO distinct_buyers
  FROM public.transactions
  WHERE facility_id = NEW.facility_id
    AND status = 'completed'
    AND qr_authorised_at IS NOT NULL
    AND buyer_id IS NOT NULL;

  SELECT status INTO current_status FROM public.facilities WHERE id = NEW.facility_id;

  IF distinct_buyers >= 3 AND current_status IN ('unconfirmed','certified') THEN
    UPDATE public.facilities
      SET status = 'confirmed', confirmed_at = now(), updated_at = now()
      WHERE id = NEW.facility_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_confirm_facility
AFTER INSERT OR UPDATE OF status, qr_authorised_at ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.refresh_facility_confirmation();

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER facilities_touch BEFORE UPDATE ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;

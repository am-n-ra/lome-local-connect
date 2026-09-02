-- Omni offers: product-scoped coupons and personalized, auditable assignments.

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  ADD COLUMN IF NOT EXISTS fixed_discount integer,
  ADD COLUMN IF NOT EXISTS min_order_amount integer,
  ADD COLUMN IF NOT EXISTS max_redemptions integer,
  ADD COLUMN IF NOT EXISTS per_user_limit integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS active_from timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS active_until timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'expired')),
  ADD COLUMN IF NOT EXISTS sponsor text NOT NULL DEFAULT 'seller';

CREATE INDEX IF NOT EXISTS coupons_product_active_idx
  ON public.coupons (product_id, status, active_from, active_until);

ALTER TABLE public.redemptions
  ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS redemptions_coupon_user_transaction_key
  ON public.redemptions (coupon_id, user_id, transaction_id)
  WHERE user_id IS NOT NULL AND transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.coupon_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  reason text NOT NULL,
  personalized_code text NOT NULL,
  status text NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'applied', 'consumed', 'expired', 'revoked')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id, transaction_id)
);

CREATE INDEX IF NOT EXISTS coupon_assignments_user_status_idx
  ON public.coupon_assignments (user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.offer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  facility_id uuid REFERENCES public.facilities(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('viewed', 'assigned', 'applied', 'consumed', 'rejected')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offer_events_product_created_idx
  ON public.offer_events (product_id, created_at DESC);

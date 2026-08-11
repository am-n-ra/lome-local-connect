-- OmniView — P0 completion: bulk demand requests, chat, reviews,
-- completion confirmation and user-targeted coupons.

-- 1. Bulk availability requests (PRD Mode B)
CREATE TABLE IF NOT EXISTS public.demand_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  market_code  text NOT NULL DEFAULT 'TG-LOME' REFERENCES public.markets(market_code),
  search_term  text NOT NULL,
  quantity     integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 999),
  latitude     double precision,
  longitude    double precision,
  radius_km    numeric(5,1) NOT NULL DEFAULT 5,
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','expired')),
  expires_at   timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS demand_requests_buyer_idx ON public.demand_requests (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS demand_requests_open_idx ON public.demand_requests (status, expires_at);

CREATE TABLE IF NOT EXISTS public.demand_responses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES public.demand_requests(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  available   boolean NOT NULL DEFAULT true,
  price       integer,
  quantity    integer,
  message     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS demand_responses_unique
  ON public.demand_responses (request_id, facility_id);

-- 2. Chat between buyer and facility
CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  buyer_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cart_id     uuid REFERENCES public.carts(id) ON DELETE SET NULL,
  sender_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('buyer','seller')),
  body        text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_thread_idx
  ON public.messages (facility_id, buyer_id, created_at);

-- 3. Ratings and reviews, one per completed transaction
CREATE TABLE IF NOT EXISTS public.reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id    uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  buyer_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  rating         integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_transaction_unique
  ON public.reviews (transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reviews_facility_idx ON public.reviews (facility_id, created_at DESC);

-- 4. Buyer confirmation of completion
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS buyer_confirmed_at timestamptz;

-- 5. User-targeted coupons with validity and usage caps
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_redemptions integer;
CREATE INDEX IF NOT EXISTS coupons_target_idx ON public.coupons (target_user_id);

-- 6. Cart request expiry helper (2h) used by the app and by scheduled cleanup
CREATE OR REPLACE FUNCTION public.expire_stale_carts() RETURNS integer AS $$
DECLARE n integer;
BEGIN
  WITH upd AS (
    UPDATE public.carts SET status = 'expired'
    WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < now()
    RETURNING 1
  ) SELECT count(*)::int INTO n FROM upd;
  RETURN n;
END;
$$ LANGUAGE plpgsql;

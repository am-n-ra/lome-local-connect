-- OmniView — PRD v3 final: cart lifecycle, catalog imports, comms checklist,
-- generic community channels, self-service mobile presence radius.

-- 1. Community channels per market (generic, never WhatsApp hardcoded in code)
CREATE TABLE IF NOT EXISTS public.community_channels (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_code      text NOT NULL REFERENCES public.markets(market_code) ON DELETE CASCADE,
  channel_type     text NOT NULL DEFAULT 'whatsapp'
                   CHECK (channel_type IN ('whatsapp','discord','sms','telegram','other')),
  invite_url       text NOT NULL,
  explanation_text text NOT NULL DEFAULT '',
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_channels_market_idx
  ON public.community_channels (market_code, active);

INSERT INTO public.community_channels (market_code, channel_type, invite_url, explanation_text)
SELECT m.market_code,
       COALESCE(m.community_channel_type, 'whatsapp'),
       COALESCE(m.community_channel_url, 'https://chat.whatsapp.com/omniview-lome'),
       COALESCE(
         m.community_channel_explanation,
         'Notre équipe comms crée des visuels pour vos produits et les diffuse sur les réseaux OmniView et sur ce canal, où sont déjà tous les utilisateurs actifs. C''est le moyen le plus rapide d''atteindre vos 3 premières ventes et de devenir « Confirmé ».'
       )
FROM public.markets m
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_channels c WHERE c.market_code = m.market_code
);

-- 2. Facilities: community channel gate
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS community_channel_joined boolean NOT NULL DEFAULT false;

-- 3. Comms checklist tracked by the comms team
CREATE TABLE IF NOT EXISTS public.comms_checklists (
  facility_id                uuid PRIMARY KEY REFERENCES public.facilities(id) ON DELETE CASCADE,
  visuals_created            boolean NOT NULL DEFAULT false,
  shared_on_social           boolean NOT NULL DEFAULT false,
  shared_on_community_channel boolean NOT NULL DEFAULT false,
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

-- 4. Cart lifecycle: draft -> pending -> answered, with auto-expiry
ALTER TABLE public.carts DROP CONSTRAINT IF EXISTS carts_status_check;
ALTER TABLE public.carts
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;
UPDATE public.carts SET status = 'confirmed' WHERE status = 'accepted';
UPDATE public.carts SET status = 'declined'  WHERE status = 'refused';
ALTER TABLE public.carts ADD CONSTRAINT carts_status_check CHECK (
  status IN ('draft','pending','confirmed','partially_confirmed','declined','expired','completed')
);
ALTER TABLE public.carts ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS confirmed_available boolean,
  ADD COLUMN IF NOT EXISTS confirmed_quantity integer;

-- One open request per buyer per facility (anti-spam guard)
CREATE UNIQUE INDEX IF NOT EXISTS carts_open_unique
  ON public.carts (buyer_id, facility_id)
  WHERE status IN ('draft','pending');

-- 5. Mobile presence: self-service broadcast radius
ALTER TABLE public.mobile_presence
  ADD COLUMN IF NOT EXISTS broadcast_radius_km numeric(4,1) NOT NULL DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS last_broadcast_at timestamptz;

-- 6. Offers linked to a product, with an auto source for mandatory discounts
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'seller_created';

-- 7. Bulk catalog import
CREATE TABLE IF NOT EXISTS public.catalog_imports (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id        uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  source_type        text NOT NULL CHECK (source_type IN ('csv','xlsx','pasted_text')),
  source_file_url    text,
  status             text NOT NULL DEFAULT 'processing'
                     CHECK (status IN ('processing','needs_review','completed','failed')),
  raw_input          text,
  ai_mapped_products jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message      text,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS catalog_imports_facility_idx
  ON public.catalog_imports (facility_id, created_at DESC);

-- 8. Buyer interests (already present on some deployments)
CREATE TABLE IF NOT EXISTS public.user_interests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category    text,
  search_term text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_interests_user_idx ON public.user_interests (user_id);

-- 9. Every product must carry a real discount from now on
CREATE OR REPLACE FUNCTION public.enforce_product_discount() RETURNS trigger AS $$
BEGIN
  IF NEW.discount_percent IS NULL OR NEW.discount_percent < 1 THEN
    RAISE EXCEPTION 'Chaque produit doit avoir une remise supérieure à 0 %%.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_require_discount ON public.products;
CREATE TRIGGER products_require_discount
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_product_discount();

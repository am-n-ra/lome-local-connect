-- Omni — search index, five-state lifecycle, buyer plans & bulk availability
-- (PRD "Geospatial Supply & Demand Search Engine")

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Facility lifecycle: unclaimed -> uncertified -> certified -> unconfirmed -> confirmed
ALTER TABLE public.facilities DROP CONSTRAINT IF EXISTS facilities_status_check;
ALTER TABLE public.facilities ALTER COLUMN status DROP DEFAULT;

-- Claimed but never verified becomes "uncertified"; certified facilities that
-- already sold enough stay where they are.
UPDATE public.facilities SET status = 'uncertified'
  WHERE status = 'unconfirmed' AND verified_at IS NULL;

ALTER TABLE public.facilities ALTER COLUMN status SET DEFAULT 'uncertified';
ALTER TABLE public.facilities ADD CONSTRAINT facilities_status_check
  CHECK (status IN ('unclaimed','uncertified','certified','unconfirmed','confirmed'));

CREATE OR REPLACE FUNCTION public.refresh_facility_confirmation() RETURNS trigger AS $$
DECLARE
  distinct_buyers integer;
  current_status  text;
BEGIN
  SELECT count(DISTINCT buyer_id) INTO distinct_buyers
  FROM public.transactions
  WHERE facility_id = NEW.facility_id
    AND status IN ('completed','user_confirmed')
    AND qr_authorised_at IS NOT NULL
    AND buyer_id IS NOT NULL;

  SELECT status INTO current_status FROM public.facilities WHERE id = NEW.facility_id;

  IF distinct_buyers >= 3 AND current_status IN ('uncertified','certified','unconfirmed') THEN
    UPDATE public.facilities
      SET status = 'confirmed', confirmed_at = now(), updated_at = now()
      WHERE id = NEW.facility_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Transaction state machine + line items
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check CHECK (
  status IN ('pending','qr_generated','qr_verified','payment_pending','paid',
             'fulfillment','user_confirmed','completed','cancelled','failed',
             'disputed','expired','refunded')
);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_confirmed_at timestamptz;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS automation_level text
  NOT NULL DEFAULT 'manual' CHECK (automation_level IN ('manual','assisted','auto'));

CREATE TABLE IF NOT EXISTS public.transaction_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id       uuid REFERENCES public.products(id) ON DELETE SET NULL,
  label            text NOT NULL,
  quantity         integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price       integer NOT NULL DEFAULT 0,
  discount_percent integer NOT NULL DEFAULT 0,
  total            integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS transaction_items_tx_idx ON public.transaction_items (transaction_id);

-- 3. Buyer plans and availability-request credits
CREATE TABLE IF NOT EXISTS public.user_plans (
  user_id            uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan               text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  plan_active_until  timestamptz,
  period_month       text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  requests_used      integer NOT NULL DEFAULT 0,
  extra_credits      integer NOT NULL DEFAULT 0,
  automation_level   text NOT NULL DEFAULT 'assisted'
                     CHECK (automation_level IN ('manual','assisted','auto')),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Seller credit buckets kept separate from real money.
CREATE TABLE IF NOT EXISTS public.credit_accounts (
  facility_id   uuid PRIMARY KEY REFERENCES public.facilities(id) ON DELETE CASCADE,
  ai_credits    integer NOT NULL DEFAULT 0,
  ad_credits    integer NOT NULL DEFAULT 0,
  credits_expire_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  bucket      text NOT NULL CHECK (bucket IN ('wallet','ai','ads','requests')),
  delta       integer NOT NULL,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_ledger_created_idx ON public.credit_ledger (created_at DESC);

-- 4. Bulk availability requests: constraints, AI answers and AI summary
ALTER TABLE public.demand_requests
  ADD COLUMN IF NOT EXISTS budget_max integer,
  ADD COLUMN IF NOT EXISTS variant text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_recommended_facility_id uuid REFERENCES public.facilities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_summary_at timestamptz,
  ADD COLUMN IF NOT EXISTS targeted_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.demand_responses
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'available'
    CHECK (kind IN ('available','partial','different_quantity','unavailable','alternative')),
  ADD COLUMN IF NOT EXISTS answered_by text NOT NULL DEFAULT 'seller'
    CHECK (answered_by IN ('seller','ai'));

-- 5. Unified search index — one row per searchable Omni object
CREATE TABLE IF NOT EXISTS public.search_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type   text NOT NULL CHECK (object_type IN ('facility','product','service','offer','image','video','article')),
  object_id     uuid NOT NULL,
  facility_id   uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  market_code   text NOT NULL DEFAULT 'TG-LOME',
  title         text NOT NULL,
  body          text,
  category      text,
  price         integer,
  discount_percent integer NOT NULL DEFAULT 0,
  available     boolean NOT NULL DEFAULT true,
  latitude      double precision,
  longitude     double precision,
  facility_status text,
  quality_score numeric(6,2) NOT NULL DEFAULT 0,
  media_url     text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  tsv           tsvector
);
CREATE UNIQUE INDEX IF NOT EXISTS search_documents_object_key
  ON public.search_documents (object_type, object_id);
CREATE INDEX IF NOT EXISTS search_documents_tsv_idx ON public.search_documents USING GIN (tsv);
CREATE INDEX IF NOT EXISTS search_documents_title_trgm_idx
  ON public.search_documents USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS search_documents_pos_idx
  ON public.search_documents (latitude, longitude);
CREATE INDEX IF NOT EXISTS search_documents_type_idx ON public.search_documents (object_type);

-- Lightweight accent folding without requiring the unaccent extension.
CREATE OR REPLACE FUNCTION public.unaccent_safe(input text) RETURNS text AS $$
  SELECT translate(lower(coalesce(input, '')),
    'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ',
    'aaaaaaceeeeiiiinooooouuuuyy');
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.search_documents_tsv() RETURNS trigger AS $$
BEGIN
  NEW.tsv :=
    setweight(to_tsvector('french', unaccent_safe(coalesce(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent_safe(coalesce(NEW.category, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent_safe(coalesce(NEW.body, ''))), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS search_documents_tsv_trg ON public.search_documents;
CREATE TRIGGER search_documents_tsv_trg
BEFORE INSERT OR UPDATE ON public.search_documents
FOR EACH ROW EXECUTE FUNCTION public.search_documents_tsv();

-- 6. Index synchronisation from the source tables
CREATE OR REPLACE FUNCTION public.reindex_facility(fid uuid) RETURNS void AS $$
BEGIN
  DELETE FROM public.search_documents WHERE facility_id = fid;

  INSERT INTO public.search_documents
    (object_type, object_id, facility_id, market_code, title, body, category,
     price, discount_percent, available, latitude, longitude, facility_status,
     quality_score, media_url)
  SELECT 'facility', f.id, f.id, f.market_code, f.name,
         concat_ws(' ', f.description, f.address, f.neighbourhood, f.category),
         f.category,
         (SELECT min(price) FROM public.products p WHERE p.facility_id = f.id AND p.in_stock),
         COALESCE((SELECT max(discount_percent) FROM public.products p WHERE p.facility_id = f.id), 0),
         f.is_online,
         f.latitude, f.longitude, f.status,
         CASE f.status WHEN 'confirmed' THEN 40 WHEN 'unconfirmed' THEN 25
              WHEN 'certified' THEN 20 WHEN 'uncertified' THEN 8 ELSE 2 END,
         (SELECT COALESCE(fm.thumb_url, fm.url) FROM public.facility_media fm
           WHERE fm.facility_id = f.id AND fm.kind = 'image'
           ORDER BY fm.position, fm.created_at LIMIT 1)
  FROM public.facilities f WHERE f.id = fid;

  INSERT INTO public.search_documents
    (object_type, object_id, facility_id, market_code, title, body, category,
     price, discount_percent, available, latitude, longitude, facility_status,
     quality_score, media_url)
  SELECT 'product', p.id, f.id, f.market_code, p.name,
         concat_ws(' ', f.name, f.category, f.neighbourhood),
         f.category, p.price, p.discount_percent, p.in_stock,
         f.latitude, f.longitude, f.status,
         CASE f.status WHEN 'confirmed' THEN 40 WHEN 'unconfirmed' THEN 25
              WHEN 'certified' THEN 20 WHEN 'uncertified' THEN 8 ELSE 2 END
         + LEAST(p.discount_percent, 40) * 0.2,
         p.photo_url
  FROM public.products p JOIN public.facilities f ON f.id = p.facility_id
  WHERE p.facility_id = fid;

  INSERT INTO public.search_documents
    (object_type, object_id, facility_id, market_code, title, body, category,
     price, discount_percent, available, latitude, longitude, facility_status, quality_score)
  SELECT 'offer', o.id, f.id, f.market_code, o.title,
         concat_ws(' ', o.description, f.name), f.category, NULL, o.discount_percent,
         (o.active_until IS NULL OR o.active_until > now()),
         f.latitude, f.longitude, f.status, 15 + LEAST(o.discount_percent, 40) * 0.3
  FROM public.offers o JOIN public.facilities f ON f.id = o.facility_id
  WHERE o.facility_id = fid;

  INSERT INTO public.search_documents
    (object_type, object_id, facility_id, market_code, title, body, category,
     available, latitude, longitude, facility_status, quality_score, media_url)
  SELECT CASE m.kind WHEN 'video' THEN 'video' ELSE 'image' END, m.id, f.id, f.market_code,
         concat_ws(' — ', f.name, f.category), f.description, f.category,
         true, f.latitude, f.longitude, f.status, 5, COALESCE(m.thumb_url, m.url)
  FROM public.facility_media m JOIN public.facilities f ON f.id = m.facility_id
  WHERE m.facility_id = fid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.reindex_from_row() RETURNS trigger AS $$
DECLARE fid uuid;
BEGIN
  IF TG_TABLE_NAME = 'facilities' THEN
    fid := COALESCE(NEW.id, OLD.id);
  ELSE
    fid := COALESCE(NEW.facility_id, OLD.facility_id);
  END IF;
  PERFORM public.reindex_facility(fid);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS facilities_reindex ON public.facilities;
CREATE TRIGGER facilities_reindex AFTER INSERT OR UPDATE OR DELETE ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.reindex_from_row();

DROP TRIGGER IF EXISTS products_reindex ON public.products;
CREATE TRIGGER products_reindex AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.reindex_from_row();

DROP TRIGGER IF EXISTS offers_reindex ON public.offers;
CREATE TRIGGER offers_reindex AFTER INSERT OR UPDATE OR DELETE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.reindex_from_row();

DROP TRIGGER IF EXISTS facility_media_reindex ON public.facility_media;
CREATE TRIGGER facility_media_reindex AFTER INSERT OR UPDATE OR DELETE ON public.facility_media
FOR EACH ROW EXECUTE FUNCTION public.reindex_from_row();

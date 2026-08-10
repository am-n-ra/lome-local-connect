-- Phase C — médias (photos vitrine, vidéos, galeries produits)

BEGIN;

CREATE TABLE IF NOT EXISTS public.facility_media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('image','video')),
  url         text NOT NULL,
  thumb_url   text,
  storage_key text,
  position    integer NOT NULL DEFAULT 0,
  bytes       integer,
  duration_s  integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS facility_media_facility_idx
  ON public.facility_media (facility_id, position ASC, created_at ASC);

CREATE TABLE IF NOT EXISTS public.product_media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         text NOT NULL,
  thumb_url   text,
  storage_key text,
  position    integer NOT NULL DEFAULT 0,
  bytes       integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_media_product_idx
  ON public.product_media (product_id, position ASC, created_at ASC);

COMMIT;

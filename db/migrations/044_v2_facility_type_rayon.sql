-- Omni V2 facility creation typed (NW-13c, D-B + D-F validated by founder 2026-09-10/11).
-- A seller-created facility must express 3 strict types (fixe / mobile / digital), a
-- discovery radius for mobile facilities, and a digital facility may have no physical point.
-- Additive only, idempotent, safe to re-run.

-- 1. Strict facility type (D-F(a): fixe / mobile / digital).

ALTER TABLE public.v2_facilities
  ADD COLUMN IF NOT EXISTS facility_type text CHECK (facility_type in ('fixe', 'mobile', 'digital'))
;
ALTER TABLE public.v2_facilities DROP CONSTRAINT IF EXISTS v2_facilities_facility_type_check;
ALTER TABLE public.v2_facilities ADD CONSTRAINT v2_facilities_facility_type_check
  CHECK (facility_type in ('fixe', 'mobile', 'digital'))
;
COMMENT ON COLUMN public.v2_facilities.facility_type IS
  'D-F(a): strict establishment type — fixe / mobile / digital. Seller-created facilities (NW-13c) set it; imports default null until claimed by an owner.';

-- 2. Discovery radius for mobile facilities (D-F: zone/rayon mobile).

ALTER TABLE public.v2_facilities
  ADD COLUMN IF NOT EXISTS rayon_km double precision
;
ALTER TABLE public.v2_facilities DROP CONSTRAINT IF EXISTS v2_facilities_rayon_km_check;
ALTER TABLE public.v2_facilities ADD CONSTRAINT v2_facilities_rayon_km_check
  CHECK (rayon_km is null or (rayon_km > 0 and rayon_km <= 500))
;
COMMENT ON COLUMN public.v2_facilities.rayon_km IS
  'D-F: service/discovery radius in km for mobile facilities; null for fixe/digital.';
CREATE INDEX IF NOT EXISTS v2_facilities_rayon_km_idx ON public.v2_facilities(rayon_km) WHERE rayon_km is not null;

-- 3. A digital facility has no physical point: coordinates become nullable.
--    (DROP NOT NULL is idempotent across re-runs; the CHECKs already permit null.)

ALTER TABLE public.v2_facilities ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE public.v2_facilities ALTER COLUMN longitude DROP NOT NULL;
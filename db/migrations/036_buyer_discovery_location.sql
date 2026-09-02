-- Omni V1 — server-resolved buyer discovery location.
-- Stores normalized city context on the profile; raw browser coordinates are not persisted.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS discovery_city text,
  ADD COLUMN IF NOT EXISTS discovery_country_code text,
  ADD COLUMN IF NOT EXISTS discovery_source text NOT NULL DEFAULT 'unresolved',
  ADD COLUMN IF NOT EXISTS discovery_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_discovery_city_idx
  ON public.profiles (lower(discovery_city));

CREATE TABLE IF NOT EXISTS public.discovery_location_cache (
  grid_key text PRIMARY KEY,
  city text,
  country_code text,
  display_name text,
  resolved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS discovery_location_cache_resolved_idx
  ON public.discovery_location_cache (resolved_at);

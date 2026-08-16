-- Omni global coverage: discovery is driven by visible map bounds, not one market.
-- Apply after the base schema. This migration is additive and safe to re-run.

INSERT INTO public.markets (
  market_code,
  country_name,
  currency_code,
  payment_provider,
  community_channel_type,
  community_channel_explanation,
  active
)
VALUES (
  'GLOBAL',
  'Global',
  'XOF',
  'manual',
  'none',
  'Global discovery context; local markets provide commerce and currency details.',
  true
)
ON CONFLICT (market_code) DO UPDATE SET
  country_name = EXCLUDED.country_name,
  active = true;

CREATE TABLE IF NOT EXISTS public.osm_tiles (
  tile_key       text PRIMARY KEY,
  zoom           integer NOT NULL CHECK (zoom >= 0 AND zoom <= 18),
  tile_x         integer NOT NULL,
  tile_y         integer NOT NULL,
  west           double precision NOT NULL,
  south          double precision NOT NULL,
  east           double precision NOT NULL,
  north          double precision NOT NULL,
  source         text NOT NULL DEFAULT 'overpass',
  status         text NOT NULL DEFAULT 'ready'
                 CHECK (status IN ('pending', 'ready', 'empty', 'failed')),
  fetched_at     timestamptz,
  expires_at     timestamptz,
  error_message  text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS osm_tiles_bounds_idx
  ON public.osm_tiles (zoom, tile_x, tile_y);
CREATE INDEX IF NOT EXISTS osm_tiles_expiry_idx
  ON public.osm_tiles (expires_at);

INSERT INTO public.facilities (
  market_code,
  name,
  category,
  description,
  address,
  neighbourhood,
  latitude,
  longitude,
  status,
  type,
  is_online,
  source,
  source_ref
)
SELECT
  'GLOBAL',
  'Global OSM discovery',
  'other',
  'Catch-all market for source-backed OpenStreetMap discovery.',
  NULL,
  NULL,
  0,
  0,
  'unclaimed',
  'fixe',
  true,
  'system',
  'system:global-discovery'
WHERE NOT EXISTS (
  SELECT 1 FROM public.facilities WHERE source = 'system' AND source_ref = 'system:global-discovery'
);

-- The system sentinel is not rendered as a facility; it only keeps deployments
-- that require a facility-market reference compatible with the global context.
DELETE FROM public.facilities
WHERE source = 'system' AND source_ref = 'system:global-discovery';

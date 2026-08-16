-- Global unclaimed coverage: a catch-all market for OSM imports outside Lomé
-- plus a per-tile cache so a viewport is only fetched from Overpass once.

INSERT INTO public.markets (
  market_code, country_name, name, currency_code, currency_symbol, currency_decimals,
  languages, payment_provider, active, default_lat, default_lng, default_zoom
)
VALUES (
  'GLOBAL', 'Monde', 'Monde', 'XOF', 'FCFA', 0,
  ARRAY['fr','en'], 'fedapay', false, 6.1725, 1.2314, 3
)
ON CONFLICT (market_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.osm_tiles (
  tile_key text PRIMARY KEY,
  min_lat double precision NOT NULL,
  min_lng double precision NOT NULL,
  max_lat double precision NOT NULL,
  max_lng double precision NOT NULL,
  facility_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'done',
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS osm_tiles_fetched_idx ON public.osm_tiles (fetched_at DESC);

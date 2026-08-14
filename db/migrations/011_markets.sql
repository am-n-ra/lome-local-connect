-- Lot 1 — Market entity completed: currency display, languages, map defaults.
-- The base table was created in 007; this migration only extends it.
ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS currency_symbol text NOT NULL DEFAULT 'FCFA',
  ADD COLUMN IF NOT EXISTS currency_decimals integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT ARRAY['fr', 'en'],
  ADD COLUMN IF NOT EXISTS default_lat double precision NOT NULL DEFAULT 6.1725,
  ADD COLUMN IF NOT EXISTS default_lng double precision NOT NULL DEFAULT 1.2314,
  ADD COLUMN IF NOT EXISTS default_zoom real NOT NULL DEFAULT 12.2;

UPDATE public.markets
SET name = COALESCE(name, 'Grand Lomé'),
    currency_symbol = 'FCFA',
    currency_decimals = 0,
    languages = ARRAY['fr', 'en', 'ee'],
    default_lat = 6.1725,
    default_lng = 1.2314,
    default_zoom = 12.2
WHERE market_code = 'TG-LOME';

CREATE INDEX IF NOT EXISTS facilities_market_idx ON public.facilities (market_code);
CREATE INDEX IF NOT EXISTS facilities_geo_idx ON public.facilities (latitude, longitude);

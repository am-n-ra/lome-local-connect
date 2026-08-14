-- Lot 1 — Market entity: every hard-coded "Togo / Lomé / FCFA" becomes a row.
CREATE TABLE IF NOT EXISTS public.markets (
  code text PRIMARY KEY,
  name text NOT NULL,
  country_code text NOT NULL,
  currency_code text NOT NULL,
  currency_symbol text NOT NULL,
  currency_decimals integer NOT NULL DEFAULT 0,
  payment_rail text NOT NULL DEFAULT 'fedapay',
  languages text[] NOT NULL DEFAULT ARRAY['fr', 'en'],
  community_channel_url text,
  community_channel_label text,
  default_lat double precision NOT NULL,
  default_lng double precision NOT NULL,
  default_zoom real NOT NULL DEFAULT 12.2,
  informal_certification boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.markets (
  code, name, country_code, currency_code, currency_symbol, currency_decimals,
  payment_rail, languages, community_channel_url, community_channel_label,
  default_lat, default_lng, default_zoom, informal_certification, is_active
) VALUES (
  'TG-LOME', 'Grand Lomé', 'TG', 'XOF', 'FCFA', 0,
  'fedapay', ARRAY['fr', 'en', 'ee'], 'https://chat.whatsapp.com/omniview-lome', 'Canal communautaire Lomé',
  6.1725, 1.2314, 12.2, true, true
)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS market_code text NOT NULL DEFAULT 'TG-LOME';

CREATE INDEX IF NOT EXISTS facilities_market_idx ON public.facilities (market_code);
CREATE INDEX IF NOT EXISTS facilities_geo_idx ON public.facilities (latitude, longitude);

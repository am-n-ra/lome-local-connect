-- Ensure TG-LOME market row exists (seed may not have run on all environments).
INSERT INTO public.markets (
  market_code, name, country_name, currency_code, currency_symbol, currency_decimals,
  payment_provider, default_platform_fee_percent, informal_certification_enabled,
  languages, default_lat, default_lng, default_zoom,
  community_channel_type, community_channel_url, community_channel_explanation
) VALUES (
  'TG-LOME', 'Grand Lomé', 'Togo', 'XOF', 'FCFA', 0,
  'fedapay', 2, true,
  ARRAY['fr', 'en', 'ee'], 6.1725, 1.2314, 12.2,
  'whatsapp', NULL,
  'Groupe WhatsApp de quartier pour les annonces de disponibilité en temps réel.'
)
ON CONFLICT (market_code) DO UPDATE
  SET name = EXCLUDED.name,
      currency_symbol = COALESCE(NULLIF(public.markets.currency_symbol, ''), EXCLUDED.currency_symbol),
      currency_decimals = EXCLUDED.currency_decimals,
      languages = EXCLUDED.languages,
      default_lat = EXCLUDED.default_lat,
      default_lng = EXCLUDED.default_lng,
      default_zoom = EXCLUDED.default_zoom;

-- Reference data. Safe to re-run.
INSERT INTO public.markets (
  market_code, country_name, currency_code, payment_provider,
  default_platform_fee_percent, informal_certification_enabled,
  community_channel_type, community_channel_url, community_channel_explanation
) VALUES (
  'TG-LOME', 'Togo', 'XOF', 'fedapay', 2, true,
  'whatsapp', NULL,
  'Groupe WhatsApp de quartier pour les annonces de disponibilité en temps réel.'
)
ON CONFLICT (market_code) DO UPDATE
  SET country_name = EXCLUDED.country_name,
      currency_code = EXCLUDED.currency_code,
      payment_provider = EXCLUDED.payment_provider;

-- Mirror every existing Neon Auth user into public.profiles.
INSERT INTO public.profiles (id, name, email)
SELECT u.id, COALESCE(u.name, ''), u.email
FROM neon_auth."user" u
ON CONFLICT (id) DO NOTHING;

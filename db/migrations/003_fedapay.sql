-- Phase 3 — FedaPay wallet deposits (card + mobile money)

CREATE TABLE IF NOT EXISTS public.wallet_deposits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id     uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id         text NOT NULL,
  amount          integer NOT NULL CHECK (amount > 0),
  currency        text NOT NULL DEFAULT 'XOF',
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','declined','canceled')),
  provider        text NOT NULL DEFAULT 'fedapay',
  provider_txn_id text,
  checkout_url    text,
  credited_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_deposits_facility_idx ON public.wallet_deposits(facility_id);
CREATE UNIQUE INDEX IF NOT EXISTS wallet_deposits_provider_txn_idx
  ON public.wallet_deposits(provider_txn_id) WHERE provider_txn_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.fedapay_webhook_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     text UNIQUE,
  event_name   text,
  payload      jsonb,
  received_at  timestamptz NOT NULL DEFAULT now()
);

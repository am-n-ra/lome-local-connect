-- Omni financial hardening: additive multi-bucket ledger.
-- Source of truth after rollout: wallet_ledger_entries. Legacy columns remain readable during migration.

CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  facility_id uuid REFERENCES public.facilities(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'XOF' CHECK (currency IN ('XOF')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((user_id IS NOT NULL) <> (facility_id IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS wallet_accounts_user_currency_idx
  ON public.wallet_accounts (user_id, currency) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS wallet_accounts_facility_currency_idx
  ON public.wallet_accounts (facility_id, currency) WHERE facility_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.wallet_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.wallet_accounts(id) ON DELETE RESTRICT,
  bucket text NOT NULL CHECK (bucket IN ('wallet', 'payout', 'ad_credit', 'coupon_credit', 'pro_credit')),
  amount bigint NOT NULL CHECK (amount <> 0),
  currency text NOT NULL DEFAULT 'XOF' CHECK (currency IN ('XOF')),
  reference_type text NOT NULL,
  reference_id text,
  idempotency_key text NOT NULL,
  journal_id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('pending', 'posted', 'reversed')),
  available_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id text,
  source text NOT NULL DEFAULT 'system',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS wallet_ledger_account_bucket_created_idx
  ON public.wallet_ledger_entries (account_id, bucket, created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_ledger_reference_idx
  ON public.wallet_ledger_entries (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS wallet_ledger_journal_idx
  ON public.wallet_ledger_entries (journal_id);

CREATE TABLE IF NOT EXISTS public.wallet_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.wallet_accounts(id) ON DELETE RESTRICT,
  from_bucket text NOT NULL CHECK (from_bucket IN ('wallet', 'payout', 'ad_credit', 'coupon_credit', 'pro_credit')),
  to_bucket text NOT NULL CHECK (to_bucket IN ('wallet', 'payout', 'ad_credit', 'coupon_credit', 'pro_credit')),
  amount bigint NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'XOF' CHECK (currency IN ('XOF')),
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('pending', 'posted', 'reversed')),
  actor_user_id text,
  source text NOT NULL DEFAULT 'system',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_bucket <> to_bucket)
);

CREATE TABLE IF NOT EXISTS public.wallet_balance_snapshots (
  account_id uuid NOT NULL REFERENCES public.wallet_accounts(id) ON DELETE CASCADE,
  bucket text NOT NULL CHECK (bucket IN ('wallet', 'payout', 'ad_credit', 'coupon_credit', 'pro_credit')),
  currency text NOT NULL DEFAULT 'XOF' CHECK (currency IN ('XOF')),
  available_amount bigint NOT NULL DEFAULT 0 CHECK (available_amount >= 0),
  reserved_amount bigint NOT NULL DEFAULT 0 CHECK (reserved_amount >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, bucket, currency)
);

ALTER TABLE public.wallet_deposits
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS normalized_status text,
  ADD COLUMN IF NOT EXISTS last_reconciled_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS wallet_deposits_account_idempotency_idx
  ON public.wallet_deposits (facility_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Idempotently create facility accounts and preserve the current wallet value as one opening entry.
INSERT INTO public.wallet_accounts (facility_id, currency)
SELECT s.facility_id, 'XOF'
FROM public.subscriptions s
ON CONFLICT DO NOTHING;

INSERT INTO public.wallet_ledger_entries
  (account_id, bucket, amount, currency, reference_type, reference_id, idempotency_key, source, metadata)
SELECT wa.id, 'wallet', s.wallet_balance::bigint, 'XOF', 'legacy_subscription_opening', s.facility_id::text,
       'legacy_subscription_opening:' || s.facility_id::text, 'migration', jsonb_build_object('legacy_table', 'subscriptions')
FROM public.subscriptions s
JOIN public.wallet_accounts wa ON wa.facility_id = s.facility_id AND wa.currency = 'XOF'
WHERE s.wallet_balance > 0
ON CONFLICT (account_id, idempotency_key) DO NOTHING;

INSERT INTO public.wallet_balance_snapshots (account_id, bucket, currency, available_amount)
SELECT wa.id, 'wallet', 'XOF', GREATEST(s.wallet_balance::bigint, 0)
FROM public.subscriptions s
JOIN public.wallet_accounts wa ON wa.facility_id = s.facility_id AND wa.currency = 'XOF'
ON CONFLICT (account_id, bucket, currency) DO UPDATE
SET available_amount = EXCLUDED.available_amount, updated_at = now();

CREATE OR REPLACE FUNCTION public.omni_ensure_wallet_account(
  p_user_id text DEFAULT NULL,
  p_facility_id uuid DEFAULT NULL,
  p_currency text DEFAULT 'XOF'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE v_id uuid;
BEGIN
  IF (p_user_id IS NULL) = (p_facility_id IS NULL) THEN
    RAISE EXCEPTION 'exactly one wallet owner is required';
  END IF;
  IF p_user_id IS NOT NULL THEN
    INSERT INTO public.wallet_accounts (user_id, currency) VALUES (p_user_id, p_currency)
    ON CONFLICT (user_id, currency) WHERE user_id IS NOT NULL DO UPDATE SET updated_at = now()
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.wallet_accounts (facility_id, currency) VALUES (p_facility_id, p_currency)
    ON CONFLICT (facility_id, currency) WHERE facility_id IS NOT NULL DO UPDATE SET updated_at = now()
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.omni_rebuild_wallet_snapshot(p_account_id uuid, p_bucket text)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE v_amount bigint;
BEGIN
  SELECT COALESCE(SUM(e.amount), 0)::bigint INTO v_amount
  FROM public.wallet_ledger_entries e
  WHERE e.account_id = p_account_id AND e.bucket = p_bucket
    AND e.status = 'posted' AND e.available_at <= now();
  INSERT INTO public.wallet_balance_snapshots (account_id, bucket, currency, available_amount, updated_at)
  VALUES (p_account_id, p_bucket, 'XOF', GREATEST(v_amount, 0), now())
  ON CONFLICT (account_id, bucket, currency) DO UPDATE
    SET available_amount = EXCLUDED.available_amount, updated_at = now();
  RETURN v_amount;
END;
$$;

COMMENT ON TABLE public.wallet_ledger_entries IS 'Append-only financial journal. Never update or delete posted entries - reverse with a compensating entry.';
COMMENT ON TABLE public.wallet_transfers IS 'Atomic logical transfers between non-cash or cash buckets; paired journal entries share journal_id.';
COMMENT ON TABLE public.wallet_balance_snapshots IS 'Rebuildable projection for fast UI reads; ledger remains the source of truth.';

CREATE OR REPLACE FUNCTION public.omni_append_wallet_entry(
  p_account_id uuid,
  p_bucket text,
  p_amount bigint,
  p_reference_type text,
  p_reference_id text,
  p_idempotency_key text,
  p_actor_user_id text DEFAULT NULL,
  p_source text DEFAULT 'system',
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_available_at timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
  v_existing public.wallet_ledger_entries%ROWTYPE;
BEGIN
  IF p_amount = 0 THEN RAISE EXCEPTION 'ledger amount cannot be zero'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_account_id::text || ':' || p_bucket, 0));
  INSERT INTO public.wallet_ledger_entries
    (account_id, bucket, amount, currency, reference_type, reference_id, idempotency_key,
     actor_user_id, source, metadata, available_at)
  VALUES
    (p_account_id, p_bucket, p_amount, 'XOF', p_reference_type, p_reference_id, p_idempotency_key,
     p_actor_user_id, p_source, COALESCE(p_metadata, '{}'::jsonb), p_available_at)
  ON CONFLICT (account_id, idempotency_key) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT * INTO v_existing FROM public.wallet_ledger_entries
    WHERE account_id = p_account_id AND idempotency_key = p_idempotency_key;
    IF v_existing.amount <> p_amount OR v_existing.bucket <> p_bucket OR v_existing.reference_type <> p_reference_type THEN
      RAISE EXCEPTION 'idempotency key conflicts with an existing ledger entry';
    END IF;
    RETURN v_existing.id;
  END IF;
  PERFORM public.omni_rebuild_wallet_snapshot(p_account_id, p_bucket);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.omni_transfer_wallet_buckets(
  p_account_id uuid,
  p_from_bucket text,
  p_to_bucket text,
  p_amount bigint,
  p_idempotency_key text,
  p_actor_user_id text DEFAULT NULL,
  p_source text DEFAULT 'system',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_transfer_id uuid;
  v_journal_id uuid := gen_random_uuid();
  v_available bigint;
BEGIN
  IF p_amount <= 0 OR p_from_bucket = p_to_bucket THEN
    RAISE EXCEPTION 'invalid wallet transfer';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_account_id::text, 0));
  SELECT available_amount INTO v_available
  FROM public.wallet_balance_snapshots
  WHERE account_id = p_account_id AND bucket = p_from_bucket AND currency = 'XOF'
  FOR UPDATE;
  IF COALESCE(v_available, 0) < p_amount THEN
    PERFORM public.omni_rebuild_wallet_snapshot(p_account_id, p_from_bucket);
    SELECT available_amount INTO v_available
    FROM public.wallet_balance_snapshots
    WHERE account_id = p_account_id AND bucket = p_from_bucket AND currency = 'XOF'
    FOR UPDATE;
  END IF;
  IF COALESCE(v_available, 0) < p_amount THEN RAISE EXCEPTION 'insufficient wallet balance'; END IF;

  INSERT INTO public.wallet_transfers
    (account_id, from_bucket, to_bucket, amount, currency, idempotency_key, actor_user_id, source, metadata)
  VALUES (p_account_id, p_from_bucket, p_to_bucket, p_amount, 'XOF', p_idempotency_key, p_actor_user_id, p_source, COALESCE(p_metadata, '{}'::jsonb))
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_transfer_id;
  IF v_transfer_id IS NULL THEN
    SELECT id INTO v_transfer_id FROM public.wallet_transfers WHERE idempotency_key = p_idempotency_key;
    RETURN v_transfer_id;
  END IF;

  INSERT INTO public.wallet_ledger_entries
    (account_id, bucket, amount, currency, reference_type, reference_id, idempotency_key, journal_id, actor_user_id, source, metadata)
  VALUES
    (p_account_id, p_from_bucket, -p_amount, 'XOF', 'bucket_transfer', v_transfer_id::text, p_idempotency_key || ':debit', v_journal_id, p_actor_user_id, p_source, COALESCE(p_metadata, '{}'::jsonb)),
    (p_account_id, p_to_bucket, p_amount, 'XOF', 'bucket_transfer', v_transfer_id::text, p_idempotency_key || ':credit', v_journal_id, p_actor_user_id, p_source, COALESCE(p_metadata, '{}'::jsonb));
  PERFORM public.omni_rebuild_wallet_snapshot(p_account_id, p_from_bucket);
  PERFORM public.omni_rebuild_wallet_snapshot(p_account_id, p_to_bucket);
  RETURN v_transfer_id;
END;
$$;

-- Ensure every account has an explicit zero projection for every supported bucket.
INSERT INTO public.wallet_balance_snapshots (account_id, bucket, currency, available_amount, reserved_amount)
SELECT wa.id, b.bucket, 'XOF', 0, 0
FROM public.wallet_accounts wa
CROSS JOIN (VALUES ('wallet'), ('payout'), ('ad_credit'), ('coupon_credit'), ('pro_credit')) AS b(bucket)
ON CONFLICT (account_id, bucket, currency) DO NOTHING;

-- Preserve legacy payout balances as opening entries in the payout bucket.
INSERT INTO public.wallet_ledger_entries
  (account_id, bucket, amount, currency, reference_type, reference_id, idempotency_key, source, metadata)
SELECT wa.id, 'payout', s.payout_balance::bigint, 'XOF', 'legacy_subscription_payout_opening', s.facility_id::text,
       'legacy_subscription_payout_opening:' || s.facility_id::text, 'migration', jsonb_build_object('legacy_table', 'subscriptions')
FROM public.subscriptions s
JOIN public.wallet_accounts wa ON wa.facility_id = s.facility_id AND wa.currency = 'XOF'
WHERE s.payout_balance > 0
ON CONFLICT (account_id, idempotency_key) DO NOTHING;

INSERT INTO public.wallet_balance_snapshots (account_id, bucket, currency, available_amount)
SELECT wa.id, 'payout', 'XOF', GREATEST(s.payout_balance::bigint, 0)
FROM public.subscriptions s
JOIN public.wallet_accounts wa ON wa.facility_id = s.facility_id AND wa.currency = 'XOF'
ON CONFLICT (account_id, bucket, currency) DO UPDATE
SET available_amount = EXCLUDED.available_amount, updated_at = now();

-- Consume a bucket atomically for ad, coupon or Pro usage.
CREATE OR REPLACE FUNCTION public.omni_consume_wallet_bucket(
  p_account_id uuid,
  p_bucket text,
  p_amount bigint,
  p_reference_type text,
  p_reference_id text,
  p_idempotency_key text,
  p_actor_user_id text DEFAULT NULL,
  p_source text DEFAULT 'system',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
  v_existing public.wallet_ledger_entries%ROWTYPE;
  v_available bigint;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'wallet consumption amount must be positive'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_account_id::text || ':' || p_bucket, 0));
  PERFORM public.omni_rebuild_wallet_snapshot(p_account_id, p_bucket);
  SELECT available_amount INTO v_available
  FROM public.wallet_balance_snapshots
  WHERE account_id = p_account_id AND bucket = p_bucket AND currency = 'XOF'
  FOR UPDATE;
  IF COALESCE(v_available, 0) < p_amount THEN RAISE EXCEPTION 'insufficient wallet balance'; END IF;
  INSERT INTO public.wallet_ledger_entries
    (account_id, bucket, amount, currency, reference_type, reference_id, idempotency_key,
     actor_user_id, source, metadata)
  VALUES
    (p_account_id, p_bucket, -p_amount, 'XOF', p_reference_type, p_reference_id, p_idempotency_key,
     p_actor_user_id, p_source, COALESCE(p_metadata, '{}'::jsonb))
  ON CONFLICT (account_id, idempotency_key) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    SELECT * INTO v_existing FROM public.wallet_ledger_entries
    WHERE account_id = p_account_id AND idempotency_key = p_idempotency_key;
    IF v_existing.amount <> -p_amount OR v_existing.bucket <> p_bucket THEN
      RAISE EXCEPTION 'idempotency key conflicts with an existing consumption';
    END IF;
    RETURN v_existing.id;
  END IF;
  PERFORM public.omni_rebuild_wallet_snapshot(p_account_id, p_bucket);
  RETURN v_id;
END;
$$;

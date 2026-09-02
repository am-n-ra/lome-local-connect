-- Omni platform expansion: facility audit trail, segmented balances and unlockers.

CREATE TABLE IF NOT EXISTS public.facility_state_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  evidence_type text,
  evidence_ref text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS facility_state_events_facility_created_idx
  ON public.facility_state_events (facility_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.omni_record_facility_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  actor uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    BEGIN
      actor := NULLIF(current_setting('app.actor_id', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
      actor := NULL;
    END;
    INSERT INTO public.facility_state_events
      (facility_id, from_status, to_status, actor_id, reason, metadata)
    VALUES
      (NEW.id, OLD.status, NEW.status, actor, 'facility_status_changed', jsonb_build_object('source', 'database_trigger'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS facilities_status_audit_trigger ON public.facilities;
CREATE TRIGGER facilities_status_audit_trigger
AFTER UPDATE OF status ON public.facilities
FOR EACH ROW
EXECUTE FUNCTION public.omni_record_facility_status_change();

CREATE TABLE IF NOT EXISTS public.balance_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  bucket text NOT NULL CHECK (bucket IN ('wallet', 'payout', 'ad_credit', 'coupon_budget', 'pro_test_credit')),
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  reference_type text,
  reference_id text,
  idempotency_key text UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS balance_ledger_facility_bucket_created_idx
  ON public.balance_ledger (facility_id, bucket, created_at DESC);

CREATE TABLE IF NOT EXISTS public.seller_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  unlock_type text NOT NULL CHECK (unlock_type IN ('pro_test_credit_20_usd', 'certified_tools', 'visibility_boost')),
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'eligible', 'granted', 'expired', 'revoked')),
  qualifying_count integer NOT NULL DEFAULT 0,
  required_count integer NOT NULL DEFAULT 3,
  granted_at timestamptz,
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facility_id, unlock_type)
);

CREATE INDEX IF NOT EXISTS seller_unlocks_facility_status_idx
  ON public.seller_unlocks (facility_id, status);

INSERT INTO public.seller_unlocks (facility_id, unlock_type, status, qualifying_count, required_count)
SELECT f.id, 'pro_test_credit_20_usd', 'locked', 0, 3
FROM public.facilities f
ON CONFLICT (facility_id, unlock_type) DO NOTHING;

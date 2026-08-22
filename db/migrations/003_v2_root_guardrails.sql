-- Omni V2 Root guardrails. Additive only; apply first on a disposable branch.
-- This migration does not remove, rewrite or backfill existing user/business records.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'v2_availability_scope_nonempty'
      AND conrelid = 'public.v2_availability_requests'::regclass
  ) THEN
    ALTER TABLE public.v2_availability_requests
      ADD CONSTRAINT v2_availability_scope_nonempty
      CHECK (cardinality(facility_scope) > 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.v2_guard_facility_company_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  company_account_id uuid;
BEGIN
  IF NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT account_id INTO company_account_id
  FROM public.v2_companies
  WHERE id = NEW.company_id;

  IF company_account_id IS NULL OR NEW.account_id IS DISTINCT FROM company_account_id THEN
    RAISE EXCEPTION 'facility company ownership mismatch' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'v2_facilities_company_owner_guard'
      AND tgrelid = 'public.v2_facilities'::regclass
  ) THEN
    CREATE TRIGGER v2_facilities_company_owner_guard
      BEFORE INSERT OR UPDATE OF account_id, company_id ON public.v2_facilities
      FOR EACH ROW EXECUTE FUNCTION public.v2_guard_facility_company_owner();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.v2_guard_availability_scope_product()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  product_facility_id uuid;
BEGIN
  SELECT facility_id INTO product_facility_id
  FROM public.v2_products
  WHERE id = NEW.product_id;

  IF product_facility_id IS NULL OR NOT (product_facility_id = ANY(NEW.facility_scope)) THEN
    RAISE EXCEPTION 'availability scope must contain the selected product facility' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'v2_availability_scope_product_guard'
      AND tgrelid = 'public.v2_availability_requests'::regclass
  ) THEN
    CREATE TRIGGER v2_availability_scope_product_guard
      BEFORE INSERT OR UPDATE OF product_id, facility_scope ON public.v2_availability_requests
      FOR EACH ROW EXECUTE FUNCTION public.v2_guard_availability_scope_product();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.v2_guard_availability_response_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  request_scope uuid[];
BEGIN
  SELECT facility_scope INTO request_scope
  FROM public.v2_availability_requests
  WHERE id = NEW.request_id;

  IF request_scope IS NULL OR NOT (NEW.facility_id = ANY(request_scope)) THEN
    RAISE EXCEPTION 'availability response facility is outside request scope' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'v2_availability_response_scope_guard'
      AND tgrelid = 'public.v2_availability_responses'::regclass
  ) THEN
    CREATE TRIGGER v2_availability_response_scope_guard
      BEFORE INSERT OR UPDATE OF request_id, facility_id ON public.v2_availability_responses
      FOR EACH ROW EXECUTE FUNCTION public.v2_guard_availability_response_scope();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.v2_guard_intent_authority()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  request_buyer_id uuid;
  response_status text;
BEGIN
  SELECT r.buyer_account_id, ar.status
  INTO request_buyer_id, response_status
  FROM public.v2_availability_responses ar
  JOIN public.v2_availability_requests r ON r.id = ar.request_id
  WHERE ar.id = NEW.response_id;

  IF request_buyer_id IS NULL OR NEW.buyer_account_id IS DISTINCT FROM request_buyer_id THEN
    RAISE EXCEPTION 'purchase intent buyer does not own availability request' USING ERRCODE = '23514';
  END IF;
  IF response_status NOT IN ('available', 'partial', 'corrected') THEN
    RAISE EXCEPTION 'purchase intent requires an eligible availability response' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'v2_purchase_intent_authority_guard'
      AND tgrelid = 'public.v2_purchase_intents'::regclass
  ) THEN
    CREATE TRIGGER v2_purchase_intent_authority_guard
      BEFORE INSERT OR UPDATE OF buyer_account_id, response_id ON public.v2_purchase_intents
      FOR EACH ROW EXECUTE FUNCTION public.v2_guard_intent_authority();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.v2_reject_append_only_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only' USING ERRCODE = '55000';
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'v2_wallet_ledger_append_only_guard'
      AND tgrelid = 'public.v2_wallet_ledger_entries'::regclass
  ) THEN
    CREATE TRIGGER v2_wallet_ledger_append_only_guard
      BEFORE UPDATE OR DELETE ON public.v2_wallet_ledger_entries
      FOR EACH ROW EXECUTE FUNCTION public.v2_reject_append_only_mutation();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'v2_transaction_snapshots_append_only_guard'
      AND tgrelid = 'public.v2_transaction_snapshots'::regclass
  ) THEN
    CREATE TRIGGER v2_transaction_snapshots_append_only_guard
      BEFORE UPDATE OR DELETE ON public.v2_transaction_snapshots
      FOR EACH ROW EXECUTE FUNCTION public.v2_reject_append_only_mutation();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'v2_transaction_events_append_only_guard'
      AND tgrelid = 'public.v2_transaction_events'::regclass
  ) THEN
    CREATE TRIGGER v2_transaction_events_append_only_guard
      BEFORE UPDATE OR DELETE ON public.v2_transaction_events
      FOR EACH ROW EXECUTE FUNCTION public.v2_reject_append_only_mutation();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'v2_qr_verified_replay_consistency'
      AND conrelid = 'public.v2_qr_tokens'::regclass
  ) THEN
    ALTER TABLE public.v2_qr_tokens
      ADD CONSTRAINT v2_qr_verified_replay_consistency
      CHECK ((verified_at IS NULL AND replay_count = 0) OR (verified_at IS NOT NULL AND replay_count > 0)) NOT VALID;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.v2_verify_qr_token(
  p_transaction_id uuid,
  p_token_hash text,
  p_now timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE public.v2_qr_tokens
  SET verified_at = p_now,
      replay_count = replay_count + 1
  WHERE transaction_id = p_transaction_id
    AND token_hash = p_token_hash
    AND verified_at IS NULL
    AND replay_count = 0
    AND expires_at > p_now;
  RETURN FOUND;
END;
$$;

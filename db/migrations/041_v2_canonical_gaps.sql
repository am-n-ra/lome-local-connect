-- Omni V2 Canonical gap closure. Additive only, idempotent. Consolidates every versioned v2 object verified missing from persistent omni-v2-rebuild branch on 2026-09-08. --
-- ===== 008 web push =====
-- Functional Foundation: durable Web Push subscription registry.
-- Additive only. Delivery/provider configuration remains a separate gate.
create table if not exists v2_web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references v2_accounts(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  permission_state text not null default 'granted' check (permission_state in ('granted', 'revoked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (account_id, endpoint),
  check ((permission_state = 'granted' and revoked_at is null) or (permission_state = 'revoked' and revoked_at is not null))
);
create index if not exists v2_web_push_subscriptions_active_idx
  on v2_web_push_subscriptions(account_id, last_seen_at desc)
  where permission_state = 'granted' and revoked_at is null;
-- Endpoint and key material are private account-scoped credentials. No public route exposes them.
-- ===== 011 transaction messages =====
-- Transactional chat: messages are private to the Buyer/Seller members of one transaction.
create table if not exists v2_transaction_messages (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references v2_transaction_snapshots(transaction_id) on delete cascade,
  sender_account_id uuid not null references v2_accounts(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  seen_at timestamptz
);

create index if not exists v2_transaction_messages_thread_idx
  on v2_transaction_messages(transaction_id, created_at, id);

create unique index if not exists v2_transaction_messages_idempotency_idx
  on v2_transaction_messages(transaction_id, sender_account_id, id)
  where id is not null;
-- ===== 001 slots guard index =====
create unique index if not exists v2_one_free_slot_per_account
  on v2_facility_slots(account_id) where source = 'free';
-- ===== 007 claims uniqueness index =====
create unique index if not exists v2_one_active_claim_per_facility
  on public.v2_verification_requests(facility_id)
  where state in ('draft', 'submitted', 'admin_review', 'needs_more_evidence');
-- ===== 009 offer/entitlement guards =====
create index if not exists v2_products_active_offer_idx
  on v2_products(facility_id, publication_state, offer_valid_until);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'v2_products_discount_kind_guard'
  ) THEN
    ALTER TABLE v2_products ADD CONSTRAINT v2_products_discount_kind_guard
      CHECK (discount_kind IS NULL OR discount_kind IN ('percentage', 'fixed'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'v2_products_discount_value_guard'
  ) THEN
    ALTER TABLE v2_products ADD CONSTRAINT v2_products_discount_value_guard
      CHECK (discount_value_minor IS NULL OR discount_value_minor > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'v2_products_offer_window_guard'
  ) THEN
    ALTER TABLE v2_products ADD CONSTRAINT v2_products_offer_window_guard
      CHECK (offer_valid_until IS NULL OR offer_valid_from IS NULL OR offer_valid_until > offer_valid_from);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'v2_facility_entitlements_price_guard'
  ) THEN
    ALTER TABLE v2_facility_entitlements ADD CONSTRAINT v2_facility_entitlements_price_guard
      CHECK (price_minor IS NULL OR price_minor > 0);
  END IF;
END $$;
-- ===== 003 root guardrails =====
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
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME USING ERRCODE = '55000';
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

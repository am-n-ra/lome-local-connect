-- Omni V2 buyer Pro entitlement + wallet kind (P3 NW-13h, decision D-K / arbitration default a).
-- D-K locked: Acheteur Pro maintenant — 2 500 XOF/mois via wallet v2,
-- entitlement 30 j, favoris persistants, comparateur Free=1 / Pro=5,
-- credits bulk plan pro ≈100 (v2_buyer_credit_accounts.monthly_quota).
-- Arbitration default (a): activation = paiement wallet veridique
-- (nouveau kind buyer_pro_spend) + entitlement buyer-pro 30 j;
-- opt-out/rappel symétrique au seller Pro (NW-13g, v2_facility_entitlements.renewal_opt_in).
--
-- Choix de modélisation: les entitles sont historiquement scopes par FACILITY
-- (v2_facility_entitlements.facility_id NOT NULL, kind facility_pro). Le Pro
-- acheteur est un entitlement COMPTE. Plutôt que détourner la table facility,
-- on crée v2_buyer_pro_entitlements (account_id, 30 j, price, currency,
-- renewal_opt_in) — même philosophie de rafraîchissement/opt-out que NW-13g.
-- Additive only, idempotent, safe to re-run.

-- 1. Allow buyer_pro_spend in the wallet ledger kind guard.
--    The original CHECK already exists on canonical with the old kind list, so we
--    replace it only when the new kind is absent (idempotent, additive).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conname = 'v2_wallet_ledger_entries_kind_check'
      AND c.conrelid = 'public.v2_wallet_ledger_entries'::regclass
      AND pg_get_constraintdef(c.oid) LIKE '%buyer_pro_spend%'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'v2_wallet_ledger_entries_kind_check'
        AND conrelid = 'public.v2_wallet_ledger_entries'::regclass
    ) THEN
      ALTER TABLE public.v2_wallet_ledger_entries DROP CONSTRAINT v2_wallet_ledger_entries_kind_check;
    END IF;
    ALTER TABLE public.v2_wallet_ledger_entries ADD CONSTRAINT v2_wallet_ledger_entries_kind_check
      CHECK (kind IN ('recharge', 'slot_spend', 'facility_pro_spend', 'ad_spend', 'coupon_credit', 'bonus_grant', 'bonus_spend', 'buyer_pro_spend', 'reversal'));
  END IF;
END $$;

-- 2. Buyer Pro entitlements (account-scoped, mirror of facility-scoped seller Pro).
CREATE TABLE IF NOT EXISTS public.v2_buyer_pro_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'expired', 'revoked')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  source text NOT NULL DEFAULT 'wallet' CHECK (source IN ('wallet', 'manual', 'promotion')),
  price_minor integer CHECK (price_minor IS NULL OR price_minor > 0),
  billing_currency text NOT NULL DEFAULT 'XOF',
  renewal_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT v2_buyer_pro_entitlements_account_fkey
    FOREIGN KEY (account_id) REFERENCES public.v2_accounts (id) ON DELETE CASCADE,
  CONSTRAINT v2_buyer_pro_entitlements_window_guard
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS v2_buyer_pro_entitlements_account_state_idx
  ON public.v2_buyer_pro_entitlements (account_id, state, ends_at DESC);
COMMENT ON TABLE public.v2_buyer_pro_entitlements IS
  'D-K NW-13h: buyer account Pro entitlement (30j) paid from wallet kind buyer_pro_spend. Mirrors seller facility_pro semantics; opt-out/rappel like NW-13g.';

-- 3. Audit of buyer Pro renewal runs (same observability as seller renewal runs NW-13g).
CREATE TABLE IF NOT EXISTS public.v2_buyer_pro_renewal_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  prior_entitlement_id uuid,
  new_entitlement_id uuid,
  spend_ledger_entry_id uuid,
  run_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('succeeded', 'insufficient_funds', 'skipped', 'failed')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT v2_buyer_pro_renewal_runs_account_fkey
    FOREIGN KEY (account_id) REFERENCES public.v2_accounts (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS v2_buyer_pro_renewal_runs_account_idx
  ON public.v2_buyer_pro_renewal_runs (account_id, run_at DESC);
COMMENT ON TABLE public.v2_buyer_pro_renewal_runs IS
  'D-K NW-13h: audit of buyer Pro renewal attempts. succeeded = new 30d entitlement + buyer_pro_spend; insufficient_funds = opt-in but wallet below price; skipped = no opt-in or still active; failed = unexpected error.';

-- 4. Relational guard between the entitlement ledger spend and the run audit:
--    the renewal run must always point at a real wallet spend ledger entry.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'v2_buyer_pro_renewal_runs_spend_fkey'
  ) THEN
    ALTER TABLE public.v2_buyer_pro_renewal_runs ADD CONSTRAINT v2_buyer_pro_renewal_runs_spend_fkey
      FOREIGN KEY (spend_ledger_entry_id) REFERENCES public.v2_wallet_ledger_entries (id) ON DELETE SET NULL;
  END IF;
END $$;
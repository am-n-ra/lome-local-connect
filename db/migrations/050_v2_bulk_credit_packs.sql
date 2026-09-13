-- Omni V2 bulk credit packs (P1 NW-13i, decision D-J pending).
-- D-J price of bulk packs is NOT founder-locked yet ("packs bulk à fixer"). This
-- migration only builds the MECHANISM: a recharge intent can be tagged as a pack
-- purchase, and a successful (confirmed) pack recharge grants extra bulk credits.
-- The price table lives in code (src/domain/pricing.ts BULK_PACKS, hypothesis).
-- Additive only, idempotent, safe to re-run.

-- 1. Recharge intents: distinguish a plain Wallet top-up from a bulk-credit pack purchase.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'v2_wallet_recharge_intents' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE public.v2_wallet_recharge_intents
      ADD COLUMN purpose text NOT NULL DEFAULT 'wallet'
      CHECK (purpose IN ('wallet', 'pack'));
    COMMENT ON COLUMN public.v2_wallet_recharge_intents.purpose IS
      'NW-13i: wallet = plain top-up; pack = bulk-credit pack purchase (grants extra_credits on confirmation).';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'v2_wallet_recharge_intents' AND column_name = 'pack_credits'
  ) THEN
    ALTER TABLE public.v2_wallet_recharge_intents
      ADD COLUMN pack_credits integer
      CHECK (pack_credits IS NULL OR pack_credits > 0);
    COMMENT ON COLUMN public.v2_wallet_recharge_intents.pack_credits IS
      'NW-13i: bulk credits granted on confirmation when purpose = pack. Null otherwise.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conname = 'v2_wallet_recharge_intents_pack_purpose_check'
      AND c.conrelid = 'public.v2_wallet_recharge_intents'::regclass
  ) THEN
    ALTER TABLE public.v2_wallet_recharge_intents
      ADD CONSTRAINT v2_wallet_recharge_intents_pack_purpose_check
      CHECK (purpose <> 'pack' OR pack_credits IS NOT NULL);
  END IF;
END $$;

-- 2. Credit ledger: attribute a pack credit to its recharge intent so a replayed
--    webhook can never double-grant the surplus. Unique on intent id.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'v2_availability_credit_ledger' AND column_name = 'recharge_intent_id'
  ) THEN
    ALTER TABLE public.v2_availability_credit_ledger
      ADD COLUMN recharge_intent_id uuid;
    COMMENT ON COLUMN public.v2_availability_credit_ledger.recharge_intent_id IS
      'NW-13i: recharge intent that funded this pack credit; unique for idempotent webhook replay.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conname = 'v2_availability_credit_ledger_recharge_unique'
      AND c.conrelid = 'public.v2_availability_credit_ledger'::regclass
  ) THEN
    ALTER TABLE public.v2_availability_credit_ledger
      ADD CONSTRAINT v2_availability_credit_ledger_recharge_unique UNIQUE (recharge_intent_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conname = 'v2_availability_credit_ledger_recharge_fkey'
      AND c.conrelid = 'public.v2_availability_credit_ledger'::regclass
  ) THEN
    ALTER TABLE public.v2_availability_credit_ledger
      ADD CONSTRAINT v2_availability_credit_ledger_recharge_fkey
      FOREIGN KEY (recharge_intent_id) REFERENCES public.v2_wallet_recharge_intents (id) ON DELETE SET NULL;
  END IF;

  -- Kind guard: pack_credit was already allowed in 045; no change needed here.
  -- Ensure the ledger can express the recharge source explicitly via the FK above.
END $$;
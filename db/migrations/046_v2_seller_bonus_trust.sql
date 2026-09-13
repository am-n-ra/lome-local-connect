-- Omni V2 seller trust bonus progress (P1-C NW-13e, decision D-H).
-- D-H locked: a $20 (10 000 XOF minor at the repo anchor rate ~500 XOF/USD, see V0_SELLER_REWARD_FCFA) pro_test_credit is unlocked after 3 Omni transactions
-- completed with DISTINCT buyers. qualifying_sales on v2_facilities stays as the visible
-- counter (min 3); this migration adds the source-of-truth audit of distinct buyers +
-- the seller_unlocks object the spec requires.
-- Additive only, idempotent, safe to re-run.

-- 1. Distinct-buyer trace per facility. One row per (facility, buyer) that closed a sale;
--    the UNIQUE pair is what enforces "3 ventes à users distincts" no matter how often
--    each buyer comes back.
CREATE TABLE IF NOT EXISTS public.v2_seller_unlock_progress (
  facility_id uuid NOT NULL,
  buyer_account_id uuid NOT NULL,
  first_sale_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT v2_seller_unlock_progress_pkey PRIMARY KEY (facility_id, buyer_account_id),
  CONSTRAINT v2_seller_unlock_progress_facility_fkey
    FOREIGN KEY (facility_id) REFERENCES public.v2_facilities (id) ON DELETE CASCADE,
  CONSTRAINT v2_seller_unlock_progress_buyer_fkey
    FOREIGN KEY (buyer_account_id) REFERENCES public.v2_accounts (id) ON DELETE CASCADE
);
COMMENT ON TABLE public.v2_seller_unlock_progress IS
  'D-H: distinct buyers who completed an Omni sale with a facility. Count of rows = "ventes à users distincts".';
CREATE INDEX IF NOT EXISTS v2_seller_unlock_progress_facility_idx
  ON public.v2_seller_unlock_progress (facility_id);

-- 2. The seller_unlocks object from the NW-13 spec, one row per facility / unlock type.
CREATE TABLE IF NOT EXISTS public.v2_seller_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL,
  unlock_type text NOT NULL DEFAULT 'pro_test_credit_20_usd'
    CHECK (unlock_type in ('pro_test_credit_20_usd')),
  distinct_buyer_count integer NOT NULL DEFAULT 0 CHECK (distinct_buyer_count >= 0),
  required_count integer NOT NULL DEFAULT 3 CHECK (required_count > 0),
  status text NOT NULL DEFAULT 'locked' CHECK (status in ('locked', 'eligible', 'granted')),
  amount_minor integer NOT NULL DEFAULT 10000 CHECK (amount_minor > 0),
  granted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT v2_seller_unlocks_facility_fkey
    FOREIGN KEY (facility_id) REFERENCES public.v2_facilities (id) ON DELETE CASCADE,
  CONSTRAINT v2_seller_unlocks_facility_type_unique UNIQUE (facility_id, unlock_type)
);
COMMENT ON TABLE public.v2_seller_unlocks IS
  'D-H: per-facility trust-bonus unlock. status locked (0-2 distinct buyers) → eligible (3) → granted (bonus paid once).';
COMMENT ON COLUMN public.v2_seller_unlocks.amount_minor IS
  'D-H: $20 = 10 000 XOF minor (repo anchor ~500 XOF/USD), one-time nonwithdrawable credit (kind bonus_grant).';
CREATE INDEX IF NOT EXISTS v2_seller_unlocks_facility_status_idx
  ON public.v2_seller_unlocks (facility_id, status);
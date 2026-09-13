-- Omni V2 buyer bulk-credit accounting (P1-A NW-13d, decision D-G).
-- D-G locked: 3 credits/month Free; Pro ≈ 100/month (base mensuelle); 1 besoin = 1 bulk;
-- a request targeting N facilities consumes N credits; surplus purchasable as packs (extra_credits).
-- This migration is data-only-additive: it creates two fresh v2 tables, no alter of existing rows.
-- Additive only, idempotent, safe to re-run.

-- 1. Per-buyer monthly credit counter.
--    monthly_quota = credits granted this month (3 free / ~100 pro when buyer-pro ships in NW-13h).
--    extra_credits = purchased surplus (packs), wallet stays separate (003_fedapay / 001_wallet).

CREATE TABLE IF NOT EXISTS public.v2_buyer_credit_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_account_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan in ('free', 'pro')),
  monthly_quota integer NOT NULL DEFAULT 3 CHECK (monthly_quota > 0),
  period_month text NOT NULL DEFAULT to_char(now(), 'YYYY-MM') CHECK (period_month ~ '^[0-9]{4}-[0-9]{2}$'),
  credits_used integer NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  extra_credits integer NOT NULL DEFAULT 0 CHECK (extra_credits >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT v2_buyer_credit_accounts_buyer_fkey FOREIGN KEY (buyer_account_id) REFERENCES public.v2_accounts (id) ON DELETE CASCADE,
  CONSTRAINT v2_buyer_credit_accounts_buyer_unique UNIQUE (buyer_account_id)
);
COMMENT ON COLUMN public.v2_buyer_credit_accounts.plan IS
  'D-G: buyer plan for bulk credits. Starts free (quota 3). Pro base ~100 arrives with buyer-pro (NW-13h).';
COMMENT ON COLUMN public.v2_buyer_credit_accounts.monthly_quota IS
  'D-G: monthly grant in credits (3 free, ~100 pro). Applied at month-roll; credits_used resets to 0.';
COMMENT ON COLUMN public.v2_buyer_credit_accounts.period_month IS
  'Current accounting month YYYY-MM. On first call of a new month the counter resets credits_used.';
COMMENT ON COLUMN public.v2_buyer_credit_accounts.credits_used IS
  'Credits consumed this month (1 per targeted facility). remaining = monthly_quota + extra_credits - credits_used.';
COMMENT ON COLUMN public.v2_buyer_credit_accounts.extra_credits IS
  'Purchased surplus (packs). Charged by NW-13i wallet/Mobile-Money; capacity only in NW-13d.';

-- 2. Audit ledger of bulk-credit movements (debit per request, monthly grant, pack credit, reversal).

CREATE TABLE IF NOT EXISTS public.v2_availability_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_account_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind in ('bulk_debit', 'bulk_monthly_grant', 'pack_credit', 'reversal')),
  amount integer NOT NULL CHECK (amount <> 0),
  reason text NOT NULL,
  request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT v2_availability_credit_ledger_buyer_fkey FOREIGN KEY (buyer_account_id) REFERENCES public.v2_accounts (id) ON DELETE CASCADE,
  CONSTRAINT v2_availability_credit_ledger_request_fkey FOREIGN KEY (request_id) REFERENCES public.v2_availability_requests (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS v2_availability_credit_ledger_buyer_created_idx
  ON public.v2_availability_credit_ledger (buyer_account_id, created_at DESC);
COMMENT ON COLUMN public.v2_availability_credit_ledger.kind IS
  'bulk_debit: availability request consumed credits (negative). bulk_monthly_grant/pack_credit/reversal: positive or corrective.';
COMMENT ON COLUMN public.v2_availability_credit_ledger.amount IS
  'Signed movement: negative = consumed, positive = granted/purchased/reversed. Never zero.';
COMMENT ON COLUMN public.v2_availability_credit_ledger.reason IS
  'Human/short reason, e.g. availability-request <uuid>, monthly grant free 3, pack purchase 10.';
COMMENT ON COLUMN public.v2_availability_credit_ledger.request_id IS
  'Availability request that consumed the credits (null for grants/packs/reversals).';
-- Omni V2 currency canonical fallback: XOF (Togo market), not USD.
-- Fixes the "currency multiplied across countries" bug: wallets and offer snapshots
-- were defaulting/stored with the US dollar while the real market (Togo/Lome) is XOF/FCFA.
-- Additive only, idempotent, safe to re-run.

-- 1. Wallet currency column default -> XOF instead of USD.

ALTER TABLE public.v2_wallets ALTER COLUMN currency SET DEFAULT 'XOF';

-- 2. Backfill existing wallets created without explicit currency (defaulted to USD( to XOF.
UPDATE public.v2_wallets SET currency = 'XOF' WHERE currency = 'USD';

-- 3. Backfill existing availability response offer_snapshots stored with USD currency ( to XOF.
UPDATE public.v2_availability_responses SET offer_snapshot = jsonb_set(offer_snapshot, '{currency}', '"XOF"', false)
WHERE offer_snapshot is not null AND offer_snapshot ->> 'currency' = 'USD';
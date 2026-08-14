-- Phases 0, 3, 4, 5 — config-backed manual flows, purchase intent metadata and seller ops.

ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS operating_hours text,
  ADD COLUMN IF NOT EXISTS emergency_shutdown boolean NOT NULL DEFAULT false;

ALTER TABLE public.demand_responses
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'available';

ALTER TABLE public.demand_responses DROP CONSTRAINT IF EXISTS demand_responses_kind_check;
ALTER TABLE public.demand_responses ADD CONSTRAINT demand_responses_kind_check
  CHECK (kind IN ('available','partial','different_quantity','unavailable','alternative'));

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS intent_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS intent_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.transactions
SET intent_created_at = created_at
WHERE intent_created_at IS NULL;

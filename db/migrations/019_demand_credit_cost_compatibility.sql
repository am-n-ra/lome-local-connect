-- Compatibility repair: the live Neon database may predate migration 010.
-- Keep this additive and safe to run more than once.
ALTER TABLE public.demand_requests
  ADD COLUMN IF NOT EXISTS credit_cost integer NOT NULL DEFAULT 1;

UPDATE public.demand_requests
SET credit_cost = GREATEST(1, COALESCE(targeted_count, 1))
WHERE credit_cost IS NULL OR credit_cost < 1;

ALTER TABLE public.demand_requests
  DROP CONSTRAINT IF EXISTS demand_requests_credit_cost_check;

ALTER TABLE public.demand_requests
  ADD CONSTRAINT demand_requests_credit_cost_check CHECK (credit_cost > 0);

COMMENT ON COLUMN public.demand_requests.credit_cost IS
  'Estimated buyer credit cost charged for the request, usually one credit per targeted facility.';

-- Demand requests now charge estimated availability-check credits per targeted facility.
ALTER TABLE public.demand_requests
  ADD COLUMN IF NOT EXISTS credit_cost integer NOT NULL DEFAULT 1 CHECK (credit_cost > 0);

ALTER TABLE public.demand_requests
  ALTER COLUMN radius_km DROP NOT NULL;

COMMENT ON COLUMN public.user_plans.requests_used IS
  'Monthly included availability-check credits consumed; free includes 3 normal checks.';
COMMENT ON COLUMN public.demand_requests.credit_cost IS
  'Estimated buyer credit cost charged for the request, usually one credit per targeted facility.';

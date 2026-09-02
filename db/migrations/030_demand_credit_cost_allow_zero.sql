-- credit_cost = 0 is valid for manual single-facility checks and Pro bulk requests.
-- Existing data audit: no negative values were found before applying this migration.

ALTER TABLE public.demand_requests
  DROP CONSTRAINT IF EXISTS demand_requests_credit_cost_check;

ALTER TABLE public.demand_requests
  ADD CONSTRAINT demand_requests_credit_cost_check CHECK (credit_cost >= 0);

COMMENT ON COLUMN public.demand_requests.credit_cost IS
  'Buyer credit cost: 0 for manual/single-facility checks or Pro bulk, positive for free bulk.';

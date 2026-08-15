-- Distinguish manual one-facility availability checks from bulk broadcasts.
ALTER TABLE public.demand_requests
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'bulk';

ALTER TABLE public.demand_requests DROP CONSTRAINT IF EXISTS demand_requests_mode_check;
ALTER TABLE public.demand_requests ADD CONSTRAINT demand_requests_mode_check
  CHECK (mode IN ('bulk', 'manual'));

COMMENT ON COLUMN public.demand_requests.mode IS
  'manual checks one selected facility and does not consume the buyer bulk quota; bulk broadcasts to the active result set.';

CREATE INDEX IF NOT EXISTS demand_requests_mode_created_idx
  ON public.demand_requests (buyer_id, mode, created_at DESC);

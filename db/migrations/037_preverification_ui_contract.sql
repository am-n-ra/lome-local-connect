-- Omni V1 pre-verification and catalog-first availability contract.
-- This migration is additive and safe to run once after validation.

CREATE TABLE IF NOT EXISTS public.facility_claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  claimant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'evidence_draft',
      'in_review',
      'changes_requested',
      'approved_certified',
      'approved_unconfirmed',
      'rejected'
    )),
  relationship text NOT NULL
    CHECK (relationship IN ('owner','representative','employee','agent','other')),
  claimant_name text NOT NULL CHECK (length(trim(claimant_name)) BETWEEN 2 AND 160),
  claimant_phone text,
  admin_reason text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS facility_claim_requests_one_open_per_claimant
  ON public.facility_claim_requests (facility_id, claimant_id)
  WHERE status IN ('pending','evidence_draft','in_review','changes_requested');

CREATE INDEX IF NOT EXISTS facility_claim_requests_review_idx
  ON public.facility_claim_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS facility_claim_requests_claimant_idx
  ON public.facility_claim_requests (claimant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.facility_claim_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.facility_claim_requests(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('identity','relationship','facility','offer')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','accepted','rejected')),
  reference text,
  document_url text,
  notes text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (document_url IS NOT NULL OR reference IS NOT NULL OR notes IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS facility_claim_evidence_request_kind
  ON public.facility_claim_evidence (request_id, kind);

ALTER TABLE public.demand_requests
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS demand_requests_product_idx
  ON public.demand_requests (product_id, created_at DESC)
  WHERE product_id IS NOT NULL;

COMMENT ON TABLE public.facility_claim_requests IS
  'Verification workflow. A request never changes facilities.status until an audited staff outcome.';
COMMENT ON TABLE public.facility_claim_evidence IS
  'Evidence stages for a facility verification request; submitted evidence is review input.';
COMMENT ON COLUMN public.demand_requests.product_id IS
  'Server-validated catalog product requested by the buyer when a catalog match exists.';

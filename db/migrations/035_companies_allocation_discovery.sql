-- Omni V1 terrain — companies, stock alloué, horaires, mode Discovery, ville.

-- 1. Companies: a person may own several companies, a company several facilities.
CREATE TABLE IF NOT EXISTS public.companies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  legal_name   text,
  country_code text,
  status       text NOT NULL DEFAULT 'unverified'
               CHECK (status IN ('unverified','pending','certified','rejected')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS companies_owner_idx ON public.companies (owner_id);

ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS facilities_company_idx ON public.facilities (company_id);

-- Backfill: one default company per existing owner.
INSERT INTO public.companies (owner_id, name, status)
SELECT DISTINCT f.owner_id,
       COALESCE(p.name, 'Ma compagnie'),
       CASE WHEN bool_or(f.status IN ('certified','confirmed')) THEN 'certified' ELSE 'unverified' END
FROM public.facilities f
JOIN public.profiles p ON p.id = f.owner_id
WHERE f.owner_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.owner_id = f.owner_id)
GROUP BY f.owner_id, p.name;

UPDATE public.facilities f
SET company_id = c.id
FROM public.companies c
WHERE f.owner_id = c.owner_id AND f.company_id IS NULL;

-- 2. Stock explicitly allocated to Omni for automatic availability answers.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS quantity_allocated_omni integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_allocated_omni_nonneg'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_allocated_omni_nonneg CHECK (quantity_allocated_omni >= 0);
  END IF;
END $$;

-- 3. Opening state: manual toggle + weekly schedule.
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS manual_open boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb;

-- 4. Discovery mode: a fixed facility temporarily broadcasting a live position.
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS discovery_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discovery_until timestamptz;
CREATE INDEX IF NOT EXISTS facilities_discovery_idx
  ON public.facilities (discovery_mode) WHERE discovery_mode = true;

-- 5. Normalised city used to bound the free buyer plan.
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS city text;
UPDATE public.facilities
SET city = NULLIF(btrim(COALESCE(neighbourhood, '')), '')
WHERE city IS NULL AND neighbourhood IS NOT NULL;
CREATE INDEX IF NOT EXISTS facilities_city_idx ON public.facilities (lower(city));

-- 6. Availability answers know whether they were produced automatically.
ALTER TABLE public.demand_responses
  ADD COLUMN IF NOT EXISTS auto boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS corrected_at timestamptz;

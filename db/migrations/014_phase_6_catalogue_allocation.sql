-- Phase 6 — catalogue status, stock quantity and Omni allocation controls.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS quantity_available integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS omni_allocation_percent integer NOT NULL DEFAULT 100;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_status_check
  CHECK (status IN ('draft','active','paused','sold_out'));

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_quantity_available_check;
ALTER TABLE public.products ADD CONSTRAINT products_quantity_available_check
  CHECK (quantity_available >= 0);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_omni_allocation_percent_check;
ALTER TABLE public.products ADD CONSTRAINT products_omni_allocation_percent_check
  CHECK (omni_allocation_percent BETWEEN 0 AND 100);

UPDATE public.products
SET status = CASE WHEN in_stock THEN 'active' ELSE 'sold_out' END,
    quantity_available = CASE WHEN in_stock AND quantity_available = 0 THEN 1 ELSE quantity_available END,
    omni_allocation_percent = 100
WHERE status = 'active' OR status = 'sold_out';

-- Phase B — English lifecycle statuses + QR checkout hardening

BEGIN;

ALTER TABLE public.facilities DROP CONSTRAINT IF EXISTS facilities_status_check;
ALTER TABLE public.facilities ALTER COLUMN status DROP DEFAULT;

UPDATE public.facilities
SET status = CASE status
  WHEN 'non_reclame'  THEN 'unclaimed'
  WHEN 'non_confirme' THEN 'unconfirmed'
  WHEN 'verifie'      THEN 'certified'
  WHEN 'confirme'     THEN 'confirmed'
  ELSE status
END;

ALTER TABLE public.facilities ALTER COLUMN status SET DEFAULT 'unconfirmed';
ALTER TABLE public.facilities ADD CONSTRAINT facilities_status_check
  CHECK (status IN ('unclaimed','unconfirmed','certified','confirmed'));

CREATE OR REPLACE FUNCTION public.refresh_facility_confirmation() RETURNS trigger AS $$
DECLARE
  distinct_buyers integer;
  current_status  text;
BEGIN
  SELECT count(DISTINCT buyer_id) INTO distinct_buyers
  FROM public.transactions
  WHERE facility_id = NEW.facility_id
    AND status = 'completed'
    AND qr_authorised_at IS NOT NULL
    AND buyer_id IS NOT NULL;

  SELECT status INTO current_status FROM public.facilities WHERE id = NEW.facility_id;

  IF distinct_buyers >= 3 AND current_status IN ('unconfirmed','certified') THEN
    UPDATE public.facilities
      SET status = 'confirmed', confirmed_at = now(), updated_at = now()
      WHERE id = NEW.facility_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- QR checkout metadata
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS qr_expires_at timestamptz;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS fee_percent numeric(5,2) NOT NULL DEFAULT 2;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'cash';

CREATE UNIQUE INDEX IF NOT EXISTS transactions_qr_token_key
  ON public.transactions (qr_token) WHERE qr_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_buyer_idx
  ON public.transactions (buyer_id, created_at DESC);

COMMIT;

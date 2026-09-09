-- Omni V2 availability request provisioning mode + note (V-7e, D-5a partial).
-- The buyer maquette AVAIL carries "Retrait / Livraison + Note (optionnel)" per §4.3 (annexe A K).
-- The V13 buyer flow already collected deliveryMode/availNote in state — but they never reached
-- the API/server/DB. This migration adds the columns, additive only, idempotent, safe to re-run.

-- 1. Delivery mode: how the buyer wants to receive/have the goods delivered.

ALTER TABLE public.v2_availability_requests
  ADD COLUMN IF NOT EXISTS delivery_mode text NOT NULL DEFAULT 'retrait' CHECK (delivery_mode in ('retrait', 'livraison'))
;
ALTER TABLE public.v2_availability_requests DROP CONSTRAINT IF EXISTS v2_availability_requests_delivery_mode_check;
ALTER TABLE public.v2_availability_requests ADD CONSTRAINT v2_availability_requests_delivery_mode_check CHECK (delivery_mode in ('retrait', 'livraison'));
COMMENT ON COLUMN public.v2_availability_requests.delivery_mode IS
  'Maquette V1.3 AVAIL: Retrait vs Livraison — how the buyer wants the offer fulfilled.';

-- 2. Buyer note attached to the request ( cap 500 chars, optional.


ALTER TABLE public.v2_availability_requests
  ADD COLUMN IF NOT EXISTS request_note text DEFAULT NULL CHECK (request_note is null or char_length(request_note) <= 500)
;
ALTER TABLE public.v2_availability_requests DROP CONSTRAINT IF EXISTS v2_availability_requests_note_len_check;
ALTER TABLE public.v2_availability_requests ADD CONSTRAINT v2_availability_requests_note_len_check
  CHECK (request_note is null or char_length(request_note) <= 500)
;
COMMENT ON COLUMN public.v2_availability_requests.request_note IS
  'Buyer note (optionnel) attached to the availability request — visible to the seller before they reply with an offer.';

-- 3. Existing rows default to'retrait'( satisfied by the column default for future inserts — backfill not needed.


-- 4. Seller queue reads it via existing columns ( no index needed: queue is scoped by facility + limit 100, this is text enrichment only.2
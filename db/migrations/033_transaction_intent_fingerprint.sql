-- Replace the broad buyer/facility/cart uniqueness rule with an exact logical-intent key.
-- The key is generated server-side from the source, facility, quantity and offer context.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS intent_key text;

-- Existing rows predate the key. Give each one a unique legacy key so the new
-- constraint cannot merge or reject historical active transactions.
UPDATE public.transactions
SET intent_key = 'legacy:' || id::text
WHERE intent_key IS NULL;

DROP INDEX IF EXISTS public.transactions_active_buyer_facility_cart_key;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_active_buyer_intent_key
  ON public.transactions (buyer_id, intent_key)
  WHERE buyer_id IS NOT NULL
    AND kind = 'in_app'
    AND intent_created_at IS NOT NULL
    AND status IN ('pending','qr_generated','qr_verified','payment_pending','paid','fulfillment','received','rating_pending');

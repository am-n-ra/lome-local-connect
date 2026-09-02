-- Prevent concurrent buyer intents from creating multiple active transactions
-- for the same facility/cart scope. Existing active duplicate groups were audited
-- at zero before this migration.
CREATE UNIQUE INDEX IF NOT EXISTS transactions_active_buyer_facility_cart_key
  ON public.transactions (
    buyer_id,
    facility_id,
    COALESCE(cart_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WHERE buyer_id IS NOT NULL
    AND kind = 'in_app'
    AND intent_created_at IS NOT NULL
    AND status IN ('pending','qr_generated','qr_verified','payment_pending','paid','fulfillment');

-- Omni V1 continuity: record external payment choice and fulfilment truth
-- without claiming that Omni processed the buyer-to-seller payment.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_preference text,
  ADD COLUMN IF NOT EXISTS buyer_payment_declared_at timestamptz,
  ADD COLUMN IF NOT EXISTS seller_payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS fulfillment_started_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_payment_preference_check'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_payment_preference_check
      CHECK (
        payment_preference IS NULL OR payment_preference IN
          ('cash_on_delivery', 'tmoney', 'flooz', 'external_other')
      );
  END IF;
END
$$;

ALTER TABLE public.transaction_events
  DROP CONSTRAINT IF EXISTS transaction_events_event_type_check;

ALTER TABLE public.transaction_events
  ADD CONSTRAINT transaction_events_event_type_check CHECK (event_type IN (
    'intent_created',
    'offer_confirmed',
    'coupon_applied',
    'qr_generated',
    'seller_verified',
    'payment_pending',
    'payment_preference_selected',
    'payment_declared',
    'payment_confirmed',
    'fulfillment_started',
    'product_received',
    'completed',
    'cancelled',
    'expired',
    'error'
  ));

CREATE INDEX IF NOT EXISTS transactions_payment_preference_idx
  ON public.transactions (payment_preference, status, created_at DESC);

CREATE INDEX IF NOT EXISTS transactions_seller_payment_idx
  ON public.transactions (facility_id, seller_payment_confirmed_at DESC)
  WHERE seller_payment_confirmed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_transaction_link_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE link LIKE '%transaction%';

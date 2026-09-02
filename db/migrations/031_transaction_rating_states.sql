-- Omni V1 transaction completion: receiving is not completion.
-- The buyer must rate the transaction before it can become completed.

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_status_check CHECK (
    status IN (
      'pending','qr_generated','qr_verified','payment_pending','paid',
      'fulfillment','received','rating_pending','user_confirmed','completed',
      'cancelled','failed','disputed','expired','refunded'
    )
  );

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_payment_preference_state_check,
  DROP CONSTRAINT IF EXISTS transactions_payment_declared_state_check,
  DROP CONSTRAINT IF EXISTS transactions_seller_payment_confirmed_state_check,
  DROP CONSTRAINT IF EXISTS transactions_fulfillment_started_state_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_payment_preference_state_check CHECK (
    payment_preference IS NULL OR status IN (
      'payment_pending','paid','fulfillment','received','rating_pending','completed'
    )
  ),
  ADD CONSTRAINT transactions_payment_declared_state_check CHECK (
    buyer_payment_declared_at IS NULL OR (
      payment_preference IS NOT NULL
      AND status IN ('payment_pending','paid','fulfillment','received','rating_pending','completed')
    )
  ),
  ADD CONSTRAINT transactions_seller_payment_confirmed_state_check CHECK (
    seller_payment_confirmed_at IS NULL OR status IN (
      'paid','fulfillment','received','rating_pending','completed'
    )
  ),
  ADD CONSTRAINT transactions_fulfillment_started_state_check CHECK (
    fulfillment_started_at IS NULL OR status IN (
      'fulfillment','received','rating_pending','completed'
    )
  );

CREATE OR REPLACE FUNCTION public.omni_validate_transaction_transition()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status IN ('qr_generated', 'cancelled') THEN RETURN NEW; END IF;
  IF OLD.status = 'qr_generated' AND NEW.status IN ('qr_verified', 'payment_pending', 'expired', 'cancelled') THEN RETURN NEW; END IF;
  IF OLD.status = 'qr_verified' AND NEW.status IN ('payment_pending', 'cancelled') THEN RETURN NEW; END IF;
  IF OLD.status = 'expired' AND NEW.status IN ('qr_generated', 'cancelled') THEN RETURN NEW; END IF;
  IF OLD.status = 'payment_pending' AND NEW.status IN ('paid', 'cancelled', 'failed') THEN RETURN NEW; END IF;
  IF OLD.status = 'paid' AND NEW.status IN ('fulfillment', 'cancelled', 'refunded') THEN RETURN NEW; END IF;
  IF OLD.status = 'fulfillment' AND NEW.status IN ('received', 'cancelled', 'disputed') THEN RETURN NEW; END IF;
  IF OLD.status = 'received' AND NEW.status IN ('rating_pending', 'cancelled', 'disputed') THEN RETURN NEW; END IF;
  IF OLD.status = 'rating_pending' AND NEW.status IN ('completed', 'disputed') THEN RETURN NEW; END IF;
  IF OLD.status = 'completed' AND NEW.status IN ('disputed', 'refunded') THEN RETURN NEW; END IF;
  IF NEW.status IN ('failed', 'cancelled', 'disputed', 'refunded') THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Illegal Omni transaction transition: % -> %', OLD.status, NEW.status
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.transactions.status IS
  'V1 flow: pending -> qr_generated -> qr_verified -> payment_pending -> paid -> fulfillment -> received -> rating_pending -> completed.';
COMMENT ON CONSTRAINT transactions_status_check ON public.transactions IS
  'received and rating_pending are intermediate states; completed is reached only after rating.';
COMMENT ON CONSTRAINT transactions_payment_preference_state_check ON public.transactions IS
  'Payment choice remains present through receipt and rating states.';
COMMENT ON CONSTRAINT transactions_payment_declared_state_check ON public.transactions IS
  'External payment declaration remains present through receipt and rating states.';
COMMENT ON CONSTRAINT transactions_seller_payment_confirmed_state_check ON public.transactions IS
  'Seller payment confirmation remains present through receipt and rating states.';
COMMENT ON CONSTRAINT transactions_fulfillment_started_state_check ON public.transactions IS
  'Fulfillment timestamp remains present through receipt and rating states.';

-- Existing completed rows remain valid legacy V1 rows. New transactions use rating_pending.

ALTER TABLE public.transaction_events
  DROP CONSTRAINT IF EXISTS transaction_events_event_type_check;

ALTER TABLE public.transaction_events
  ADD CONSTRAINT transaction_events_event_type_check CHECK (
    event_type IN (
      'intent_created','offer_confirmed','coupon_applied','qr_generated','seller_verified',
      'payment_pending','payment_preference_selected','payment_declared','payment_confirmed',
      'fulfillment_started','product_received','received_confirmed','rating_submitted',
      'completed','cancelled','expired','error'
    )
  );

CREATE INDEX IF NOT EXISTS transactions_rating_pending_idx
  ON public.transactions (buyer_id, status, completed_at DESC);

-- The migration runner records the applied filename separately; no application table is assumed here.

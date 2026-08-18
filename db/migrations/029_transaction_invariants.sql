-- Omni V1 continuity: database-level transaction invariants.
-- The application remains the UX authority, but illegal status jumps must not
-- be possible through a second server path or an accidental SQL update.

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_payment_preference_state_check CHECK (
    payment_preference IS NULL OR status IN ('payment_pending', 'paid', 'fulfillment', 'completed')
  ),
  ADD CONSTRAINT transactions_payment_declared_state_check CHECK (
    buyer_payment_declared_at IS NULL OR (
      payment_preference IS NOT NULL
      AND status IN ('payment_pending', 'paid', 'fulfillment', 'completed')
    )
  ),
  ADD CONSTRAINT transactions_seller_payment_confirmed_state_check CHECK (
    seller_payment_confirmed_at IS NULL OR status IN ('paid', 'fulfillment', 'completed')
  ),
  ADD CONSTRAINT transactions_fulfillment_started_state_check CHECK (
    fulfillment_started_at IS NULL OR status IN ('fulfillment', 'completed')
  );

CREATE UNIQUE INDEX IF NOT EXISTS transactions_qr_token_unique
  ON public.transactions (qr_token)
  WHERE qr_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.omni_validate_transaction_transition()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status IN ('qr_generated', 'cancelled') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'qr_generated' AND NEW.status IN ('qr_verified', 'payment_pending', 'expired', 'cancelled') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'qr_verified' AND NEW.status IN ('payment_pending', 'cancelled') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'expired' AND NEW.status IN ('qr_generated', 'cancelled') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'payment_pending' AND NEW.status IN ('paid', 'cancelled', 'failed') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'paid' AND NEW.status IN ('fulfillment', 'cancelled', 'refunded') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'fulfillment' AND NEW.status IN ('completed', 'cancelled', 'disputed') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'completed' AND NEW.status IN ('disputed', 'refunded') THEN
    RETURN NEW;
  END IF;
  IF NEW.status IN ('failed', 'cancelled', 'disputed', 'refunded') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Illegal Omni transaction transition: % -> %', OLD.status, NEW.status
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_validate_transition ON public.transactions;
CREATE TRIGGER transactions_validate_transition
BEFORE UPDATE OF status ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.omni_validate_transaction_transition();

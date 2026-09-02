-- The buyer's single confirmation action records receipt and opens the rating gate.
-- The intermediate received status remains supported for imported or external events.

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
  IF OLD.status = 'fulfillment' AND NEW.status IN ('received', 'rating_pending', 'cancelled', 'disputed') THEN RETURN NEW; END IF;
  IF OLD.status = 'received' AND NEW.status IN ('rating_pending', 'cancelled', 'disputed') THEN RETURN NEW; END IF;
  IF OLD.status = 'rating_pending' AND NEW.status IN ('completed', 'disputed') THEN RETURN NEW; END IF;
  IF OLD.status = 'completed' AND NEW.status IN ('disputed', 'refunded') THEN RETURN NEW; END IF;
  IF NEW.status IN ('failed', 'cancelled', 'disputed', 'refunded') THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Illegal Omni transaction transition: % -> %', OLD.status, NEW.status
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

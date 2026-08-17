-- Omni platform expansion: derive seller unlock eligibility and balance ledger entries.

CREATE OR REPLACE FUNCTION public.omni_refresh_seller_unlock(p_facility_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  completed_count integer;
BEGIN
  SELECT COUNT(*)::int
    INTO completed_count
  FROM public.transactions
  WHERE facility_id = p_facility_id
    AND status = 'completed';

  INSERT INTO public.seller_unlocks
    (facility_id, unlock_type, status, qualifying_count, required_count)
  VALUES
    (p_facility_id, 'pro_test_credit_20_usd', CASE WHEN completed_count >= 3 THEN 'eligible' ELSE 'locked' END, completed_count, 3)
  ON CONFLICT (facility_id, unlock_type) DO UPDATE
    SET qualifying_count = EXCLUDED.qualifying_count,
        status = CASE
          WHEN public.seller_unlocks.status IN ('granted', 'expired', 'revoked') THEN public.seller_unlocks.status
          WHEN EXCLUDED.qualifying_count >= public.seller_unlocks.required_count THEN 'eligible'
          ELSE 'locked'
        END,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.omni_refresh_unlock_after_transaction()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'completed' THEN
    PERFORM public.omni_refresh_seller_unlock(NEW.facility_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transactions_unlock_refresh_trigger ON public.transactions;
CREATE TRIGGER transactions_unlock_refresh_trigger
AFTER UPDATE OF status ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.omni_refresh_unlock_after_transaction();

CREATE OR REPLACE FUNCTION public.omni_record_approved_deposit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.credited_at IS DISTINCT FROM NEW.credited_at) THEN
    INSERT INTO public.balance_ledger
      (facility_id, bucket, amount, currency, reference_type, reference_id, idempotency_key, metadata)
    VALUES
      (NEW.facility_id, 'wallet', NEW.amount, NEW.currency, 'wallet_deposit', NEW.id::text, 'wallet_deposit:' || NEW.id::text, jsonb_build_object('provider', NEW.provider, 'provider_txn_id', NEW.provider_txn_id))
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wallet_deposits_ledger_trigger ON public.wallet_deposits;
CREATE TRIGGER wallet_deposits_ledger_trigger
AFTER UPDATE OF status, credited_at ON public.wallet_deposits
FOR EACH ROW
EXECUTE FUNCTION public.omni_record_approved_deposit();

UPDATE public.seller_unlocks su
SET qualifying_count = counts.completed_count,
    status = CASE WHEN counts.completed_count >= su.required_count AND su.status = 'locked' THEN 'eligible' ELSE su.status END,
    updated_at = now()
FROM (
  SELECT f.id AS facility_id, COUNT(t.id)::int AS completed_count
  FROM public.facilities f
  LEFT JOIN public.transactions t ON t.facility_id = f.id AND t.status = 'completed'
  GROUP BY f.id
) counts
WHERE su.facility_id = counts.facility_id
  AND su.unlock_type = 'pro_test_credit_20_usd';

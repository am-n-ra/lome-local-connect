-- Bounded Root proof only. Persistent V2 branch; never production/default.
-- The QR token hash is generated and consumed inside the transaction and is never returned or stored in source.
DO $proof$
DECLARE
  buyer_account uuid;
  seller_account uuid;
  response_id uuid := '41000000-0000-0000-0000-000000000101';
  intent_id uuid := '42000000-0000-0000-0000-000000000101';
  v_transaction_id uuid := '43000000-0000-0000-0000-000000000101';
  v_token_hash text;
  proof_now timestamptz := clock_timestamp();
BEGIN
  SELECT id INTO buyer_account
  FROM public.v2_accounts
  WHERE onboarding_state = 'buyer_ready' AND suspended_at IS NULL
  ORDER BY created_at, id
  LIMIT 1;

  SELECT id INTO seller_account
  FROM public.v2_accounts
  WHERE id = '10000000-0000-0000-0000-000000000101'::uuid
    AND onboarding_state IN ('seller_ready', 'complete')
    AND suspended_at IS NULL;

  IF buyer_account IS NULL OR seller_account IS NULL THEN
    RAISE EXCEPTION 'bounded demo buyer or seller fixture is missing';
  END IF;

  INSERT INTO public.v2_availability_requests
    (id, buyer_account_id, product_id, facility_scope, requested_quantity, budget_mode, budget_minor, status, idempotency_key, expires_at, created_at)
  VALUES
    ('40000000-0000-0000-0000-000000000101'::uuid, buyer_account, '30000000-0000-0000-0000-000000000101'::uuid, ARRAY['20000000-0000-0000-0000-000000000101'::uuid], 2, 'unlimited', NULL, 'submitted', 'D-V2-DEMO-REQUEST', proof_now + interval '1 hour', proof_now)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.v2_availability_responses
    (id, request_id, facility_id, responder_account_id, status, quantity_available, price_minor, offer_snapshot, seller_message, idempotency_key, observed_at)
  VALUES
    (response_id, '40000000-0000-0000-0000-000000000101'::uuid, '20000000-0000-0000-0000-000000000101'::uuid, seller_account, 'available', 2, 1500, jsonb_build_object('unit_price_minor', 1500, 'currency', 'USD'), 'Bounded demo response.', 'D-V2-DEMO-RESPONSE', proof_now + interval '1 second')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.v2_audit_events
    (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
  VALUES
    (seller_account, 'availability_response_created', 'availability_response', response_id::text, 'D-V2-DEMO-RESPONSE-AUDIT', 'available', proof_now + interval '1 second')
  ON CONFLICT (correlation_id, event_type, entity_type, entity_id) DO NOTHING;

  INSERT INTO public.v2_purchase_intents
    (id, buyer_account_id, response_id, transaction_id, idempotency_key, state, created_at)
  VALUES
    (intent_id, buyer_account, response_id, v_transaction_id, 'D-V2-DEMO-INTENT', 'active', proof_now + interval '2 seconds')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.v2_transaction_snapshots
    (transaction_id, intent_id, buyer_account_id, facility_id, product_id, quantity, unit_price_minor, coupon_code, net_amount_minor, response_observed_at, created_at)
  VALUES
    (v_transaction_id, intent_id, buyer_account, '20000000-0000-0000-0000-000000000101'::uuid, '30000000-0000-0000-0000-000000000101'::uuid, 2, 1500, NULL, 3000, proof_now + interval '1 second', proof_now + interval '2 seconds')
  ON CONFLICT (transaction_id) DO NOTHING;

  INSERT INTO public.v2_transaction_members (transaction_id, account_id, role)
  VALUES (v_transaction_id, buyer_account, 'buyer'), (v_transaction_id, seller_account, 'seller')
  ON CONFLICT (transaction_id, account_id, role) DO NOTHING;

  INSERT INTO public.v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
  VALUES (v_transaction_id, NULL, 'intent_created', jsonb_build_object('response_id', response_id), proof_now + interval '2 seconds')
  ON CONFLICT (transaction_id, state) DO NOTHING;

  INSERT INTO public.v2_qr_tokens (transaction_id, token_hash, expires_at, created_at)
  VALUES (v_transaction_id, encode(gen_random_bytes(32), 'hex'), proof_now + interval '10 minutes', proof_now + interval '3 seconds')
  ON CONFLICT (transaction_id) DO NOTHING;

  INSERT INTO public.v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
  VALUES (v_transaction_id, seller_account, 'qr_ready', '{}'::jsonb, proof_now + interval '3 seconds')
  ON CONFLICT (transaction_id, state) DO NOTHING;

  SELECT q.token_hash INTO v_token_hash
  FROM public.v2_qr_tokens q
  WHERE q.transaction_id = v_transaction_id;

  UPDATE public.v2_qr_tokens q
  SET verified_at = proof_now + interval '4 seconds', replay_count = q.replay_count + 1
  WHERE q.transaction_id = v_transaction_id
    AND q.token_hash = v_token_hash
    AND q.verified_at IS NULL
    AND q.replay_count = 0
    AND q.expires_at > proof_now;

  IF FOUND THEN
    INSERT INTO public.v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
    VALUES (v_transaction_id, seller_account, 'qr_verified', '{}'::jsonb, proof_now + interval '4 seconds')
    ON CONFLICT (transaction_id, state) DO NOTHING;
    INSERT INTO public.v2_audit_events
      (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
    VALUES (seller_account, 'qr_verified', 'transaction', v_transaction_id::text, 'D-V2-DEMO-QR-FIRST', 'seller_verified', proof_now + interval '4 seconds')
    ON CONFLICT (correlation_id, event_type, entity_type, entity_id) DO NOTHING;
  END IF;

  UPDATE public.v2_qr_tokens q
  SET verified_at = proof_now + interval '5 seconds', replay_count = q.replay_count + 1
  WHERE q.transaction_id = v_transaction_id
    AND q.token_hash = v_token_hash
    AND q.verified_at IS NULL
    AND q.replay_count = 0
    AND q.expires_at > proof_now;

  IF NOT FOUND THEN
    INSERT INTO public.v2_audit_events
      (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
    VALUES (seller_account, 'qr_replay_rejected', 'transaction', v_transaction_id::text, 'D-V2-DEMO-QR-REPLAY', 'already_verified_or_invalid', proof_now + interval '5 seconds')
    ON CONFLICT (correlation_id, event_type, entity_type, entity_id) DO NOTHING;
  END IF;

  INSERT INTO public.v2_external_payment_declarations
    (transaction_id, buyer_account_id, method, declared_at)
  VALUES (v_transaction_id, buyer_account, 'pay_on_delivery', proof_now + interval '6 seconds')
  ON CONFLICT (transaction_id) DO NOTHING;

  INSERT INTO public.v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
  VALUES (v_transaction_id, buyer_account, 'payment_declared', jsonb_build_object('method', 'pay_on_delivery'), proof_now + interval '6 seconds')
  ON CONFLICT (transaction_id, state) DO NOTHING;

  UPDATE public.v2_external_payment_declarations d
  SET seller_acknowledged_at = proof_now + interval '7 seconds'
  WHERE d.transaction_id = v_transaction_id
    AND d.seller_acknowledged_at IS NULL;

  INSERT INTO public.v2_transaction_events (transaction_id, actor_account_id, state, metadata, created_at)
  VALUES (v_transaction_id, seller_account, 'payment_confirmed', '{}'::jsonb, proof_now + interval '7 seconds')
  ON CONFLICT (transaction_id, state) DO NOTHING;

  INSERT INTO public.v2_audit_events
    (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
  VALUES (buyer_account, 'external_payment_declared', 'transaction', v_transaction_id::text, 'D-V2-DEMO-PAYMENT-DECLARED', 'pay_on_delivery', proof_now + interval '6 seconds')
  ON CONFLICT (correlation_id, event_type, entity_type, entity_id) DO NOTHING;

  INSERT INTO public.v2_audit_events
    (actor_account_id, event_type, entity_type, entity_id, correlation_id, reason, created_at)
  VALUES (seller_account, 'external_payment_confirmed', 'transaction', v_transaction_id::text, 'D-V2-DEMO-PAYMENT-CONFIRMED', 'seller_acknowledged', proof_now + interval '7 seconds')
  ON CONFLICT (correlation_id, event_type, entity_type, entity_id) DO NOTHING;
END
$proof$;

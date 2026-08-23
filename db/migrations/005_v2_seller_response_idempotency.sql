-- Additive Root hardening for the bounded seller-response and QR proof path.
-- Preserve all existing rows; no destructive operation is used.

ALTER TABLE public.v2_availability_responses
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS v2_availability_response_idempotency_unique
  ON public.v2_availability_responses(responder_account_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS v2_transaction_event_state_unique
  ON public.v2_transaction_events(transaction_id, state);

CREATE UNIQUE INDEX IF NOT EXISTS v2_audit_action_idempotency_unique
  ON public.v2_audit_events(correlation_id, event_type, entity_type, entity_id);

CREATE UNIQUE INDEX IF NOT EXISTS v2_qr_transaction_unique
  ON public.v2_qr_tokens(transaction_id);

-- Forward check: the response idempotency column and replay guards exist.
-- Invariant check: no existing rows are rewritten; the partial response index leaves
-- historical rows without an idempotency key valid and enforces uniqueness only for
-- new server-owned response mutations.
-- Recovery: if deployment fails, leave the additive objects in place and retry the
-- statement individually; do not delete or rewrite existing response/event/QR rows.

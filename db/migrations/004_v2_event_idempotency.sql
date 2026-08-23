-- Omni V2 Root event idempotency guardrails. Additive only.
-- Apply after migration 003 on a disposable branch before any persistent branch.

CREATE UNIQUE INDEX IF NOT EXISTS v2_transaction_event_state_unique
  ON public.v2_transaction_events(transaction_id, state);

CREATE UNIQUE INDEX IF NOT EXISTS v2_audit_action_idempotency_unique
  ON public.v2_audit_events(correlation_id, event_type, entity_type, entity_id);

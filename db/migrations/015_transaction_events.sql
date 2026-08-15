-- Lot E: append-only transaction timeline events.
CREATE TABLE IF NOT EXISTS public.transaction_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  event_type     text NOT NULL CHECK (event_type IN (
    'intent_created',
    'offer_confirmed',
    'qr_generated',
    'seller_verified',
    'payment_pending',
    'payment_confirmed',
    'product_received',
    'completed',
    'cancelled',
    'expired'
  )),
  actor_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transaction_events_transaction_created_idx
  ON public.transaction_events (transaction_id, created_at ASC);

CREATE INDEX IF NOT EXISTS transactions_buyer_intent_idx
  ON public.transactions (buyer_id, intent_created_at DESC)
  WHERE intent_created_at IS NOT NULL;

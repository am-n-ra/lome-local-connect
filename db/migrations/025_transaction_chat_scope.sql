ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS messages_transaction_idx
  ON public.messages (transaction_id, created_at);

ALTER TABLE public.redemptions
  ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS redemptions_coupon_user_transaction_key
  ON public.redemptions (coupon_id, user_id, transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS redemptions_transaction_idx
  ON public.redemptions (transaction_id);

create table if not exists public.v2_wallet_recharge_intents (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.v2_accounts(id) on delete restrict,
  wallet_id uuid not null references public.v2_wallets(id) on delete restrict,
  amount_minor integer not null check (amount_minor > 0),
  currency text not null check (currency = upper(currency)),
  idempotency_key text not null,
  provider_transaction_id text,
  provider_event_id text,
  checkout_url text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed', 'canceled')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (account_id, idempotency_key),
  unique (provider_transaction_id),
  unique (provider_event_id)
);

create index if not exists v2_wallet_recharge_account_idx
  on public.v2_wallet_recharge_intents(account_id, status, created_at desc);

create index if not exists v2_wallet_recharge_provider_idx
  on public.v2_wallet_recharge_intents(provider_transaction_id, status);

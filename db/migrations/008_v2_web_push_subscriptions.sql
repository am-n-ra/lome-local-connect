-- Functional Foundation: durable Web Push subscription registry.
-- Additive only. Delivery/provider configuration remains a separate gate.
create table if not exists v2_web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references v2_accounts(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  permission_state text not null default 'granted' check (permission_state in ('granted', 'revoked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (account_id, endpoint),
  check ((permission_state = 'granted' and revoked_at is null) or (permission_state = 'revoked' and revoked_at is not null))
);
create index if not exists v2_web_push_subscriptions_active_idx
  on v2_web_push_subscriptions(account_id, last_seen_at desc)
  where permission_state = 'granted' and revoked_at is null;
-- Endpoint and key material are private account-scoped credentials. No public route exposes them.

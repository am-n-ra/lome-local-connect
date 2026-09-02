-- Ring A field-pilot foundation.
-- Additive and idempotent: preserves Auth identities, legacy rows and existing V2 data.
-- Apply only after Root review and a forward/invariant/recovery check on a temporary branch.

create table if not exists v2_account_roles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references v2_accounts(id) on delete cascade,
  role text not null check (role in ('buyer', 'seller', 'operator', 'reviewer')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  granted_by_account_id uuid references v2_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (account_id, role)
);
create index if not exists v2_account_roles_active_idx
  on v2_account_roles(account_id, role) where status = 'active';

create table if not exists v2_facility_status_history (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references v2_facilities(id) on delete cascade,
  prior_state text,
  next_state text not null,
  actor_account_id uuid references v2_accounts(id) on delete set null,
  reason text not null,
  request_id uuid references v2_verification_requests(id) on delete set null,
  correlation_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists v2_facility_status_history_idx
  on v2_facility_status_history(facility_id, created_at desc);

create table if not exists v2_operator_runs (
  id uuid primary key default gen_random_uuid(),
  operator_account_id uuid not null references v2_accounts(id) on delete restrict,
  operation text not null check (operation in ('public_import', 'source_refresh', 'dedupe_review', 'claim_review', 'recovery')),
  provider text,
  west double precision,
  south double precision,
  east double precision,
  north double precision,
  outcome text not null check (outcome in ('started', 'success', 'empty', 'failed', 'needs_review', 'recovered')),
  result_count integer not null default 0 check (result_count >= 0),
  error_class text,
  evidence_ref text,
  correlation_id text not null unique,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists v2_operator_runs_scope_idx
  on v2_operator_runs(operation, started_at desc);

create table if not exists v2_notification_events (
  id uuid primary key default gen_random_uuid(),
  recipient_account_id uuid not null references v2_accounts(id) on delete cascade,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  dedupe_key text not null,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text not null,
  state text not null default 'queued' check (state in ('queued', 'delivered', 'failed', 'exhausted')),
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_account_id, dedupe_key)
);
create index if not exists v2_notification_events_inbox_idx
  on v2_notification_events(recipient_account_id, seen_at, created_at desc);

create table if not exists v2_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references v2_notification_events(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'web_push')),
  state text not null default 'queued' check (state in ('queued', 'delivered', 'retrying', 'failed', 'exhausted')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz,
  provider_reference text,
  last_error_class text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (event_id, channel)
);
create index if not exists v2_notification_deliveries_queue_idx
  on v2_notification_deliveries(state, next_attempt_at, created_at);

-- Notification events remain recipient-scoped through the API contract.
-- The append-only trigger is intentionally deferred to a separate compatible
-- migration because the Neon migration preparer rejects this PL/pgSQL block.
-- No notification event deletion endpoint is exposed by this slice.

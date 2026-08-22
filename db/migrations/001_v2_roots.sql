-- Omni V2 Roots
-- Fresh application-data schema. Neon Auth identities are referenced by text user IDs;
-- no V1 business data is imported and no Auth row is deleted by this migration.

create extension if not exists pgcrypto;

create table if not exists v2_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text not null unique,
  onboarding_state text not null default 'new' check (onboarding_state in ('new', 'buyer_ready', 'seller_ready', 'complete')),
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists v2_facility_slots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references v2_accounts(id) on delete cascade,
  source text not null check (source in ('free', 'wallet', 'workspace')),
  status text not null default 'available' check (status in ('available', 'assigned', 'revoked')),
  facility_id uuid,
  created_at timestamptz not null default now(),
  assigned_at timestamptz,
  revoked_at timestamptz
);

create unique index if not exists v2_one_free_slot_per_account
  on v2_facility_slots(account_id) where source = 'free';

create table if not exists v2_companies (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references v2_accounts(id) on delete restrict,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists v2_facilities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references v2_accounts(id) on delete restrict,
  company_id uuid references v2_companies(id) on delete set null,
  source_kind text not null default 'created' check (source_kind in ('created', 'public_import', 'claimed')),
  source_name text,
  source_ref text,
  name text not null,
  category text,
  description text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text,
  public_hours jsonb not null default '{}'::jsonb,
  trust_state text not null default 'unclaimed' check (trust_state in ('unclaimed', 'verification_draft', 'verification_submitted', 'admin_review', 'certified', 'unconfirmed', 'confirmed', 'rejected', 'suspended')),
  commercial_plan text not null default 'free' check (commercial_plan in ('free', 'pro_active', 'pro_expired')),
  qualifying_sales integer not null default 0 check (qualifying_sales >= 0),
  bonus_unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table v2_facility_slots
  add constraint v2_slot_facility_fk foreign key (facility_id) references v2_facilities(id) on delete set null;

create unique index if not exists v2_facility_source_dedupe
  on v2_facilities(source_name, source_ref) where source_name is not null and source_ref is not null;
create index if not exists v2_facilities_geo_idx on v2_facilities(latitude, longitude);
create index if not exists v2_facilities_owner_idx on v2_facilities(account_id, company_id);

create table if not exists v2_facility_entitlements (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references v2_facilities(id) on delete cascade,
  entitlement_kind text not null check (entitlement_kind in ('facility_pro', 'catalogue_limit', 'advanced_tools')),
  state text not null check (state in ('active', 'expired', 'revoked')),
  limit_value integer,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  source text not null check (source in ('wallet', 'workspace', 'promotion', 'manual')),
  created_at timestamptz not null default now()
);
create index if not exists v2_entitlements_facility_idx on v2_facility_entitlements(facility_id, entitlement_kind, state);

create table if not exists v2_products (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references v2_facilities(id) on delete cascade,
  name text not null,
  description text,
  category text,
  media jsonb not null default '[]'::jsonb,
  unit text not null default 'unit',
  price_minor integer not null check (price_minor >= 0),
  currency text not null default 'USD',
  actual_stock integer check (actual_stock is null or actual_stock >= 0),
  quantity_allocated_omni integer not null default 0 check (quantity_allocated_omni >= 0),
  publication_state text not null default 'draft' check (publication_state in ('draft', 'pending_validation', 'published', 'sold_out', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (actual_stock is null or quantity_allocated_omni <= actual_stock)
);
create index if not exists v2_products_facility_public_idx on v2_products(facility_id, publication_state);

create table if not exists v2_public_sources (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  attribution text not null,
  last_success_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists v2_facility_source_refs (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references v2_facilities(id) on delete cascade,
  source_id uuid not null references v2_public_sources(id) on delete restrict,
  source_ref text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(source_id, source_ref)
);
create table if not exists v2_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references v2_public_sources(id) on delete set null,
  west double precision not null,
  south double precision not null,
  east double precision not null,
  north double precision not null,
  zoom numeric,
  query text,
  outcome text not null check (outcome in ('success', 'empty', 'timeout', 'failed', 'fallback')),
  result_count integer not null default 0 check (result_count >= 0),
  error_class text,
  duration_ms integer,
  operator_state text not null default 'none' check (operator_state in ('none', 'needs_review', 'recovered')),
  created_at timestamptz not null default now()
);

create table if not exists v2_verification_requests (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references v2_facilities(id) on delete cascade,
  claimant_account_id uuid not null references v2_accounts(id) on delete restrict,
  state text not null default 'draft' check (state in ('draft', 'submitted', 'admin_review', 'certified', 'rejected', 'needs_more_evidence', 'cancelled')),
  version integer not null default 1 check (version > 0),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists v2_verification_evidence (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references v2_verification_requests(id) on delete cascade,
  evidence_kind text not null check (evidence_kind in ('identity', 'company', 'facility', 'product', 'service', 'location')),
  object_key text not null,
  checksum text,
  visibility text not null default 'private' check (visibility in ('private', 'admin_only', 'public')),
  created_at timestamptz not null default now()
);
create table if not exists v2_verification_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references v2_verification_requests(id) on delete cascade,
  admin_account_id uuid not null references v2_accounts(id) on delete restrict,
  outcome text not null check (outcome in ('certified', 'rejected', 'needs_more_evidence')),
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists v2_wallets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references v2_accounts(id) on delete cascade,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);
create table if not exists v2_wallet_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references v2_wallets(id) on delete restrict,
  kind text not null check (kind in ('recharge', 'slot_spend', 'facility_pro_spend', 'ad_spend', 'coupon_credit', 'bonus_grant', 'bonus_spend', 'reversal')),
  amount_minor integer not null check (amount_minor > 0),
  status text not null check (status in ('pending', 'confirmed', 'failed', 'reversed')),
  reference text not null,
  facility_id uuid references v2_facilities(id) on delete set null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique(wallet_id, kind, reference)
);
create index if not exists v2_wallet_ledger_wallet_idx on v2_wallet_ledger_entries(wallet_id, status, created_at);

create table if not exists v2_availability_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_account_id uuid not null references v2_accounts(id) on delete restrict,
  product_id uuid not null references v2_products(id) on delete restrict,
  facility_scope uuid[] not null,
  requested_quantity integer not null check (requested_quantity > 0),
  budget_mode text not null check (budget_mode in ('unlimited', 'maximum')),
  budget_minor integer check (budget_minor is null or budget_minor >= 0),
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'responding', 'available', 'partial', 'unavailable', 'stale', 'expired', 'cancelled', 'failed')),
  idempotency_key text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(buyer_account_id, idempotency_key)
);
create table if not exists v2_availability_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references v2_availability_requests(id) on delete cascade,
  facility_id uuid not null references v2_facilities(id) on delete restrict,
  responder_account_id uuid references v2_accounts(id) on delete set null,
  status text not null check (status in ('available', 'partial', 'unavailable', 'stale', 'expired', 'corrected', 'no_response')),
  quantity_available integer check (quantity_available is null or quantity_available >= 0),
  price_minor integer check (price_minor is null or price_minor >= 0),
  offer_snapshot jsonb not null default '{}'::jsonb,
  seller_message text,
  observed_at timestamptz not null default now(),
  corrected_at timestamptz
);

create table if not exists v2_purchase_intents (
  id uuid primary key default gen_random_uuid(),
  buyer_account_id uuid not null references v2_accounts(id) on delete restrict,
  response_id uuid not null unique references v2_availability_responses(id) on delete restrict,
  transaction_id uuid not null unique,
  idempotency_key text not null,
  state text not null default 'creating' check (state in ('creating', 'active', 'cancelled', 'expired', 'completed', 'disputed')),
  created_at timestamptz not null default now(),
  unique(buyer_account_id, idempotency_key)
);
create table if not exists v2_transaction_snapshots (
  transaction_id uuid primary key,
  intent_id uuid not null unique references v2_purchase_intents(id) on delete restrict,
  buyer_account_id uuid not null references v2_accounts(id) on delete restrict,
  facility_id uuid not null references v2_facilities(id) on delete restrict,
  product_id uuid not null references v2_products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_minor integer not null check (unit_price_minor >= 0),
  coupon_code text,
  net_amount_minor integer not null check (net_amount_minor >= 0),
  response_observed_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table if not exists v2_transaction_members (
  transaction_id uuid not null references v2_transaction_snapshots(transaction_id) on delete cascade,
  account_id uuid not null references v2_accounts(id) on delete restrict,
  role text not null check (role in ('buyer', 'seller')),
  primary key (transaction_id, account_id, role)
);
create table if not exists v2_transaction_events (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references v2_transaction_snapshots(transaction_id) on delete cascade,
  actor_account_id uuid references v2_accounts(id) on delete set null,
  state text not null check (state in ('intent_created', 'qr_ready', 'qr_verified', 'payment_declared', 'payment_confirmed', 'fulfilment_pending', 'fulfilled', 'received', 'rated', 'closed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists v2_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references v2_transaction_snapshots(transaction_id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  verified_at timestamptz,
  replay_count integer not null default 0 check (replay_count >= 0),
  created_at timestamptz not null default now()
);
create table if not exists v2_external_payment_declarations (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references v2_transaction_snapshots(transaction_id) on delete cascade,
  buyer_account_id uuid not null references v2_accounts(id) on delete restrict,
  method text not null,
  declared_at timestamptz not null default now(),
  seller_acknowledged_at timestamptz,
  unique(transaction_id)
);
create table if not exists v2_fulfilments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique references v2_transaction_snapshots(transaction_id) on delete cascade,
  mode text not null check (mode in ('pickup', 'delivery', 'other')),
  state text not null check (state in ('pending', 'in_progress', 'fulfilled', 'disputed')),
  updated_at timestamptz not null default now()
);
create table if not exists v2_ratings (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique references v2_transaction_snapshots(transaction_id) on delete cascade,
  buyer_account_id uuid not null references v2_accounts(id) on delete restrict,
  score integer not null check (score between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists v2_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_account_id uuid references v2_accounts(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  correlation_id text not null,
  reason text,
  payload_hash text,
  created_at timestamptz not null default now()
);
create index if not exists v2_audit_entity_idx on v2_audit_events(entity_type, entity_id, created_at);
create table if not exists v2_analytics_events (
  id uuid primary key default gen_random_uuid(),
  pseudonymous_actor text,
  event_name text not null,
  consent_state text not null check (consent_state in ('unknown', 'granted', 'denied')),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

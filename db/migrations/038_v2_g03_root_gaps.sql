-- G-03 Root System close-out: v2-canonical (founder RD-1, 2026-09-02).
-- public.* is frozen for new tables; all new root entities live in v2_*.
-- Covers accepted maquette gaps: RG-1 product availability + freshness (D-02/D-03),
-- RG-2 product StockEvent ledger (S5), RG-3 saved searches (B19),
-- RD-1 port of claim requests to v2 (S1 claim flow).

-- RG-1: product availability state + freshness window
alter table v2_products
  add column if not exists availability_state text not null default 'a_valider'
    check (availability_state in ('en_stock', 'verifie', 'a_valider', 'bientot')),
  add column if not exists availability_updated_at timestamptz not null default now(),
  add column if not exists availability_expires_at timestamptz;

comment on column v2_products.availability_state is
  'Accepted public labels: en_stock=En stock, verifie=Verifie, a_valider=A valider, bientot=Bientot.';
comment on column v2_products.availability_expires_at is
  'Freshness window (D-03): deterministic auto-transition to a_valider after expiry. facility_pro only (D-04).';

create index if not exists v2_products_availability_idx
  on v2_products(facility_id, availability_state);

-- RG-2: product StockEvent ledger (accepted S5, read-only history view)
create table if not exists v2_product_stock_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references v2_products(id) on delete cascade,
  from_state text,
  to_state text not null
    check (to_state in ('en_stock', 'verifie', 'a_valider', 'bientot')),
  source text not null check (source in ('auto', 'manual')),
  actor_account_id uuid references v2_accounts(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists v2_stock_events_product_idx
  on v2_product_stock_events(product_id, created_at desc);

comment on table v2_product_stock_events is
  'Product-level availability transition ledger. source=auto (deterministic freshness expiry) or manual (seller action). Append-only.';

-- Auto-transition helper: expire stale availability (D-03: caller decides window, e.g. 4h fresh / 24h expired)
create or replace function v2_expire_stale_availability()
returns integer
language plpgsql
as $$
declare
  affected integer;
begin
  with expired as (
    update v2_products p
    set availability_state = 'a_valider',
        availability_updated_at = now()
    where p.availability_expires_at is not null
      and p.availability_expires_at < now()
      and p.availability_state <> 'a_valider'
      and exists (
        select 1 from v2_facility_entitlements e
        where e.facility_id = p.facility_id
          and e.entitlement_kind = 'facility_pro'
          and e.state = 'active'
      )
    returning p.id, p.availability_state
  )
  insert into v2_product_stock_events (product_id, from_state, to_state, source, reason)
  select id, availability_state, 'a_valider', 'auto', 'freshness_expired'
  from expired;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function v2_expire_stale_availability is
  'D-03/D-04: deterministic auto-transition of stale facility_pro availability to a_valider.';

-- RG-3: saved searches (accepted B19)
create table if not exists v2_saved_searches (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references v2_accounts(id) on delete cascade,
  query text not null check (length(trim(query)) between 1 and 200),
  constraints jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists v2_saved_searches_account_idx
  on v2_saved_searches(account_id, active);

-- RD-1: claim requests in v2 (port of public.facility_claim_requests from 037)
create table if not exists v2_facility_claim_requests (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references v2_facilities(id) on delete cascade,
  claimant_account_id uuid not null references v2_accounts(id) on delete cascade,
  company_id uuid references v2_companies(id) on delete set null,
  status text not null default 'pending'
    check (status in (
      'pending', 'evidence_draft', 'in_review', 'changes_requested',
      'approved_confirmed', 'approved_unconfirmed', 'rejected'
    )),
  relationship text not null
    check (relationship in ('owner', 'representative', 'employee', 'agent', 'other')),
  claimant_name text not null check (length(trim(claimant_name)) between 2 and 160),
  claimant_phone text,
  admin_reason text,
  reviewed_by uuid references v2_accounts(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists v2_claim_requests_facility_idx
  on v2_facility_claim_requests(facility_id, status);
create index if not exists v2_claim_requests_pending_idx
  on v2_facility_claim_requests(status) where status in ('pending', 'in_review', 'changes_requested');

comment on table v2_facility_claim_requests is
  'V1 Master 57: unclaimed facilities stay discoverable; claim grants ownership after review. Public trust labels stay Non revendiquee/Non confirmee/Confirmee.';

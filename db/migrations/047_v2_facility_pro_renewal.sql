-- Omni V2 facility Pro auto-renewal audit (P1-D NW-13g, decision D-I).
-- D-I locked: Pro auto-renouvellement via wallet + opt-out explicite du Seller +
-- rappel avant expiration. The opt-in itself lives on v2_facility_entitlements.renewal_opt_in
-- (added by 009, "Wallet renewal never happens silently"); this migration only adds the
-- audit trail of renewal runs so an auto-renewal is observable and reconcilable.
-- Additive only, idempotent, safe to re-run.

create table if not exists public.v2_facility_renewal_runs (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null,
  prior_entitlement_id uuid,
  new_entitlement_id uuid,
  spend_ledger_entry_id uuid,
  run_at timestamptz not null default now(),
  status text not null check (status in ('succeeded', 'insufficient_funds', 'skipped', 'failed')),
  note text,
  created_at timestamptz not null default now(),
  constraint v2_facility_renewal_runs_facility_fkey
    foreign key (facility_id) references public.v2_facilities (id) on delete cascade
);
comment on table public.v2_facility_renewal_runs is
  'D-I: audit of Pro renewal attempts. succeeded = new 30d entitlement + facility_pro_spend; insufficient_funds = opt-in set but wallet below price (facility stays pro_expired, reminder); skipped = no opt-in; failed = unexpected error.';
create index if not exists v2_facility_renewal_runs_facility_idx
  on public.v2_facility_renewal_runs (facility_id, run_at desc);
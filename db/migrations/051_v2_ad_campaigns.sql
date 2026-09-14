-- Omni V2 sponsored advertising campaigns (P3 NW-13j, tranche #8).
-- Promise Publicite: "Campagnes sponsorisees manuelles" for PRO facilities only.
-- Manual-only: no AI; campaigns are self-served by the owning seller, budget is debited
-- from the seller wallet into a reserved advertising budget (wallet balance != ad budget),
-- and active campaigns make their facility sponsored (boosted) in buyer search.
-- D-J rule (omni-free-pro-offer): publicite budget is SEPARATE from wallet/FedaPay deposit.
-- Additive only, idempotent, safe to re-run.

create table if not exists public.v2_ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 60),
  budget_minor int not null check (budget_minor > 0),
  spent_minor int not null default 0 check (spent_minor >= 0),
  status text not null default 'planifiee' check (status in ('planifiee', 'active', 'terminee', 'pausee')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint v2_ad_campaigns_facility_fkey
    foreign key (facility_id) references public.v2_facilities (id) on delete cascade,
  constraint v2_ad_campaigns_window_check check (starts_at < ends_at),
  constraint v2_ad_campaigns_spend_check check (spent_minor <= budget_minor)
);
comment on table public.v2_ad_campaigns is
  'NW-13j: manual sponsored-ad campaigns. budget_minor is debited from the owning wallet and reserved; spent_minor accrues against sponsorship impressions/boosts. status planifiee -> active during [starts_at, ends_at], auto past due = terminee, pausee by seller.';

create index if not exists v2_ad_campaigns_active_idx
  on public.v2_ad_campaigns (facility_id);
create index if not exists v2_ad_campaigns_sponsored_scan_idx
  on public.v2_ad_campaigns (status, starts_at, ends_at) where status = 'active';
comment on index public.v2_ad_campaigns_sponsored_scan_idx is
  'NW-13j: fast scan of currently-active campaigns in buyer search sponsorship boost.';
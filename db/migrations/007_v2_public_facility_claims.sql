-- Ring A correction for public source facilities and active claims.
-- Additive/loosening only: existing ownership values and rows are preserved.
-- Public OSM facilities must not be assigned to the importing operator account.

alter table public.v2_facilities
  alter column account_id drop not null;

create unique index if not exists v2_one_active_claim_per_facility
  on public.v2_verification_requests(facility_id)
  where state in ('draft', 'submitted', 'admin_review', 'needs_more_evidence');

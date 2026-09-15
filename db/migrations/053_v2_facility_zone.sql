-- Omni V2 facility zone (NW-15 P2-C "mission zone").
-- Teams carry an optional field zone (v2_teams.zone, e.g. "Lomé Est", "Aflao").
-- This migration adds an optional, text zone to facilities so an operator/reviewer
-- who belongs to a zoned team only sees the facilities of that zone.
-- Additive + idempotent: guided by if not exists / guard checks.

alter table v2_facilities add column if not exists zone text;

-- Index for the operator zone filter (team zone => facility zone).
create index if not exists v2_facilities_zone_idx on v2_facilities (zone) where zone is not null;

comment on column v2_facilities.zone is 'Optional field zone label (e.g. Lomé Est, Aflao). Matches v2_teams.zone for operator scoping.';
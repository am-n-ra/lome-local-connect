-- T-07a Admin Trunk slice: D-01 separate operational state.
-- Trust lifecycle (9 internal states) is unchanged; the operational state is a
-- separate admin-controlled dimension: ouvert / ferme / temporairement_indisponible.
-- v2-canonical per RD-1; non-destructive (default keeps every facility open).

alter table v2_facilities
  add column if not exists operational_state text not null default 'ouvert'
    check (operational_state in ('ouvert', 'ferme', 'temporairement_indisponible'));

comment on column v2_facilities.operational_state is
  'D-01 operational state, separate from trust. Admin-set only, reason + audit event required. Labels: Ouvert, Fermé, Temp. indispo.';

create index if not exists v2_facilities_operational_state_idx
  on v2_facilities(operational_state);

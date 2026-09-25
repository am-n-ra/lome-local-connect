-- Migration 061 — R-4b : l'entitlement Pro appartient a l'ENTITE, pas au LIEU
--
-- Contexte (Seed §eco / contrat Root §3.1) : `v2_entities.commercial_plan` est la cible
-- « Pro par entite ». Or `v2_facility_entitlements` est cle sur `facility_id` : un Pro paye
-- reste attache a un LIEU. Avec plusieurs lieux par entite, il faudrait payer N fois pour une
-- seule entite — la contradiction que R-4b doit fermer.
--
-- Additif et idempotent : colonne nullable + backfill depuis le lien lieu -> entite (R-2),
-- index partiel. AUCUNE colonne supprimee, AUCUN `not null` brutal (la colonne `facility_id`
-- reste : elle dit OU la capacite s'applique, jamais A QUI elle appartient).

alter table v2_facility_entitlements
  add column if not exists entity_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'v2_facility_entitlements_entity_id_fkey'
  ) then
    alter table v2_facility_entitlements
      add constraint v2_facility_entitlements_entity_id_fkey
      foreign key (entity_id) references v2_entities(id) on delete cascade;
  end if;
end $$;

-- Backfill : chaque entitlement herite de l'entite de son lieu, quand le lien existe.
update v2_facility_entitlements fe
set entity_id = f.entity_id
from v2_facilities f
where f.id = fe.facility_id
  and fe.entity_id is null
  and f.entity_id is not null;

create index if not exists v2_entitlements_entity_idx
  on v2_facility_entitlements (entity_id, entitlement_kind, state)
  where entity_id is not null;

comment on column v2_facility_entitlements.entity_id is
  'R-4b : proprietaire de l''entitlement (l''entite). facility_id reste le lieu d''application.';

notify pgrst, 'reload schema';

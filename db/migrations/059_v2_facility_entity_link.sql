-- Omni V2 Root R-2a — lien explicite FACILITÉ → ENTITÉ (décision D-C1).
-- Sans ce lien, la propriété d'une offre ne peut passer que par une correspondance
-- par NOM (fragile). Le contrat Root V2 dit : une entité possède ses lieux.
--
-- M2a = ADDITIF SEUL : colonne nullable, backfill, index. Rien n'est obligatoire.

alter table v2_facilities add column if not exists entity_id uuid references v2_entities(id) on delete set null;
create index if not exists v2_facilities_entity_idx on v2_facilities(entity_id);

comment on column v2_facilities.entity_id is
  'S-25: the entity (owner) this place belongs to. facility_id on an offer is only WHERE; this is WHO.';

-- Backfill sur la même correspondance que les offres (compte + nom), jamais inventée.
update v2_facilities f
set entity_id = e.id
from v2_entities e
where f.entity_id is null
  and f.account_id is not null
  and e.account_id = f.account_id
  and e.display_name = f.name;

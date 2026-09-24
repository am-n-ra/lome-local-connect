-- Omni V2 Root R-1 — couche ENTITÉ (décision fondateur D-C1, 2026-09-23).
-- Corrige la racine nommée par le Seed V2 : l'offre appartient à l'ENTITÉ (S-25),
-- le lieu n'est que « où » ; le modèle est universel (S-01/S-02).
--
-- M1 = ADDITIF SEUL. Rien n'est rendu obligatoire, rien n'est supprimé :
--   * v2_entities             : l'offreur (individu ou organisation, même objet — S-13)
--   * v2_products.entity_id   : propriétaire de l'offre, NULLABLE à ce stade (backfill)
--   * v2_products.facility_id : passe NULLABLE — c'est « où », pas « à qui »
--   * caractéristiques d'offre (S-01) : position, unicité, remise, prix, état
--
-- Idempotent. Préservation par défaut : aucune donnée existante détruite.

create table if not exists v2_entities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references v2_accounts(id) on delete restrict,
  kind text not null default 'organisation' check (kind in ('individu', 'organisation')),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  trust_state text not null default 'unconfirmed'
    check (trust_state in ('unclaimed', 'unconfirmed', 'confirmed', 'certified')),
  qualifying_sales integer not null default 0 check (qualifying_sales >= 0),
  commercial_plan text not null default 'free'
    check (commercial_plan in ('free', 'pro_active', 'pro_expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists v2_entities_account_idx on v2_entities(account_id);

comment on table v2_entities is
  'S-25: the offer OWNER (individu or organisation, same object per S-13). The facility is only WHERE.';

-- L'offre : propriétaire = entité ; le lieu devient optionnel (« où », jamais « à qui »).
alter table v2_products add column if not exists entity_id uuid references v2_entities(id) on delete restrict;
alter table v2_products alter column facility_id drop not null;
create index if not exists v2_products_entity_idx on v2_products(entity_id);

-- Caractéristiques d'offre (S-01). Nullable à ce stade : le backfill/UI les remplit.
alter table v2_products add column if not exists position_kind text
  check (position_kind is null or position_kind in ('fixe', 'mobile', 'immaterielle'));
alter table v2_products add column if not exists uniqueness_kind text
  check (uniqueness_kind is null or uniqueness_kind in ('renouvelable', 'piece_unique'));
alter table v2_products add column if not exists handover_kind text
  check (handover_kind is null or handover_kind in ('retrait', 'livraison', 'immateriel'));
alter table v2_products add column if not exists price_kind text
  check (price_kind is null or price_kind in ('fixe', 'negociable'));
alter table v2_products add column if not exists condition_kind text
  check (condition_kind is null or condition_kind in ('neuf', 'occasion'));

comment on column v2_products.entity_id is
  'S-25: the offer belongs to the ENTITY. facility_id is only the place of availability.';
comment on column v2_products.position_kind is
  'S-01 car.3: fixe / mobile / immaterielle — the universal characteristic replacing facility_type.';

-- BACKFILL — mesuré : 206 facilités (203 imports publics sans compte, 3 réelles), 16 offres.
-- Les imports publics ne sont PAS des offreurs : ce sont des lieux de carte (S-05 unclaimed).
-- On ne leur invente PAS d'entité. Les facilités réellement gérées en reçoivent une.
insert into v2_entities (account_id, kind, display_name, trust_state, qualifying_sales, commercial_plan)
select f.account_id, 'organisation', f.name, f.trust_state, f.qualifying_sales, f.commercial_plan
from v2_facilities f
where f.account_id is not null
  and f.source_kind <> 'public_import'
  and not exists (
    select 1 from v2_entities e
    where e.account_id = f.account_id and e.display_name = f.name
  );

update v2_products p
set entity_id = e.id
from v2_facilities f
join v2_entities e on e.account_id = f.account_id and e.display_name = f.name
where p.facility_id = f.id and p.entity_id is null;

-- Le backfill reflète le type de lieu existant, sans rien inventer.
update v2_products p
set position_kind = coalesce(p.position_kind,
      case f.facility_type when 'mobile' then 'mobile'
                           when 'digital' then 'immaterielle'
                           else 'fixe' end)
from v2_facilities f
where p.facility_id = f.id and p.position_kind is null;

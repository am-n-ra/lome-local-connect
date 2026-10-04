-- Omni V2 — TF-5 signalement (DEC-V2-36 / D-SIG-1…5) : signalements d'offre + objectifs d'acquisition.
--
-- Un acheteur signale une offre (3 motifs maquette `signal`) ; l'équipe constate sur le
-- terrain (`op-queue`, l'opérateur ne décide pas — D-SIG-1 : reviewer/admin tranche) ;
-- jamais d'effet automatique sur S-32 (D-SIG-2 : flag séparé, équipe uniquement).
-- 1 signalement actif par offre et par acheteur (D-SIG-3) ; vendeur aveugle avant
-- constat (D-SIG-5). Les objectifs d'acquisition sont de vrais objets suivis
-- (D-SIG-4), nourris par la demande mesurée TF-2 — jamais une vente de données.
--
-- Idempotente : `create table if not exists` + `drop constraint if exists` avant chaque
-- `add constraint` (pattern 012/064). Zéro réécriture (tables neuves).

create table if not exists v2_offer_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references v2_products(id) on delete cascade,
  reporter_account_id uuid not null references v2_accounts(id) on delete cascade,
  motif text not null,
  detail text,
  state text not null default 'nouveau',
  created_at timestamptz not null default now(),
  decided_by_account_id uuid references v2_accounts(id) on delete set null,
  decided_at timestamptz,
  decision_note text
);

alter table v2_offer_reports drop constraint if exists v2_offer_reports_motif_check;
alter table v2_offer_reports
  add constraint v2_offer_reports_motif_check
  check (motif in ('prix_trompeur', 'visuel_non_conforme', 'indisponible'));

alter table v2_offer_reports drop constraint if exists v2_offer_reports_state_check;
alter table v2_offer_reports
  add constraint v2_offer_reports_state_check
  check (state in ('nouveau', 'constate_infirme', 'constate_confirme', 'traite'));

alter table v2_offer_reports drop constraint if exists v2_offer_reports_detail_check;
alter table v2_offer_reports
  add constraint v2_offer_reports_detail_check
  check (detail is null or char_length(detail) <= 500);

-- D-SIG-3 : 1 signalement actif par offre et par acheteur. Partiel : un rapport
-- clos n'empêche pas un nouveau signalement sur de nouveaux faits.
create unique index if not exists v2_offer_reports_one_active_idx
  on v2_offer_reports (product_id, reporter_account_id)
  where state = 'nouveau';

create index if not exists v2_offer_reports_state_idx
  on v2_offer_reports (state, created_at desc);

comment on table v2_offer_reports is
  'TF-5 : signalements d''offre par les acheteurs (maquette signal). Le vendeur visé ne voit ni le signalement ni le signaleur (D-SIG-5). Aucun effet automatique sur S-32 (D-SIG-2).';

create table if not exists v2_acquisition_objectives (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  zone text,
  seekers_snapshot integer not null default 0,
  state text not null default 'ouvert',
  created_by_account_id uuid references v2_accounts(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table v2_acquisition_objectives drop constraint if exists v2_acquisition_objectives_query_check;
alter table v2_acquisition_objectives
  add constraint v2_acquisition_objectives_query_check
  check (char_length(btrim(query)) between 1 and 120);

alter table v2_acquisition_objectives drop constraint if exists v2_acquisition_objectives_state_check;
alter table v2_acquisition_objectives
  add constraint v2_acquisition_objectives_state_check
  check (state in ('ouvert', 'recrute', 'clos'));

create index if not exists v2_acquisition_objectives_state_idx
  on v2_acquisition_objectives (state, created_at desc);

comment on table v2_acquisition_objectives is
  'TF-5 / D-SIG-4 : objectifs d''acquisition (recruter l''offre manquante, maquette admin-signal). Nourris par la demande TF-2 — jamais une vente de données.';

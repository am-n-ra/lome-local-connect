-- Omni V2 — TF-6 ops terrain (DEC-V2-37 / D-OPS-1…6) : tournées, dossiers, constats.
--
-- Un opérateur prend un dossier de sa zone (D-OPS-1 : file premier-preneur, pas de
-- dispatcher), constate sur place avec preuves BLOQUANTES photo + position
-- (D-OPS-2), transmet un compte rendu horodaté et signé ; la DÉCISION badge reste
-- aux files existantes (D-OPS-3 : signalements → decide-report TF-5,
-- vérifications → admin-review). L'opérateur ne décide jamais (maquette).
--
-- Idempotente : `create table if not exists` + `drop constraint if exists` avant
-- chaque `add constraint` (pattern 012/064/065). Zéro réécriture (tables neuves).

create table if not exists v2_field_visits (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_id uuid not null,
  zone text,
  assignee_account_id uuid references v2_accounts(id) on delete set null,
  state text not null default 'a_visiter',
  created_at timestamptz not null default now(),
  transmitted_at timestamptz
);

alter table v2_field_visits drop constraint if exists v2_field_visits_subject_check;
alter table v2_field_visits
  add constraint v2_field_visits_subject_check
  check (subject_type in ('verification', 'claim', 'offer_report'));

alter table v2_field_visits drop constraint if exists v2_field_visits_state_check;
alter table v2_field_visits
  add constraint v2_field_visits_state_check
  check (state in ('a_visiter', 'en_cours', 'transmis', 'reprogramme'));

-- Un dossier = un sujet : pas deux tournées actives sur le même objet.
create unique index if not exists v2_field_visits_one_active_idx
  on v2_field_visits (subject_type, subject_id)
  where state in ('a_visiter', 'en_cours');

create index if not exists v2_field_visits_state_zone_idx
  on v2_field_visits (state, zone);

comment on table v2_field_visits is
  'TF-6 : dossiers de tournée (maquette op-queue). File de zone premier-preneur (D-OPS-1). La décision badge vit dans les files existantes (D-OPS-3), jamais ici.';

create table if not exists v2_visit_reports (
  visit_id uuid primary key references v2_field_visits(id) on delete cascade,
  lieu_ok boolean not null,
  activite text not null,
  contact_ok boolean not null,
  reserve text,
  photo_refs jsonb not null default '[]'::jsonb,
  latitude numeric,
  longitude numeric,
  reporter_account_id uuid references v2_accounts(id) on delete set null,
  reported_at timestamptz not null default now()
);

alter table v2_visit_reports drop constraint if exists v2_visit_reports_activite_check;
alter table v2_visit_reports
  add constraint v2_visit_reports_activite_check
  check (char_length(btrim(activite)) between 1 and 500);

alter table v2_visit_reports drop constraint if exists v2_visit_reports_reserve_check;
alter table v2_visit_reports
  add constraint v2_visit_reports_reserve_check
  check (reserve is null or char_length(reserve) <= 500);

comment on table v2_visit_reports is
  'TF-6 : comptes rendus de visite (maquette op-report). Horodaté et signé : qui a constaté quoi, quand. Preuves photo + position BLOQUANTES à la transmission (D-OPS-2). Photos = refs Blob scope visit (D-OPS-6).';

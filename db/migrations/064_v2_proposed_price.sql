-- Omni V2 — S-09 / R-H : le prix proposé par l'acheteur (« négocier, c'est chercher moins cher »).
--
-- Mesure canonique avant écriture (2026-09-27) : `v2_availability_requests` portait `budget_mode`
-- (`unlimited`/`maximum`) et `budget_minor` — un PLAFOND, jamais un prix PROPOSÉ. Une offre
-- `price_kind='negociable'` se comportait donc exactement comme une offre à prix fixe.
--
-- `proposed_price_minor` exprime « je propose Y », distinct du plafond « je ne dépasse pas X ».
-- Les deux coexistent : le plafond borne, la proposition ouvre la discussion. NULL = l'acheteur
-- demande la disponibilité au prix affiché, comme avant — les 17 lignes existantes restent valides
-- sans réécriture.
--
-- Idempotente : `add column if not exists` (pattern 043/045) + `drop constraint if exists` (012).

alter table v2_availability_requests
  add column if not exists proposed_price_minor integer;

alter table v2_availability_requests drop constraint if exists v2_availability_requests_proposed_price_check;

alter table v2_availability_requests
  add constraint v2_availability_requests_proposed_price_check
  check (proposed_price_minor is null or proposed_price_minor >= 0);

comment on column v2_availability_requests.proposed_price_minor is
  'R-H : prix PROPOSÉ par l''acheteur sur une offre négociable (XOF minor). Distinct du plafond budget_minor. NULL = aucune proposition : la disponibilité est demandée au prix affiché.';

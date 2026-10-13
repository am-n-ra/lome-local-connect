-- Omni V2 — BRANCHES-MOBILE-POSITION : un ambulant peut dire « je suis ici » (décision fondateur 2026-10-13).
--
-- Contrat : docs/nature-way/omni-branches-mobile-position-contract-2026-10-13.md.
--
-- Fait central : la forme `mobile` (ambulant) existe déjà (facility_type + rayon_km, écrits une
-- fois à la création) mais sa position restait le point déclaré à la création. Un ambulant se
-- déplace dans la journée : on ajoute un geste MANUEL « je suis ici » qui met à jour le point.
--
-- Pas de suivi continu (watchPosition) : c'est V1+, hors tranche (S-02). La position est
-- DÉCLARÉE (S-31), jamais VÉRIFIÉE — d'où deux horodatages distincts : `position_declared_at`
-- (le vendeur l'affirme) et `position_verified_at` (une preuve terrain l'a confirmée). On ne
-- confond jamais les deux.
--
-- Additive + idempotente. Aucune colonne supprimée, aucune ligne réécrite par la migration.

alter table v2_facilities
  add column if not exists position_declared_at timestamptz;

alter table v2_facilities
  add column if not exists position_verified_at timestamptz;

comment on column v2_facilities.position_declared_at is
  'BRANCHES-MOBILE-POSITION : date du dernier geste « je suis ici » du vendeur. Position DÉCLARÉE, jamais une preuve (S-31).';
comment on column v2_facilities.position_verified_at is
  'BRANCHES-MOBILE-POSITION : date d''une vérification terrain de la position. Nulle = jamais vérifiée. Distincte de position_declared_at : on ne confond pas déclaré et vérifié (S-31).';

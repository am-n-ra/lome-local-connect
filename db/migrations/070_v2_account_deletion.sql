-- Omni V2 — BRANCHES-DELETE : suppression de compte (Option A, décision fondateur 2026-10-07).
--
-- Contrat : docs/nature-way/omni-account-deletion-contract-2026-10-07.md.
--
-- Fait central : on n'efface PAS les transactions (obligation légale/comptable — loi togolaise
-- n° 2019-014). On **détache** l'identité : les lieux créés/revendiqués redeviennent
-- « Non revendiquée » (niveau 0, S-05), les offres sont dépubliées, l'identité (auth + PII) est
-- anonymisée. Les transactions restent, rattachées au compte (désormais anonyme).
--
-- Additive + idempotente. Aucune colonne supprimée, aucune ligne réécrite par la migration
-- elle-même (le détachement est un acte serveur, pas une migration).

alter table v2_accounts
  add column if not exists deleted_at timestamptz;

alter table v2_accounts
  add column if not exists deletion_reason text;

-- Un compte supprimé garde sa ligne (les FK RESTRICT des transactions en dépendent) mais
-- devient inutilisable : `deleted_at` non nul = plus de session, plus de publication.
comment on column v2_accounts.deleted_at is
  'BRANCHES-DELETE : compte supprimé (Option A). Non nul = détaché + anonymisé. La ligne et les transactions restent (rétention légale) ; l''identité auth est supprimée côté Neon Auth.';
comment on column v2_accounts.deletion_reason is
  'BRANCHES-DELETE : motif déclaré par l''utilisateur (facultatif, borné).';

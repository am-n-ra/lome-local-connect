# Plan de rollback — POP-1c-A S4-bis Maroc/Algérie (2026-09-28) — écrit, NON exécuté

> **Statut : PROCÉDURE, pas action.** Aucune ligne S4-bis n'a été importée (B3 bloqué par la limite
> disque Neon 512 Mo). Ce document reste toutefois le filet documenté pour une exécution ultérieure
> **si** la capacité est débloquée et **si** un run canonique est lancé puis ouvert au rollback.
> **Ne jamais exécuter sans ordre fondateur séparé** (handoff §5).

## Périmètre (si des runs S4-bis existaient)

Fenêtre = lignes créées par les runs S4-bis uniquement :
- `v2_facilities`, `v2_facility_source_refs`, `v2_operator_runs` sur `created_at >= t0`
  **∧ `account_id IS NULL` ∧ `trust_state = 'unclaimed'`** ;
- `t0` = premier `created_at` du run Maroc (label `s4bis-morocco`), borne haute exclue pour les
  imports antérieurs (S1–S5).

## Garde-fous

- **Jamais** toucher une facilité **revendiquée** (`account_id IS NOT NULL`) ni un état de confiance
  non-`unclaimed` (S-18/S-25).
- **Jamais** toucher les frontaliers pré-existants (les 84 « existants » attendus : 72 algériens +
  12 intra) — ils sont antérieurs à `t0`.
- **Jamais** toucher `v2_products` (16) ni `v2_entities` (3) : hors périmètre d'import.
- Snapshots Neon : non disponibles (branche non-root) → **la branche parente + l'historique Neon
  (rétention 6 h) et cette fenêtre d'ids sont le filet**.

## Procédure (non exécutée)

1. Capturer les ids cibles : `select id from v2_facilities where created_at >= :t0 and account_id is
   null and trust_state='unclaimed'` — **compter avant toute suppression** ; doit égaler le delta de
   runs (Maroc 34 020 + Algérie 25 204 attendus).
2. `delete from v2_facility_source_refs where facility_id = any(:ids)` (FK CASCADE depuis facilities,
   mais suppression explicite d'abord pour clarté d'audit).
3. `delete from v2_operator_runs where facility_id = any(:ids)`.
4. `delete from v2_facilities where id = any(:ids)`.
5. Vérifier le retour à **385 917** (`facilities` = `source_refs` = `runs`), `pilot` 10 481 intact,
   `products` 16 / `entities` 3 intacts, 3 revendiquées intactes.

**Rollback par pays** : répéter 1–5 avec `t0`/borne de fin propres à chaque pays (Maroc, puis
Algérie) pour permettre un retrait sélectif.

## Motif du non-rollback (vagues antérieures)

S1–S5 : rollbacks **déclinés par le fondateur** (vagues acceptées, DEC-V2-15/18/20/22/24). Le même
défaut de capacité disque affecte désormais toute vague suivante (voir rapport S4-bis).

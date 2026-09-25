# R-4 — Alignement Seed : C-4 / C-5 / C-6 (preuve)

Date : 2026-09-23 · Branche : `omni-v2-rebuild` · Auteur : agent OpenHands

## Ce qui est livré

| Code | Décision | Mise en œuvre | Preuve |
|------|----------|---------------|--------|
| C-4 | Free = 20 offres publiées par **entité** | `FREE_OFFER_LIMIT = 20`, décompte par entité dans `transitionSellerProduct` | Postgres réel : 20 → 21e refusée |
| C-5 | 1 besoin = **1 crédit** bulk, quel que soit le nombre de fournisseurs | `creditCost = 1` dans `createBulkAvailabilityRequest` | 150 facilités → 1 crédit |
| C-6 | Seuil de confiance : **individu = 1**, **organisation = 3** | `case when e.kind = 'individu' then 1 else 3 end` dans le SQL unlock/bonus | Postgres réel : individu éligible à 1, organisation à 3, orphelin à 3 |

## Falsifications (règle : une preuve qui ne peut pas échouer ne prouve rien)

1. `FREE_OFFER_LIMIT` remis à `5` → **2 échecs** (`invariants.test.ts`, `roots-operations.test.ts`)
2. `creditCost` remis à `ceil(N/100)` → **1 échec** (test D-C5 150 facilités)
3. Seuil remis uniforme (3 pour tous) → **1 échec** (test D-C6/S-14)

## Preuve SQL contre Postgres réel (branche jetable, non les stubs)

Le construct `ON CONFLICT ... DO UPDATE` dont le `SET` lit `excluded` **à travers une sous-requête** a été exécuté sur Postgres :
individu → `eligible` à 1 ; organisation → `locked` à 1 puis `eligible` à 3 ; entité absente → `locked` (seuil 3) ;
statut `granted` **préservé** lors d'une réécriture. Branche supprimée après preuve.

## Défaut réel trouvé et corrigé (non planifié)

**Un vendeur créant une facilité ne pouvait JAMAIS publier.** Le chemin de publication exige un lien
d'entité (`join v2_entities e on e.id = coalesce(p.entity_id, f.entity_id)`), mais
`createSellerFacility` n'en créait aucun : les seules entités existantes venaient du backfill 058.
Vérifié en base : 3 produits sans entité, toutes des imports publics.

Correctif : la facilité reçoit son entité dans la **même instruction**. Deux pièges rencontrés, tous deux
documentés dans AGENTS.md :

1. `null = null` vaut `NULL` en SQL → le décompte du plafond valait `0` pour un produit sans entité, donc
   **le plafond était contourné**. Repli explicite sur le lieu.
2. Une CTE qui écrit **n'est pas visible** par les autres CTE de la même instruction. Ma première version
   insérait l'entité dans une CTE puis la relisait depuis `v2_facilities` → entité créée mais **jamais liée**
   (prouvé en base : `facility_linked = false`). Correction : l'entité est consommée comme **valeur de CTE**
   (`entity_pick`), jamais par relecture de table.

Preuve de bout en bout sur Postgres réel : création de facilité → entité `organisation` créée **et liée** →
produit `draft` publié → 20 publiées → 21e refusée.

## État honnête

- `tsc` propre, **596/596 tests**, chaque nouveau test vérifié comme **échouant** contre le code d'origine.
- **Aucune entité `individu` n'existe en base** : les 3 entités sont `organisation`. Le chemin C-6
  « individu = 1 » est donc **provisionné mais non exercé** en production.
- C-3 (Pro par entité) **non traité** : `v2_entities.commercial_plan` existe déjà, mais la table
  d'entitlement n'a pas été déplacée.
- Contrainte DB confirmée : `v2_entities_kind_check` autorise bien `individu` **et** `organisation`.

# R-4 — Les règles métier cessent de compter des LIEUX et comptent des ENTITÉS

> **Phase :** Root System · **porte :** D-C1 retenue (fondateur 2026-09-24)
> **Contrat parent :** `omni-root-v2-entity-layer-contract-2026-09-23.md` §6 (séquencement) / §12 (R-2 livré)
> **Autorité produit :** `omni-intent-brief-v2-2026-09-23.md` (Seed V2, `founder-confirmed`)
> **Décisions fondateur incluses :** **D-C4**, **D-C5**, **D-C6** — tranchées par délégation
> (« vas y selon ce que tu sens »), **enregistrées ici** et réversibles.

---

## 1. Pourquoi cette tranche

R-1/R-2 ont rendu le **socle** entité-aware (vérifié en base 2026-09-24 : `facility_id` nullable,
13/16 offres reliées à une entité). Mais **les règles métier comptent encore des lieux** — c'est le
reliquat de la racine C-1/C-2, et exactement ce que le fondateur ressent comme « le fond n'est pas là ».

## 2. Décisions tranchées (selon le Seed, jamais contre lui)

| ID | Sujet | Code avant | **Décision** | Source Seed |
|---|---|---|---|---|
| **D-C4** | Plafond gratuit d'offres | **5** | **20**, configurable | §« Modèle économique » « plafond 20 (configurable) » · A-F1 |
| **D-C5** | Coût d'un bulk | `ceil(N/100)` crédits | **1 crédit par besoin** | §Modèle éco « 1 besoin = 1 bulk » |
| **D-C6** | Seuil de confiance | **3 uniforme** | **1 particulier / 3 commerce** | **S-14** « seuil adapté au volume » |

**Pourquoi ces trois ensemble :** ce sont les trois règles qui **comptent des lieux au lieu d'entités**.
Les laisser dépareillées reproduirait la contradiction à la tranche suivante.

**Pourquoi pas C-3 (Pro par entité) dans cette tranche :** C-3 exige de **déplacer la table
d'entitlements** (aujourd'hui clé `facility_id`, 21 références, `activateFacilityPro`). Les règles
C-4/C-6 peuvent lire `v2_entities.commercial_plan`/`trust_state`/`kind` — **déjà présents depuis 058** —
sans déplacer la table. C-3 devient **R-4b**, avec blocage nommé.

## 3. Périmètre converti

| Point | Avant | Après |
|---|---|---|
| `FREE_OFFER_LIMIT` | 5 | **20** |
| Plafond d'offres | `facility.plan` | **`entity.commercial_plan`** d'abord, repli facilité |
| Seuil de confiance | 3 pour tous | **`kind`** : `individu` → 1, `organisation` → 3 |
| Coût bulk | `ceil(N/100)` | **1** |
| Message d'erreur bulk | « N facility(ies) = K credit(s) » | « 1 bulk credit (ne change pas avec le nombre de fournisseurs) » |

## 4. Non-goals

- **C-3** (entitlements Pro par entité) → **R-4b**.
- **R-5** (découverte 2 niveaux) → après.
- Aucune suppression d'enregistrement. Tout est **additif**.

## 5. Définition de fait

- `tsc` propre · suite complète verte · `check:boundary` propre · build OK.
- **Preuve falsifiée** : chaque règle échoue contre l'ancienne valeur.
- Parité prod (hash) après push.

## 6. Blocage nommé — R-4b

**Blocage :** `v2_facility_entitlements` est clé `facility_id` ; `activateFacilityPro(facilityId)` (12 sites),
21 références `facility_pro`. **Déblocage = une migration additive** `entity_id` nullable + backfill, puis
bascule des lectures — même forme que R-1→R-2.

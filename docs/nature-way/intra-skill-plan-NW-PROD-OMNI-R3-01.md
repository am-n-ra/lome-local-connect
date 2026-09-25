# R-3 — La confiance vit sur l'ENTITÉ (M3)

> **Phase :** Root System · **porte :** D-C1 retenue (fondateur 2026-09-24)
> **Contrat parent :** `omni-root-v2-entity-layer-contract-2026-09-23.md` §3.2 (M3) / §6 (séquencement)
> **Autorité produit :** `omni-intent-brief-v2-2026-09-23.md` — **S-30** (« la confiance vit sur l'entité »)
> **Prédécesseur :** R-2 livré (`facility_id` nullable, 13/16 offres reliées, `v2_entities` peuplée)
> **Bloque :** R-5 (découverte 2 niveaux) · **R-4b** (Pro par entité)

---

## 1. Pourquoi cette tranche

R-1/R-2 ont posé la **colonne** `entity_id` et l'ont peuplée. R-4 a fait compter les règles métier par
entité. Mais **la confiance elle-même est encore lue sur le LIEU**, alors que S-30 dit l'inverse.

C'est la dette `D-ENT-2` du contrat, assumée entre M1 et M3 — **M3 n'a jamais été exécutée**.

### Mesure du 2026-09-25 (branche canonique `br-dawn-hill-am5amy22`)

| Mesure | Valeur | Lecture |
|---|---|---|
| Colonnes de confiance sur `v2_facilities` | **3** (`trust_state`, `qualifying_sales`, `commercial_plan`) | doublon encore vivant |
| Colonnes de confiance sur `v2_entities` | **3** | cible déjà prête |
| Entités / facilités liées | **3 / 3** | backfill R-2 fait |
| Divergence observée | **0** aujourd'hui | mais rien ne l'**empêche** |
| Lectures `trust_state` via **facilité** (repo) | **20** | le lieu gouverne encore |
| Lectures `trust_state` via **entité** (repo) | **2** | la cible est minoritaire |

**Le fait décisif :** les deux colonnes peuvent diverger sans contrainte. Démontré pendant cette session —
en mettant l'entité `Omni Demo Seller Hub` à `confirmed` alors que le lieu restait `unconfirmed`, la
**porte du bonus a refusé un vendeur pourtant confirmé** (0 au lieu de 1). Ce n'est pas théorique :
**deux sources de vérité produisent déjà une décision fausse.**

## 2. Défaut réel corrigé dans la même session (R-4c, déjà poussé)

En auditant les seuils, j'ai trouvé un résidu de mon propre R-4 : `unlockFacilityBonus` gardait
`f.qualifying_sales >= 3` **en dur**. Un particulier (`individu`) marqué `eligible` à 1 vente restait
**bloqué au déverrouillage** — bonus gagné, inaccessible.

- Corrigé : seuil `case when e.kind = 'individu' then 1 else 3 end`.
- **Preuve A/B Postgres réel** : individu 2 ventes → porte corrigée **1** (éligible), ancienne porte **0** (bloqué).
- **Falsification** : retour au `>= 3` en dur → **1 échec**.
- Commit `c0765af` · `tsc` propre · **596/596**.

**Leçon conservée :** une décision de seuil peut être corrigée dans *une* requête et rester fausse dans
une autre. C'est pour ça que R-3 doit être **systématique**, pas ponctuel.

## 3. Re-plan — l'ordre initial était FAUX (découvert par la preuve, 2026-09-25)

Mon premier plan disait **R-3a lecture d'abord**. La preuve l'a contredit :

> **Aucune écriture ne va vers `v2_entities`.** Les 8 sites d'écriture (`set trust_state`, `qualifying_sales`,
> `commercial_plan`) écrivent tous sur `v2_facilities`. Les colonnes de l'entité datent du **backfill R-1** et
> n'ont jamais été mises à jour.

Conséquence : passer les lectures à l'entité d'abord aurait servi une **confiance périmée**. Démontré en base —
entité `confirmed` + lieu `rejected` → **8 produits affichés pour une facilité rejetée** (l'ancienne porte en
montrait 0). Ce n'est pas un détail de style : c'est une **régression de sécurité**.

**Ordre corrigé :** R-3b (miroir d'écriture) **d'abord**, puis R-3a (lecture), puis R-3c (gel).

| Temps | Contenu | Statut |
|---|---|---|
| **R-3b — miroir d'écriture** | les écritures alimentent l'entité **en plus** du lieu | **livré** |
| **R-3a — lecture** | entité d'abord, repli lieu | **livré** (après R-3b) |
| **R-3c — gel du lieu** | le lieu cesse d'être lu ; colonnes dépréciées, jamais supprimées | `planned` |

### 3.1 Miroirs d'écriture livrés (R-3b)

| Site | Chemin | Miroir |
|---|---|---|
| `submitTransactionRating` | vente → seuil → `confirmed` | ✅ `entity_qualified` |
| `reviewVerificationRequest` | vérification → `unclaimed`/`rejected`/`confirmed` | ✅ `entity_update` |
| `correctFacilitySalesCounter` | correction admin du compteur | ✅ `entity_updated` |

**Non mirés volontairement :** les 3 écritures de **claim** (`verification_draft`, `unclaimed`,
`verification_submitted`) touchent des **imports sans entité** (`entity_id` NULL) — rien à mirer, prouvé en base.
Les 2 activations **Pro** restent sur le lieu : c'est **R-4b**, hors périmètre.

### 3.2 Piège attrapé avant livraison

`commercial_plan` **ne doit pas** être lu depuis l'entité : sa colonne d'entité vaut `free` par défaut et
**aucune écriture ne la met à jour** → toute facilité Pro serait rapportée `free` et les entitlements cassés.
La lecture de `commercial_plan` reste donc sur le lieu, avec un commentaire qui nomme R-4b.

### 3.3 Piège SQL (évité avant la prod)

`coalesce(e.trust_state, f.trust_state)` dans le `select` de la découverte **exige** `e.trust_state` au
`group by` — `group by f.id` seul échoue (`column "e.trust_state" must appear in the GROUP BY clause`).
Attrapé en exécutant la requête réelle, pas en la relisant.

### 3.4 Preuves

- **Miroir** : correction de compteur → entité **1**, lieu **1**, `still_stale = false`.
- **Requête de découverte corrigée** : s'exécute, 202 facilités → **202 lignes** (aucun fan-out du `left join`).
- **Zéro perte** : aucune colonne supprimée, aucun enregistrement modifié sur la canonique.
- `tsc` propre · **596/596** · branche jetable supprimée après preuve.

## 4. Définition de fait

- `tsc` propre · suite complète verte · `check:boundary` propre · build OK.
- **Preuve A/B** sur Postgres réel : une entité confirmée avec lieu non confirmé doit **passer** (aujourd'hui elle échoue).
- **Falsification** de chaque bascule.
- **Zéro perte** : comptes / offres / snapshots / facilités comptés avant et après.
- Parité prod (hash) après push.

## 5. Tâches

| ID | Tâche | Dépend de | Statut | Preuve attendue |
|---|---|---|---|---|
| **R-3a** | 20 lectures → entité d'abord, repli lieu | R-2 | `ready` | A/B : entité confirmée + lieu non confirmé → **passe** |
| **R-3b** | écritures alimentent l'entité | R-3a | `planned` | vente → entité confirmée, lieu inchangé, zéro perte |
| **R-3c** | lieu gelé, colonnes dépréciées | R-3b | `planned` | aucune lecture lieu restante (grep = 0) |
| **R-5** | découverte 2 niveaux (S-11) | R-3 | `planned` | recherche entité **et** offre sur le même index |
| **R-4b** | Pro par entité (C-3) | R-3 | `blocked` — nommé | table d'entitlements déplacée |

## 6. Blocage nommé — R-4b

`v2_facility_entitlements` est clé `facility_id` (21 références, `activateFacilityPro(facilityId)`).
Déblocage = migration additive `entity_id` nullable + backfill, puis bascule des lectures.
**Même forme que R-3** — d'où l'intérêt de faire R-3 d'abord et de réutiliser le patron.

## 7. Re-plan trigger

Divergence non nulle trouvée en production · ou première offre réelle d'un `individu` en attente de bonus.

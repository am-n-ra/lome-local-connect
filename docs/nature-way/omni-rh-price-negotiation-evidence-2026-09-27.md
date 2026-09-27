# R-H — Prix fixe / à négocier : la caractéristique devient une règle

**Date :** 2026-09-27 · **Branche :** `omni-v2-rebuild` · **Porte :** Root (ouverte)
**Demande :** fondateur « /nature-way go » après la recommandation `R-H` (rendre `price_kind` vivant).
**Seed :** caractéristique n°7 « Prix fixe / à négocier » — **modèle jour 1 ET comportement pilote**
(`omni-intent-brief-v2-2026-09-23.md` §4, table des caractéristiques). **Dans le périmètre, pas un
élargissement.**

## 1. Le défaut mesuré (avant une ligne de code)

`price_kind` valait `'fixe'` ou `'negociable'` et **ne décidait rien**. Mesure code-vérité :

| Fait | Où | Conséquence |
|---|---|---|
| Aucune règle serveur ne lit `price_kind` pour accueillir une proposition | `createAvailabilityRequest` | une proposition de prix n'a même pas d'endroit où exister |
| L'acheteur n'a qu'un **PLAFOND** (`budget_mode`/`budget_minor`), jamais un **prix proposé** | `v2_availability_requests` | « Budget max » ≠ « je propose Y » |
| Le libellé « À négocier » est purement décoratif | `ui-helpers.ts` (`offerCharacteristics`) | l'acheteur lit « À négocier », agit comme sur un prix fixe |
| La réponse vendeur **exige** un prix (`price_minor`) | `createSellerAvailabilityResponse` | le vendeur **cote** — le canal existe, la **règle** manque |

**Ce qui existait déjà et ne devait PAS être reconstruit :** `v2_availability_responses.price_minor`
+ `seller_message` deviennent le prix et le message de la transaction (`createPurchaseIntent` lit
`ar.price_minor`). Le vendeur était donc déjà l'autorité du prix. Le manque était **du côté acheteur**
et **dans la règle**.

## 2. La règle (module pur partagé)

`src/trunk/offer-price.ts` — serveur **et** UI l'importent, donc impossible qu'ils divergent :

- **Négocier, c'est chercher un prix PLUS BAS.** Sur une offre négociable, une proposition
  **supérieure** au prix affiché est refusée (c'est une incohérence, pas une négociation).
- **Prix fixe ⇒ aucune proposition.** Le prix affiché est le prix.
- **Caractéristique non déclarée (`null`, offre héritée) ⇒ aucun droit présumé.** On n'ouvre pas la
  négociation sur une offre dont le vendeur n'a jamais déclaré le prix négociable.
- **Une proposition absente reste valide** : demander la disponibilité au prix affiché ne change pas
  (les 30 lignes existantes restent valides, 0 réécriture).

## 3. Ce qui est câblé

- **Migration `064_v2_proposed_price.sql`** : `v2_availability_requests.proposed_price_minor`
  (int, CHECK `>= 0`), additive + idempotente.
- **Serveur** : `createAvailabilityRequest` prononce un refus **lisible** (409, message français)
  avant d'écrire, puis **rejoue la même règle en SQL** (`price_rule` — garde en profondeur : un appel
  direct à la base ou un futur chemin de code ne peut pas insérer une proposition incohérente).
- **HTTP** : `validateAvailabilityRequestCreate` transporte et valide `proposedPriceMinor`.
- **UI acheteur** (`BuyerFlowV13`) : sur une offre négociable, un champ « Prix proposé » avec la note
  honnête « le vendeur reste libre : il répond avec SON prix ». Sur prix fixe : « le prix affiché est
  le prix ». Sur caractéristique non déclarée : la vérité, pas un faux champ.
- **UI vendeur** (`SellerReplyV13`) : la proposition de l'acheteur est **visible** (« Propose X »)
  avec la note « c'est une ouverture, pas un engagement ». Sans cela le vendeur négocierait à l'aveugle.
- **Flux** : `priceKind` + prix affiché transmis depuis la fiche facilité et les résultats.

## 4. Preuves

- **Suite : 604/604 tests** (596 avant, +8 : 7 `offer-price.test.ts`, 1 HTTP validator).
- **Falsification :** neutraliser `proposedPriceRejection` fait **tomber 4 tests** (proposition
  au-dessus du prix, prix fixe, caractéristique non déclarée, proposition négative). Restauré → 7/7.
  **Un test qui ne peut pas échouer ne prouve rien.**
- **Migration `064` :** prouvée sur branche jetable `br-gentle-voice-amwsyd9y` (créée depuis le
  canonique, puis supprimée) — **appliquée deux fois** (idempotence), CHECK **rejette `-1`** et
  accepte `5000`, nettoyage. **Puis appliquée au canonique `br-dawn-hill-am5amy22`** : colonne
  présente, contrainte présente, **0 ligne réécrite** (30 lignes, 0 proposition, 7 budgets intacts),
  registre `omni_schema_migrations` checksum `1bd7c051…9103fb`.
- **`tsc` clean ; 6 gardes verts** (`lint`, `check:boundary`, `check:docs`, `check:state`,
  `check:coherence`, `check:maquette`) ; bundles serverless régénérés.

## 5. Ce qui n'est PAS fait (résidu honnête)

- **Aucune offre ne déclare `price_kind`** en base aujourd'hui : la règle est **vivante mais non
  exercée** par des données. C'est un acte vendeur (déclarer la nature de son prix), pas une migration.
- **La contre-proposition vendeur est un prix cité, pas un fil de marchandage.** Le vendeur répond
  avec SON prix (mécanisme existant) ; l'aller-retour multi-tours n'est pas construit.
- **Preuve navigateur réelle non exécutée** (sandbox sans DB/Auth) : le contrat est prouvé
  unitairement + en base, la surface reste pour le prochain spot-check fondateur.
- **Migration `062`** (périmètre antérieur, `UNI-MONEY-1`) **reste à appliquer** — hors de cette tranche.
- **Reste du fond :** `condition_kind` et `handover_kind` demeurent des **déclarations**
  (« un vrai à la fois », S-02).

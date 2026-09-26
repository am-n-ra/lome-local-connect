# Intra-skill plan — RH-02 « on exige » : l'offre décrite est exigée pour publier

> **Plan ID :** `NW-PROD-OMNI-RH-02` · **As of :** 2026-09-23
> **Skill :** `/nature-way` · **Porte :** `ROOT` (ouverte)
> **Décision fondateur :** « **on exige** » (2026-09-23) — réponse à la question A de
> `docs/founder-hq/hq-reconciliation-2026-09-23.md`.
> **Handoff HQ :** `HO-OMNI-21`

---

## 1. Structural path

`product > Root System > offre décrite > publication`

| Phase | Statut | Base |
|---|---|---|
| **Seed** | ✅ clos `founder-confirmed` | `S-01…S-32` |
| **Species** | ✅ clos `founder-confirmed` | 74 écrans ; maquette `seller-publish` exige **visuel** + **avantage** |
| **Root** | ⏳ **cette tranche** | `E-03`/`E-04` livrés (RH-01) ; **caractéristiques non exigées** |
| **Trunk** | ✅ reproduit | boucle transactionnelle prouvée |

## 2. Slice

**Une offre ne peut pas être publiée si elle est muette.** Les cinq caractéristiques
(`position_kind`, `uniqueness_kind`, `handover_kind`, `price_kind`, `condition_kind`) deviennent
une **condition de première publication**, au même titre que le visuel et l'avantage, avec un refus
qui **nomme** le fait manquant.

**Pourquoi cette tranche et pas une autre :** la maquette `seller-publish` affiche **État : Neuf**,
**Catégorie : Produit/service/digital/immobilier**, **Quantité**, **Prix** — elle suppose une offre
**décrite**. L'app laissait publier une offre sans aucun de ces faits. C'est l'écart exact entre
« j'aime la présentation » et « le fond n'est pas là ».

## 3. Mesure avant code (règle : la mesure prévaut sur la mémoire)

| Fait mesuré | Valeur | Source |
|---|---|---|
| Offres publiées | **13** | canonique `br-dawn-hill-am5amy22`, 2026-09-23 |
| `condition_kind` / `handover_kind` / `price_kind` / `uniqueness_kind` | **0/13** chacun | idem |
| `position_kind` | 13/13 | idem |
| `media` | **0/13** | idem |
| `discount_value_minor > 0` | 12/13 | idem |
| Propriétaires des 13 | 3 vraies entités (Demo Hub 8, Boulangerie 3, Épicerie 2) | idem |
| **Le formulaire vendeur écrit-il les 5 ?** | **OUI** — `SellerV13.tsx:67-71` (défauts) → `:175` (payload) | code |
| **Le refus atteint-il l'UI ?** | **OUI** — `ProductCatalogueV13.tsx:16-22` mappe les raisons | code |
| **L'acheteur voit-il les caractéristiques ?** | **OUI** — `TrunkAppV13.tsx:1832` (`carac`) | code |
| **Le refus actuel** | visuel + avantage **seulement** — `trunk-repository.ts:2578-2587` | code |

**Conclusion :** le refus est **livrable sans brique**. Le chemin d'écriture existe, l'affichage
existe, seul le **refus** manque. C'est une ligne, pas une tranche à deux moitiés (contrairement au
piège E-03 du 2026-09-26, où le chemin d'upload manquait).

## 4. Décisions de conception

| # | Décision | Raison |
|---|---|---|
| **D-RH-7** | Le refus s'applique **uniquement** `draft → published` | Une offre **déjà publiée** n'est jamais rétrogradée en masse. Rétrograder les 13 serait un acte serveur non demandé ; les remettre en conformité est un **acte vendeur**. Même règle que RH-01 (`D-RH-5`). |
| **D-RH-8** | `position_kind` **non exigé** (il est 13/13, et le formulaire le dérive) | Exiger un fait déjà satisfait partout n'ajoute aucune garantie. |
| **D-RH-9** | Les 4 autres sont **exigés** | Ce sont eux qui font d'une offre une offre : neuf/occasion, unique/reproductible, retrait/livraison, négociable/fixe. |
| **D-RH-10** | Le refus **nomme** chaque fait manquant, dans l'ordre le plus actionnable | « un 'non' sans motif est incroyable » (leçon S-32 / RH-01). |
| **D-RH-11** | Les 13 offres existantes **ne sont pas modifiées** par cette tranche | Dette **visible** et **attribuée au vendeur**, pas corrigée en douce par un script. Le registre la porte. |

## 5. Task tree

| ID | Tâche | Statut | Preuve attendue |
|---|---|---|---|
| `RH02-T1` | Étendre le refus serveur aux 4 caractéristiques, avec raison nommée | ✅ `verified` | SQL réel |
| `RH02-T2` | Mapper la nouvelle raison dans l'UI vendeur | ✅ `verified` | `publication-refusal.test.ts` (3) |
| `RH02-T3` | Preuve SQL réelle : refus sur offre muette, succès sur offre décrite | ✅ `verified` | `scripts/prove-rh02-described-offer.mjs` — **11/11 PASS** |
| `RH02-T4` | Falsifier : neutraliser le refus → la preuve doit **échouer** | ✅ `verified` | **6 échecs** (T2–T6) |
| `RH02-T5` | Enregistrer la dette des 13 offres (registre, propriétaire, trigger) | ✅ `verified` | `omni-rh02-described-offer-evidence-2026-09-23.md` §4 |
| `RH02-T6` | **Découvert** : fuite d'information — un non-propriétaire apprenait le fait manquant | ✅ `verified` | T8 a échoué puis passé après correctif |

**Statut : `verified` sur le serveur · `partial` sur le rendu** (la phrase de refus affichée au
vendeur n'est pas prouvée en navigateur — session vendeur réelle requise).

## 6. Definition of done

- Une offre `draft` **sans** les 4 caractéristiques est **refusée** à la publication, avec une raison
  qui nomme le fait manquant.
- Une offre `draft` **avec** les 4 est **publiée**.
- Une offre **déjà publiée** n'est **jamais** rétrogradée par cette règle.
- La preuve **échoue** si l'on retire le refus.
- La dette des 13 offres est **écrite**, avec propriétaire (vendeur) et trigger.

## 7. Non-goals

- Ne pas exiger le visuel/l'avantage à nouveau (déjà RH-01).
- Ne pas rétrograder ni « réparer » les 13 offres existantes.
- Ne pas ouvrir la recherche par caractéristiques (la maquette désactive le chip « État » —
  endetté **par conception**, décision séparée).
- Ne pas rouvrir Seed ni Species.

## 8. Re-plan trigger

Si le refus rend la publication impossible **sur une offre que le vendeur ne peut pas compléter**
(c'est-à-dire si un chemin d'écriture manquait) → arrêt et remontée, comme pour le piège E-03.
**Mesuré ce jour : le chemin existe** (`SellerV13.tsx:175`), donc le trigger ne se déclenche pas.

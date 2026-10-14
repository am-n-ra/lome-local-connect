# Plan local — `BRANCHES-PRICE-DISPLAY` + audit d'écarts maquette (NW-PROD-OMNI-PRICE-01)

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02` · **Local Plan ID:** `NW-PROD-OMNI-PRICE-01`
> **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). **Autorité :** `/nature-way`.
> **As of :** 2026-10-13. **Owner :** Nature Way (relais).
> **Objet fondateur :** « ok pour l'affichage des prix on montre le prix sans et avec remise ? » +
> « et si jamais on a d'autres écarts de maquette ce serait temps de les identifier aussi ».

## Resource Receipt

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` (Founder HQ) |
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` (ce fichier) |
| Loaded | `docs/maquette/omni-species-v2-interactive.html` (§prix `.pr`/`.old`/`.promo`/`.big`) |
| Loaded | `docs/design.md` (règle 30 : accent réservé, dont `-N% Omni`) |
| Loaded | `src/trunk/TrunkAppV13.tsx`, `ProductCatalogueV13.tsx`, `OffersV13.tsx`, `types.ts`, `ui-v13.css`, `src/server/trunk-repository.ts`, `src/domain/currency.ts` |
| Not loaded / reason | `launch-envelope.md` / `risk-and-escalation-matrix.md` — aucune exposition publique ni paiement dans cette tranche (UI d'affichage) |

## Start-of-slice

> **Structural path:** product > Branches > price display (Root lecture + Trunk UI) + audit
> **Phase:** Branches (Root lecture mineure + Trunk UI) ; l'audit d'écarts = Heartwood cohérence
> **Slice:** un acheteur voit, sur chaque offre remisée, **le prix réduit ET le prix d'origine barré ET le `%` Omni** — jamais un faux `−0 %`, jamais un prix réduit sans son contexte.
> **Dependencies:** données déjà présentes (`prixOriginal`/`prixReduit`/`pourcentageReduction`) ; seul manque l'**origine** du prix d'appel sur la carte résultat (Root lecture).
> **Non-goals:** aucune nouvelle table, aucune migration ; pas de changement du calcul de remise ; pas de conversion de devise (D-LOC-8 reste ouvert).
> **Definition of done:** les 4 surfaces acheteur/vendeur montrent les deux prix + le `%` quand il y a une vraie remise ; rien quand il n'y en a pas ; garde unitaire + preuve navigateur + prod byte-identique (T-07d).

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | `PD-1` Root lecture | la carte résultat expose l'origine du prix d'appel (même ligne que le réduit) | SQL réel + mapping + type | `done` | fait contredit |
| 2 | `PD-2` Trunk UI | 4 surfaces : réduit + ~~origine~~ + `%` quand remise réelle ; rien sinon | rendu + preuve navigateur | `done` | faux `−0 %` |
| 3 | `PD-3` Heartwood | garde unitaire « pas de faux `−0 %` » ; CSS porté 1:1 | test falsifié | `done` | garde qui ne peut échouer |
| 4 | `AUDIT` écarts maquette | liste ordonnée et code-vérifiée des écarts restants | registre d'écarts | `done` | écart inventé |
| 5 | `RING` | push + T-07d | hash prod === local | `done` | déploiement |

## Dependency-aware task tree

| ID | Parent | Phase | Objective | Depends on | Status | Acceptance / proof | Risk/debt | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|
| PD-1-1 | PD-1 | Root | `listPublicFacilities` renvoie `min_price_original_minor` (origine de la même offre la moins chère) | — | `done` | SQL réel (les deux prix cohérents) | lecture seule | colonne mal groupée |
| PD-1-2 | PD-1 | Root | `toFacility` mappe `minPriceOriginalMinor` ; `types.ts` | PD-1-1 | `done` | type + mapping | — | — |
| PD-2-1 | PD-2 | Trunk | fiche offre — lignes produit : réduit + ~~origine~~ + `−N %` | PD-1-2 | `done` | rendu jsdom | monochrome | faux zéro |
| PD-2-2 | PD-2 | Trunk | « Ses offres » (entité) : idem | PD-2-1 | `done` | rendu | — | — |
| PD-2-3 | PD-2 | Trunk | carte résultat `hcard` : `dès <réduit>` + ~~origine~~ + badge `.promo` | PD-2-1 | `done` | rendu | — | — |
| PD-2-4 | PD-2 | Trunk | `ProductCatalogueV13` (vendeur) : idem | PD-2-1 | `done` | rendu | — | — |
| PD-2-5 | PD-2 | Trunk | CSS `.old` + `.promo` porté 1:1 de la maquette | PD-2-1 | `done` | `check:dead-css` vert | accent réservé | classe fantôme |
| PD-3-1 | PD-3 | Heartwood | helper pur `priceDisplay` (décide quoi montrer) + test | PD-2 | `done` | falsifié | — | — |
| PD-3-2 | PD-3 | Heartwood | preuve navigateur prod (2 prix + %, et rien sans remise) | PD-3-1 | `done` | script `prove-*` | — | — |
| AUDIT-1 | AUDIT | Heartwood | comparer maquette ↔ app surface par surface | — | `done` | registre d'écarts | — | — |
| RING-1 | RING | Ring | suite + gardes + push + T-07d | PD-3-2, AUDIT-1 | `done` | hash === local | — | déploiement |

## Handoff to Founder HQ

> **Local status:** `done`
> **Gate decision:** `advance` (tranche livrée, prod vérifiée)
> **Closed:** `PD-1…PD-3` (prix sans/avec remise), `AUDIT` (registre d’écarts `omni-branches-maquette-gaps-2026-10-13.md`), `RING` (push `ada8844` + T-07d).
> **Open or blocked:** — (écarts maquette restants = décision fondateur : `G-1`/`G-2`/`G-3`)
> **Resource Receipt:** Founder HQ + Nature Way + controller + template + maquette + design.md chargés
> **Residual gap:** `G-2` (aperçu de pin) = décision `T-10p` à re-confirmer ; `G-1`/`G-3` = durcissements possibles
> **Next smallest action:** `PD-1-1` (Root lecture de l'origine du prix d'appel)
> **Re-plan trigger:** un faux `−0 %` ou un prix réduit sans contexte

# Handoff Receipt — `HO-OMNI-20`

> **Request ID:** `HO-OMNI-20`
> **Founder HQ timestamp:** 2026-09-25 (UTC)
> **Primary authority:** `/nature-way` (product delivery)
> **Exact invocation:** `/nature-way` (invoked 2026-09-25, skill present at `.agents/skills/nature-way/SKILL.md`)
> **Activation status:** `activated`

## Handoff input

| Field | Value |
|---|---|
| User objective | « ok » — **approbation fondateur de D-CON-1…5** (contraintes de recherche), **avec amendement** : « sans oublier que la devise dépend de localization de user donc… » |
| Current milestone and gate | **Species V2 RÉOUVERTE** — attente `SP-VALIDATION`. Aucune porte aval (Root/Trunk) active. |
| Structural path | `product > buyer discovery > search > constraints > threshold semantics` |
| Relevant artifacts | `omni-search-constraints-decisions-D-CON-2026-09-25.md` (arbitrage) ; maquette `omni-species-v2-interactive.html` ; `omni-currency-localization-contract-2026-09-25.md` (amendement) ; `current-state.md` |
| Dependencies and constraints | Maquette-only (pas de Root) ; Root bloqué tant que Species n'est pas close ; devise = propriété de la **localisation** utilisateur |
| Secondary route | Aucune (pas de capital/opportunité/capacité engagé) |
| Expected specialist return | Gate, évidence, gap résiduel, owner, prochaine action |

## Specialist resource receipt

| Resource status | Exact path or explanation |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/intra-skill-execution-controller.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/ecosystem-orchestration-protocol.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/ecosystem-activation-manifest.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/founder-hq-board.md` |
| Template instantiated | `.agents/skills/nature-way-founder-hq/templates/skill-handoff-receipt.md` → this file |
| Not loaded / reason | `nature-way/templates/intent-brief.md` — non applicable : le Seed V2 est **déjà clos** (`founder-confirmed` 2026-09-23), aucun nouveau Seed ouvert |
| Not loaded / reason | `nature-way/templates/system-dependency-map.md` — non applicable : la SDM existe (`omni-system-dependency-map-2026-09-23.md`), aucun acteur nouveau |

## Dispatch result

`/nature-way` a **pris le contrôle de la porte Species V2 (volet contraintes)**. Le travail est resté
**dans Species** (maquette), sans ouvrir Root — conforme à la porte courante. La décision fondateur
D-CON-1…5 a été **appliquée à la maquette**, l'amendement devise **transformé en contrat D-LOC-1…5**,
et **deux défauts mesurés** (contradiction chip/fiche, distance en doublon) corrigés à la racine avec
**gardes falsifiés**.

## Ce qui a été livré

| Tranche | Livré | Preuve |
|---|---|---|
| **D-CON-1** | `.chip.seuil` — la pastille **active**, la valeur est **éditable** (`setSeuil`) | navigateur T2 : 1500 propagé |
| **D-CON-2** | La fiche **lit** la contrainte active ; plus de « Quantité souhaitée : 2 » figée face à un chip « ≥ 10 » | navigateur T3 : 7 / 1 500 F |
| **D-CON-3** | Helper unique `seuilLabel` ; défaut **2 500 F** (p90 réel), désormais **paramètre de marché** | garde `seuilLabel` |
| **D-CON-4** | Distance comptée **une seule fois** (bloc portées) ; chip « ≤ 10 km » supprimé | garde + falsification FAIL exit 1 |
| **D-CON-5** | **3 groupes** : Disponibilité / Votre besoin *— réglable* / Attributs d'offre ; « Transactable » et « Livraison » retirés de la recherche | garde 3 groupes + absence |
| **D-LOC-1…5** | Contrat devise-par-localisation ; la devise est portée par le **state** (`budgetCurrency`/`budgetSymbol`), pas codée en dur | garde `currency is carried by state` |

**Preuve navigateur `scripts/prove-constraints-dcon.mjs` : T1–T6 PASS, 0 pageerror.**
**Gardes falsifiés** : budget figé → FAIL exit 1 ; distance en doublon → FAIL exit 1 ; restaurés → exit 0.
**600/600 tests**, `tsc`, `check:state`, `check:boundary`, `check:maquette` — verts. Commit `dc065bd`.

## Gap résiduel honnête

- **L'app n'est PAS alignée.** Le tronc garde `SEARCH_CONSTRAINTS.buyer = ['Quantité 10', '≤ 15 000 FCFA', …]`
  (chips **figés**) et `OMNI_DEFAULT_LOCAL_CURRENCY` en dur. Aligner l'app = travail **Root/Trunk**,
  **interdit** tant que Species n'est pas close.
- **D-LOC n'est pas branché en base** : `public.markets` **n'existe pas** sur la branche canonique v2
  (migration `011` non appliquée) → la résolution de devise n'a **pas encore** de source de vérité.
- **Dette de données** : 9 produits du catalogue de démo estampillés `USD` mais **tarifés en francs**.
- **Bug serveur non corrigé** : le filtre budget compare `price_minor <= budgetMaxMinor` **sans devise
  ni conversion** — un filtre aveugle sur un corpus multi-devises.
- **`SP-VALIDATION` reste ouverte** : ces corrections **renforcent** la maquette mais **ne clôturent pas**
  Species — seule la **validation fondateur de `SP-1…SP-10`** le fait.

## Handoff to Founder HQ

> **Local status:** `verified` (maquette) · `partial` (app non alignée, volontairement)
> **Gate decision:** `advance` **dans Species** — la porte Species reste **ouverte** jusqu'à `SP-VALIDATION`
> **Closed:** D-CON-1…5 (appliquées + gardées + prouvées) ; D-LOC-1…5 (contrat écrit)
> **Open or blocked:** alignement app (bloqué par la porte Species) ; `public.markets` absent (bloqué par la porte Root) ; dette devise du catalogue démo
> **Resource Receipt:** 5 ressources lues, 1 template instancié, 2 non applicables (justifiés)
> **Residual gap:** l'app et la base ne suivent pas encore la décision ; le budget reste aveugle à la devise
> **Next smallest action:** **validation fondateur de `SP-1…SP-10`** au navigateur — c'est la seule chose qui clôt Species
> **Re-plan trigger:** le fondateur rejette une tranche SP, ou demande l'alignement app avant clôture (ce qui rouvrirait Root)

# Documentation Omni

> **As of :** 2026-09-25 · **Porte courante :** `SPECIES_CLOSED_ROOT_OPEN`

## ⚠️ Ce fichier disait faux jusqu'au 2026-09-25

Il déclarait [`OMNI_MASTER_PRODUCT_INTERFACE.md`](./OMNI_MASTER_PRODUCT_INTERFACE.md) **« l'unique
document normatif d'Omni »**. **C'est faux, et c'était dangereux** : ce master date du **2026-08-21**,
donc d'**avant** le Seed V2 (`S-01…S-34`, 2026-09-23). Il **ignore** le modèle qui fait Omni :
l'**entité** propriétaire de l'offre (`S-25`), l'offre détachée du lieu, les caractéristiques
d'offre. Il ne contient **aucune** mention de `v2_entities` ni de `S-25` — vérifié : ses 4
occurrences de « identité » parlent d'**Identité UI**, pas du modèle d'entité.

Un nouveau contributeur qui suivait ce README **apprenait un modèle abandonné** — exactement la
classe de défaut qui a fait croire à un rond-point (voir `AGENTS.md`, §« notre mémoire du produit »).

## Source de vérité — par **sujet**, pas un document unique

Nature Way : *une seule source de vérité **par sujet**. Ne pas entretenir de masters concurrents.*

| Sujet | Autorité | État |
|---|---|---|
| **Intention / produit / règles métier** | [`nature-way/omni-intent-brief-v2-2026-09-23.md`](./nature-way/omni-intent-brief-v2-2026-09-23.md) — **Seed V2**, `S-01…S-34` | **CLOS `founder-confirmed`** |
| **Dépendances / architecture causale** | [`nature-way/omni-system-dependency-map-2026-09-23.md`](./nature-way/omni-system-dependency-map-2026-09-23.md) | **normatif** |
| **Contrat du socle (entité, offre)** | [`nature-way/omni-root-v2-entity-layer-contract-2026-09-23.md`](./nature-way/omni-root-v2-entity-layer-contract-2026-09-23.md) | **normatif** |
| **Design visuel accepté** | [`maquette/omni-species-v2-interactive.html`](./maquette/omni-species-v2-interactive.html) — **74 écrans** | **CLOS `founder-confirmed` 2026-09-25** |
| **Décisions produit du jour** | [`founder-hq/current-state.md`](./founder-hq/current-state.md) | **source d'état** |
| **Plan / board** | [`founder-hq/founder-hq-board.md`](./founder-hq/founder-hq-board.md), [`founder-hq/founder-hq-master-plan.md`](./founder-hq/founder-hq-master-plan.md) | **source d'exécution** |
| **Cohérence Seed ↔ code** | [`nature-way/omni-seed-vs-code-coherence-register-2026-09-23.md`](./nature-way/omni-seed-vs-code-coherence-register-2026-09-23.md) | **0 incohérence ouverte** (`npm run check:coherence`) |
| **Conformité maquette ↔ Seed** | [`nature-way/omni-species-v2-conformance-audit-T12-2026-09-23.md`](./nature-way/omni-species-v2-conformance-audit-T12-2026-09-23.md) | `npm run check:species-t12` |
| **Ce qui reste à finir** | [`nature-way/omni-root-finishing-inventory-2026-09-25.md`](./nature-way/omni-root-finishing-inventory-2026-09-25.md) | **Root** |

**Un seul document ne suffit plus à décrire Omni.** La chaîne est : **Seed → SDM → contrat du socle →
maquette → état → plan**. Chaque maillon a **une** autorité, listée ci-dessus.

## Le master historique

[`OMNI_MASTER_PRODUCT_INTERFACE.md`](./OMNI_MASTER_PRODUCT_INTERFACE.md) est **conservé** — il
documente la **V1** (art direction, écrans V1, traçabilité). Il n'est **plus normatif** : il ne
contredit pas le Seed V2, il **l'ignore**. **Ne pas s'en servir pour une décision produit ou un
schéma.** Statut : **historique**.

## Hiérarchie documentaire

| Emplacement | Statut | Usage |
|---|---|---|
| `nature-way/` | **normatif produit** | Seed V2, SDM, contrats, registres, preuves |
| `maquette/` | **normatif visuel** | maquette V2 acceptée |
| `founder-hq/` | **état + exécution** | porte, board, plan, handoffs |
| `design.md` | **normatif vocabulaire UI** | classes et tokens |
| `decisions/` | décisions datées | arbitrages courts |
| `reports/` | informatif | diagnostics, validations |
| `OMNI_MASTER*.md`, `omni-v1-*`, `omni-continuity-*`, `omni-species-*` (V1) | **historique V1** | traçabilité, **jamais normatif** |
| `.lovable/plan/` | historique | non normatif |

## Règle

**Une décision produit va dans le Seed V2 (ou un contrat `nature-way/`), jamais dans un rapport.**
Un brainstorming, un ticket, un ancien plan ou un master V1 **ne remplace pas** la chaîne V2.

Voir [`omni-document-harmonization-map-2026-09-25.md`](./omni-document-harmonization-map-2026-09-25.md)
pour le classement de chaque document.


# Plan local — Suite Trunk (NW-PROD-OMNI-TRUNK-02)

> **Founder HQ Plan ID:** `HQ-OMNI-2026-09-02` · **Local Plan ID:** `NW-PROD-OMNI-TRUNK-02`
> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** `/nature-way`.
> **As of :** 2026-10-07. **Owner :** Nature Way (relais) · **Décisions fondateur :** « 1 ok · 2 oui on construit · 3 ok room · 4 ok ».
> **Objet :** suite de Trunk depuis la clarification du 29 — corriger / ajouter / enlever, une tranche à la fois.

## Resource Receipt

| Statut | Chemin |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way-founders-hq/SKILL.md` (Founder HQ) |
| Loaded | `docs/nature-way/omni-trunk-continuation-inventory-2026-10-07.md` |
| Loaded | `docs/founder-hq/current-state.md`, `founder-hq-master-plan.md` |
| Loaded | `src/server/trunk-repository.ts` (sweep/listOpen/getTransaction), `src/trunk/BuyerFlowV13.tsx`, `transaction-time.ts`, migrations `001`/`056` |
| Template instantiated | `.agents/skills/nature-way/templates/intra-skill-plan.md` (this file) |
| Not loaded / reason | `launch-envelope.md` / `risk-and-escalation-matrix.md` — aucune exposition publique ni paiement dans X1 |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | `TRUNK-X1` corriger l'état | intention expirée = événement canonique `expired` écrit par le sweep, lu par les lectures ; 0 zombie | migration + repo + UI + preuve SQL réelle falsifiée | **`verified`** — `067` appliquée canonical, preuve jetable 7/7 (falsifiée 4 FAIL), 836/836 | fait contredit |
| 2 | `TRUNK-X4` mémoire | `COH-V2` re-classé ; `DS-1…14` au SDM | registre + garde | **`done`** — 7 lignes périmées re-classées, SDM amendé | divergence |
| 3 | `TRUNK-X2` seller-automation | modèle auto-dispo + slice | décision modèle → contrat → code | `todo` | fondateur |
| 4 | `TRUNK-X3` room | surface chat acheteur | contrat + code + preuve | `todo` | fondateur |

## Dependency-aware task tree

| ID | Parent | Phase | Objective | Depends on | Status | Acceptance / proof | Re-plan trigger |
|---|---|---|---|---|---|---|---|
| X1-1 | — | Root | Décision : `'expired'` rejoint l'union canonique d'états | mesure | `done` | inventory §1 | fait contredit |
| X1-2 | X1-1 | Root | Migration `067` : étendre le CHECK `state` | X1-1 | `verified` | appliquée jetable + canonique | régression |
| X1-3 | X1-2 | Root | `sweepExpiredIntents` écrit `expired` ; lectures excluent l'expiration pré-verrou | X1-2 | `verified` | SQL réel | faux |
| X1-4 | X1-3 | Trunk | `TransactionState` + `transaction-time` + carte terminale UI | X1-3 | `verified` | rendu jsdom | faux |
| X1-5 | X1-4 | Heartwood | Preuve SQL réelle jetable + falsification | X1-4 | `verified` | `prove-v2-intent-expiry.mjs` 7/7 | faux |
| X1-6 | X1-5 | Ring | suite + gardes + push prod T-07d | X1-5 | `in_progress` | hash === local | déploiement |

## Non-goals (hors X1)

- `SCOUT-01` (couverture mondiale) — en cours via `POP`.
- `room`, `seller-automation` — tranches X3/X2, après X1.
- Terrain `TT-1`/`TT-2` — owner fondateur.

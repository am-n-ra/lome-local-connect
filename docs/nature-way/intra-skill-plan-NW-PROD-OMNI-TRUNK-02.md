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
| X1-6 | X1-5 | Ring | suite + gardes + push prod T-07d | X1-5 | `done` | hash === local (index-het4xWEB.js) | déploiement |

## Non-goals (hors X1)

- `SCOUT-01` (couverture mondiale) — en cours via `POP`.
- `room`, `seller-automation` — tranches X3/X2, après X1.
- Terrain `TT-1`/`TT-2` — owner fondateur.

## X2 — Automatisation vendeur (décision fondateur « construire »)

| ID | Parent | Phase | Objective | Depends on | Status | Acceptance / proof | Re-plan trigger |
|---|---|---|---|---|---|---|---|
| X2-1 | X1 | Root | Contrat `omni-trunk-x2-auto-availability-contract` | décision | `verified` | doc contrat | décision change |
| X2-2 | X2-1 | Root | Migration `068` : colonne `auto_availability` + `v2_reconcile_auto_availability()` | X2-1 | `verified` | jetable 9/9 + canonique + registre `da5b2e63…` | régression |
| X2-3 | X2-2 | Root | Repo `setProductAutoAvailability` / `refreshProductAvailability` + réconcile opportuniste | X2-2 | `verified` | tsc + tests | faux |
| X2-4 | X2-3 | Root | HTTP + client + types | X2-3 | `verified` | tests | faux |
| X2-5 | X2-4 | Trunk | Carte « Automatisation · disponibilité » (`SellerV13`) | X2-4 | `verified` | rendu (tests compilent le JSX) | faux |
| X2-6 | X2-5 | Heartwood | Preuve SQL réelle + falsification (garde `bientôt`) | X2-5 | `verified` | `prove-v2-auto-availability.mjs` 9/9 ; mutée 1 FAIL | faux |
| X2-7 | X2-6 | Ring | suite + gardes + push prod T-07d | X2-6 | `in_progress` | hash === local | déploiement |

## X3 — Room acheteur (à cadrer ; réponse fondateur : surface dédiée)

Room = surface unique par transaction (suivi + chat scopé + reçu + actions). Serveur
`v2_transaction_messages` déjà présent ; chat présent dans `BuyerFlowV13`. Manque : la Room
dédiée atteignable depuis « Transactions en cours ». Cadrage à ouvrir après X2.

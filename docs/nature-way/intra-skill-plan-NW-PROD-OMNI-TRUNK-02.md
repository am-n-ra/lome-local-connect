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
| 3 | `TRUNK-X2` seller-automation | modèle auto-dispo + slice | décision modèle → contrat → code | **`done`** — `068` appliquée canonical, preuve jetable 9/9 + falsification, 843/843, prod `index-IZJxtU8O.js` === local (`3d19a50`) | fait contredit |
| 4 | `TRUNK-X3` room | surface chat acheteur | contrat + code + preuve | `in_progress` (contrat rédigé 2026-10-07) | fondateur |

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
- **Terrain `TT-1`/`TT-2` — owner fondateur, et par décision fondateur 2026-10-07 : `vient EN DERNIER`, après clôture de TOUTES les portes Nature Way (Seed → Species → Root → Trunk → Heartwood → Branches → Canopy → Ring). Le terrain n'est jamais une slice Trunk.**

## X2 — Automatisation vendeur (décision fondateur « construire »)

| ID | Parent | Phase | Objective | Depends on | Status | Acceptance / proof | Re-plan trigger |
|---|---|---|---|---|---|---|---|
| X2-1 | X1 | Root | Contrat `omni-trunk-x2-auto-availability-contract` | décision | `verified` | doc contrat | décision change |
| X2-2 | X2-1 | Root | Migration `068` : colonne `auto_availability` + `v2_reconcile_auto_availability()` | X2-1 | `verified` | jetable 9/9 + canonique + registre `da5b2e63…` | régression |
| X2-3 | X2-2 | Root | Repo `setProductAutoAvailability` / `refreshProductAvailability` + réconcile opportuniste | X2-2 | `verified` | tsc + tests | faux |
| X2-4 | X2-3 | Root | HTTP + client + types | X2-3 | `verified` | tests | faux |
| X2-5 | X2-4 | Trunk | Carte « Automatisation · disponibilité » (`SellerV13`) | X2-4 | `verified` | rendu (tests compilent le JSX) | faux |
| X2-6 | X2-5 | Heartwood | Preuve SQL réelle + falsification (garde `bientôt`) | X2-5 | `verified` | `prove-v2-auto-availability.mjs` 9/9 ; mutée 1 FAIL | faux |
| X2-7 | X2-6 | Ring | suite + gardes + push prod T-07d | X2-6 | `done` | hash === local (index-IZJxtU8O.js) | déploiement |

## X3 — Room acheteur (cadrage OUVERT 2026-10-07 — contrat rédigé)

**Contrat + cadrage :** `docs/nature-way/omni-trunk-x3-room-contract-2026-10-07.md` (**rédigé, aucun code**).
Room = surface unique par transaction (suivi + **chat fil complet** + reçu + actions honnêtes), symétrique
du vendeur (S-27). Backend `v2_transaction_messages` **existe déjà** ; le chat **inline** dans `BuyerFlowV13`
n'affiche que 4 messages et il **n'existe aucune surface dédiée**. Manque aussi une lecture `listTransactions`
(toutes, clôturées incluses) pour l'écran « Mes transactions » — `listOpenTransactions` exclut les clôturées.

| ID | Parent | Phase | Objective | Depends on | Status | Acceptance / proof | Re-plan trigger |
|---|---|---|---|---|---|---|---|
| X3-1 | X2 | Root | Contrat Room (doc `omni-trunk-x3-room-contract`) | — | `review` | doc contrat + décisions fondateur §6 | décision change |
| X3-2 | X3-1 | Root | Lecture `listTransactions` (toutes) : repo + HTTP + client + type | X3-1 | `todo` | SQL réel jetable + filtre membre | faux |
| X3-3 | X3-2 | Trunk | Surface Room acheteur (suivi + chat complet + reçu + actions) | X3-2 | `todo` | rendu jsdom | faux |
| X3-4 | X3-2 | Trunk | Écran « Mes transactions » (ouvertes+clôturées → ouvre la Room) | X3-2 | `todo` | rendu jsdom | faux |
| X3-5 | X3-3,X3-4 | Heartwood | Preuve SQL réelle jetable + falsification (non-membre, fil complet, reçu) | X3-3,X3-4 | `todo` | `prove-v2-room.mjs` + falsification | faux |
| X3-6 | X3-5 | Ring | suite + gardes + push prod T-07d | X3-5 | `todo` | hash === local | déploiement |

**Décisions fondateur posées (§6 du contrat) :** périmètre acheteur seul vs + vue vendeur · « Signaler un problème »
(désactivé honnête vs canal réel) · `listTransactions` borné N=50 vs pagination.

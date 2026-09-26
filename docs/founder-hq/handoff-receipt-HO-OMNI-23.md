# Handoff Receipt — `HO-OMNI-23`

> **Plan ID:** `HQ-OMNI-2026-09-02` · **Local plan:** `NW-PROD-OMNI-RD-01`
> **Date:** 2026-09-26 (UTC, soir)
> **Trigger:** founder message — « on a assez tourné en rond… je pense qu'on a raté tout le process depuis Species… tout le fond et la logique qui doit faire de omni omni n'est pas là et même il y a beaucoup d'incohérence dans ce qu'on veut réellement faire et proposer »

## Dispatch Record

| Field | Value |
|---|---|
| **Objective class** | Mixed — product diagnosis (primary) + venture evidence (secondary) |
| **Reversibility** | Read-only diagnosis + one delivered slice; no irreversible commitment |
| **Primary skill** | `/nature-way` — product phase, dependency path, contract, proof gate |
| **Secondary route** | `/nature-way-venture-lifecycle` — *only if* the founder confirms the uncertainty is demand/distribution, not product |
| **Activation status** | `activated` — this session executed under the Nature Way root plan |
| **Artifacts inspected** | `docs/founder-hq/founder-hq-master-plan.md` · `founder-hq-board.md` · `omni-root-finishing-inventory-2026-09-25.md` · `hq-reconciliation-2026-09-26.md` · canonical DB (live counts) |
| **First gate** | `ROOT` (Species closed `founder-confirmed` 2026-09-25) |

## Resource Receipt

| Status | Path |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `references/ecosystem-orchestration-protocol.md` |
| Loaded | `references/ecosystem-activation-manifest.md` |
| Loaded | `references/intra-skill-execution-controller.md` (via the RD-01 plan) |
| Template instantiated | `templates/skill-handoff-receipt.md` (this document) |
| Loaded (state of record) | `docs/nature-way/omni-root-finishing-inventory-2026-09-25.md` · `docs/founder-hq/handoff-receipt-HO-OMNI-22.md` · `docs/nature-way/omni-rd-rc-evidence-2026-09-26.md` |
| Not loaded / reason | `references/portability-protocol.md` — no export/migration. `templates/founder-hq-master-plan.md` — the plan exists and was reconciled, not re-created. |

## The founder's three claims, measured

| Founder claim | Verdict | Evidence |
|---|---|---|
| « on a raté tout le process depuis Species » | **Partly true — and the truth is narrower than it feels.** | Species V2 is real: 74 screens, registry truthful, `founder-confirmed` 2026-09-25. Seed V2 is real: 3 entities, 13 published offers, the entity↔offer two-level search. **What was actually missed is not the process — it is the *execution and synchronisation* of the base.** Three production-blocking defects were live until 2026-09-26 (`RB-PROD-1/2/3`: no seller could create a facility, no offer could be created, the buyer map returned HTTP 500). **That is a real, serious miss** — and it is exactly why « on tourne en rond » felt true. |
| « tout le fond et la logique qui doit faire de omni omni n'est pas là » | **True on one measured layer; false as a blanket statement.** | The *machinery* is real and proven: the 10-state transaction machine with server-enforced actor transitions, QR gateway, stock reservation, wallet ledger, bulk credits, trust thresholds, Pro renewal, team governance — 638 tests + E2E proofs. **What is missing is supply, not logic**: **206 map facilities, only 3 owned**; 13 published offers; 3 entities; 12 transactions ever. The "map-first representation of the world's supply" currently represents **3 real sellers**. |
| « beaucoup d'incohérence dans ce qu'on veut réellement faire et proposer » | **True, and it is the corrigible part.** | Two concrete, this-session examples: (1) the inventory described `R-D` as « fixture + preuve, effort petite » when in fact **no code path could produce an `individu`** — a fixture would have proven a path that did not exist; (2) three published offers sat on facilities **no seller could ever answer** — a request would expire in 15 min, 0 credits, with no possible response. Both are now closed. |

## Delivered this pass

- **`R-C`** — the 3 ownerless published offers are archived: ownerless published **3 → 0**, published **16 → 13**. The fixture ledger already declared them fixtures.
- **`R-D`** — the `individu` path now exists (validator + repository + client + seller form) and is proven end-to-end: **1 sale confirms an individual, 3 an organisation**.
- **Two real bugs** the E2E proof found, invisible to 638 unit tests: a bound int parameter is inferred as **`text`** inside a CTE (breaking `least()`/comparison at **all four** threshold sites — which is why no `individu` row existed to reveal it), and the distinct-buyer counter **lagged one sale** by Postgres snapshot semantics.
- Push verified, not assumed: prod serves `index-Ck-_DzRo.js` === local build, GitHub deployment confirmed for `c6e973b`. **`T-07d` ✅**

## Residual gap and owner

| Item | Owner | Next smallest action |
|---|---|---|
| Supply is 3 owned facilities / 206 | **founder** | A real seller act — not a code slice. This is Gate 7 terrain, not Root. |
| `R-B` characteristics **0/16** in data | **founder** (seller act) | Write characteristics for real offers |
| `R-D` has no browser proof of the new control | OpenHands | Capture on the next authenticated spot-check |
| Founder decision: is the next uncertainty **product** or **demand/distribution**? | **founder** | Answer determines whether `/nature-way` or `/nature-way-venture-lifecycle` owns the next gate |

## Review trigger

Re-plan when the founder answers the product-vs-demand question, or when real supply is added (which would change every number above).

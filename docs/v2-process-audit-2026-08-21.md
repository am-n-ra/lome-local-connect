# Omni V2 — One-Shot Process Audit

**Date:** 2026-08-21

**Status:** Audit complete; reconciliation required before implementation

## Finding

The V2 branch currently contains a strong flow contract in `v2-flow.md` and a product requirements document in `omni-v2-prd.md`, but the package does not yet follow the complete one-shot-product-build hierarchy through vertical slices. The documents are useful, but their authority and derivation relationship are not explicit enough to prevent drift during implementation.

## Current layer assessment

| Layer | Status | Evidence | Gap |
|---|---|---|---|
| 1. Brainstorm | Partial/complete | Product identity, core loop and non-goals exist in `v2-flow.md` and the PRD. | The approved identity should be copied into one canonical master rather than repeated. |
| 2. Flow validation | Partial/complete | `v2-flow.md` contains state machines for map, buyer, seller, transaction, QR and wallet. | Some state-to-screen, timeout-owner, timer, test and terminal-state details need one normalized contract. |
| 3. Master document | Not yet established for V2 | Existing `docs/OMNI_MASTER_PRODUCT_INTERFACE.md` is historical/V1-oriented; `v2-flow.md` is a flow contract, not a complete master. | Create one V2 master with patch note, scope gate, full vision, links to validated flows and business-rule authority. |
| 4. Build artifacts | Partial | `omni-v2-prd.md` is a broad product artifact; old one-shot documents are V1-derived. | Derive a concise architecture and V2-specific data/schema and flow artifacts only after the master is frozen. |
| 5. Execution | Not started | Application source is an intentional clean slate. | Create end-to-end vertical slices where each ticket includes data, server/API, UI, authorization/rules and tests. |

## Authority decision

The V2 package will use at most three authoritative documents:

1. `v2-master.md` — canonical product brief, scope gate, full vision, decisions and references to validated flows.
2. `v2-flow.md` — canonical state/transition/permission contract.
3. `v2-product-interface-architecture.md` — combined product/interface/architecture contract generated after flow validation.

`omni-v2-prd.md` will remain a derived PRD snapshot until the master is established. The old V1 master and old one-shot files remain historical references and must not be treated as V2 authorities.

## Required next artifacts

| Artifact | Type | When generated |
|---|---|---|
| `v2-master.md` | Authoritative master | Now, after reconciling PRD and flow. |
| `v2-product-interface-architecture.md` | Authoritative combined contract | After master and flows are frozen. |
| `v2-flow-spec.md` | Derived implementation flow spec | From master and `v2-flow.md`. |
| `v2-data-schema.md` | Derived data/rules artifact | From master and flow authority. |
| `v2-vertical-slices.md` | Derived execution backlog | After architecture and schema seams exist. |
| Per-slice build prompts | Derived prompts | One at a time immediately before implementation. |

## Drift findings to resolve

- The PRD and flow contract repeat scope and state concepts; the master must become the single product decision surface.
- The exact boundary between `certified`, `unconfirmed` and `confirmed` must remain explicit, including the three qualifying completed sales and the non-cash $20 credit unlock.
- The PRD names the external payment flow but the flow contract owns the authoritative state machine; derived artifacts must not introduce in-app payment.
- The wallet must remain one Omni Wallet with FedaPay recharge only; bucket names and spending priority stay open until a master patch resolves them.
- Build-manual OSM backfill and admin review need operator steps, measurements and graduation conditions.
- The initial vertical slice must be the highest-risk observable buyer loop, not a frontend-only map shell or backend-first schema phase.

## Exit condition for reconciliation

A V2 master is ready when a competent implementer can identify the product identity, scope status, authoritative flow reference, non-goals and current open decisions without consulting the historical V1 documents.

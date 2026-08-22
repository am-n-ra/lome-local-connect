# Omni V2 — Root System Proof Ledger

**Document ID:** `OMNI-V2-ROOT-PROOF-001`
**Method:** Nature Way — Phase 2, Root System
**Status:** `review`
**Parent:** [`v2-roots.md`](./v2-roots.md)
**Related:** [`v2-seed.md`](./v2-seed.md), [`v2-species.md`](./v2-species.md), [`v2-flow.md`](./v2-flow.md), [`v2-tasks.md`](./v2-tasks.md)

## Purpose

This ledger records whether the Root System contract is documented, implemented, tested or still open. A written contract is not the same as runtime proof. The ledger must remain honest until the first vertical Trunk slice exercises the authoritative seams.

## Current acceptance matrix

| Root area | Contract status | Runtime evidence | Gate status | Remaining proof |
|---|---|---|---|---|
| Browser/server boundary | Defined in Root System | Historical boundary checks exist in the prior implementation | `review` | Re-run against the clean Trunk seam |
| Neon Auth identity linking | Defined as idempotent and identity-preserving | Existing production branch has preserved identities; real session path is not re-proven here | `review` | Live sign-in, bearer verification and duplicate-provisioning proof |
| Domain ownership | Defined for Identity, Capacity, Company, Facility, Trust, Discovery, Map Context, Catalogue, Availability, Entitlements, Wallet, Transactions, Communications and Operations | Documented only in this ring | `review` | Schema review plus ownership/forgery tests |
| Persistence and migration | Additive, namespaced and preservation-first | No migration executed in this architecture ring | `review` | Forward check, preserved-row check, rollback/recovery record |
| Public discovery and map facts | Pins/clusters/source status separated from stock and trust | Prior bounded discovery evidence exists; new map contract is documented | `review` | Map/API contract integration and source-failure proof |
| Trust and certification | Claim, evidence, admin review, unconfirmed and confirmed transitions defined | No new certification implementation in this ring | `review` | Positive/negative transition tests and admin audit evidence |
| Catalogue and availability | Facility-scoped catalogue and non-reserving availability defined | Prior public catalogue/availability surface exists, but it is not proof of the new Root gate | `review` | Server contract tests, stale/error/retry/recovery proof |
| Wallet and entitlements | One rechargeable Omni Wallet, append-only ledger, facility-scoped Pro and locked bonus defined | No live recharge or ledger mutation executed in this ring | `review` | Ledger invariant, replay, failed recharge and non-withdrawal proof |
| Intent and transaction | Immutable snapshot, server transition, protected room and resumability defined | No new transaction implementation in this ring | `review` | Duplicate intent, authorization and state-transition proof |
| QR and external payment | Hashed expiring server token, replay-safe verification and declaration-only external payment defined | No live QR/payment proof in this ring | `review` | QR mismatch/expiry/replay and actor-forgery proof |
| Map route boundary | `MapContextSnapshot`, protected `getRoute`, no pre-intent private location defined | Maquette and contract only; no route provider call is claimed | `review` | Authorized route seam, unavailable-provider state and privacy proof |
| Recovery | Map, query, selection, request, intent and transaction context defined as recoverable | No full runtime recovery proof in this ring | `review` | Refresh/back/reconnect/expired/manual recovery tests |
| Analytics and privacy | Event minimization, consent, pseudonymous identity and retention boundary defined | No analytics pipeline changed in this ring | `todo` | Event schema review and privacy test |

## Required Root exit evidence

The Root System cannot move to Trunk merely because this document exists. The following evidence is required:

1. A typed browser/server boundary check proving that database clients, secrets and server-only modules do not reach the client bundle.
2. A schema and constraint review covering the identity reference, facility/company ownership, trust lifecycle, catalogue limits, one-wallet rule, ledger append-only behavior, intent uniqueness, QR replay state and transaction membership.
3. An authorization matrix with positive and forged-request cases for visitor, buyer, seller, admin and operator actors.
4. A migration forward check showing that Neon Auth identities, legacy tables and historical records remain preserved. Destructive operations are prohibited unless separately approved.
5. An idempotency and audit proof for every sensitive mutation, including account provisioning, availability, intent, recharge, QR verification and transaction events.
6. A map/privacy proof showing that public pins and clusters never imply supply, and that route data is unavailable before confirmed intent and transaction membership.
7. Recovery evidence for refresh, back, reconnect, stale state, duplicate request, expired QR, unavailable source, denied location/camera and unavailable route provider.
8. A labelled fixture ledger showing which records are bounded fixtures and preventing them from being presented as marketplace or user success.
9. A stable API seam and proof plan for the first buyer Trunk: map → search → discovery → facility → catalogue → availability → comparison.

## Nature Way decision

**Decision:** keep Trunk implementation blocked until the acceptance evidence above is either produced or explicitly marked `manual`, `partial`, `blocked` or `deferred` with an owner and recovery path.

The Root System is materially specified, including the new map contract, but it is not yet runtime-verified. This is an intentional gate, not a failure: it prevents a visually complete maquette or historical prototype from being mistaken for a complete production foundation.

# Omni V2 — Root System Proof Ledger

**Document ID:** `OMNI-V2-ROOT-PROOF-001`
**Method:** Nature Way — Phase 2, Root System
**Status:** `review`
**Parent:** [`v2-roots.md`](./v2-roots.md)
**Related:** [`v2-seed.md`](./v2-seed.md), [`v2-species.md`](./v2-species.md), [`v2-flow.md`](./v2-flow.md), [`v2-root-schema-review.md`](./v2-root-schema-review.md), [`v2-root-live-evidence.md`](./v2-root-live-evidence.md), [`v2-root-live-api-evidence.md`](./v2-root-live-api-evidence.md), [`v2-root-auth-evidence.md`](./v2-root-auth-evidence.md), [`v2-root-qr-evidence.md`](./v2-root-qr-evidence.md), [`v2-root-closure-register.md`](./v2-root-closure-register.md), [`v2-root-state-evidence.md`](./v2-root-state-evidence.md), [`v2-root-disposable-migration-evidence.md`](./v2-root-disposable-migration-evidence.md), [`v2-trunk-entry-boundary.md`](./v2-trunk-entry-boundary.md), [`v2-tasks.md`](./v2-tasks.md)

## Purpose

This ledger records whether the Root System contract is documented, implemented, tested or still open. A written contract is not the same as runtime proof. The ledger must remain honest until the first vertical Trunk slice exercises the authoritative seams.

## Current acceptance matrix

| Root area | Contract status | Runtime evidence | Gate status | Remaining proof |
|---|---|---|---|---|
| Browser/server boundary | Defined in Root System | TypeScript/Vite build, Vercel bundling, `check:boundary`, canonical public/protected API smoke, branch JWKS reachability and fail-closed malformed-token tests pass; connected-browser inspection returned HTTP 504 | `review` | Re-run browser bundle/interaction inspection when bridge responds |
| Neon Auth identity linking | Defined as idempotent and identity-preserving | Read-only checks report 35 `neon_auth.user` rows on both persistent and disposable branches with matching aggregate Auth-ID checksum `ed098a8cfa789278524d3b99c8b7133c` and schema checksum `436113c870a83fee9caf861df0cceaf5`; branch Auth config includes the canonical trusted origin and reachable EdDSA JWKS; malformed bearer handling fails closed in local tests; canonical unauthenticated POST returns HTTP 401; no valid bearer/provisioning session was proven | `review` | Live sign-in, real-token verification and duplicate-provisioning proof |
| Domain ownership | Defined for Identity, Capacity, Company, Facility, Trust, Discovery, Map Context, Catalogue, Availability, Entitlements, Wallet, Transactions, Communications and Operations | Root/domain invariant tests and static schema review pass; database ownership enforcement gaps are recorded | `review` | Close same-account ownership and scope/FK gaps with server/schema proof |
| Persistence and migration | Additive, namespaced and preservation-first | Matching read-only counts show 35 Auth users, 26 V2 tables and 0 selected legacy tables on both persistent and disposable branches; persistent V2 has 0 V2 accounts/125 constraints, while the disposable branch has only 2 labeled fixture accounts/127 constraints after migration 003, plus 7 guard triggers and QR function behavior | `review` | Row-level/checksum comparison and rollback/recovery record |
| Public discovery and map facts | Pins/clusters/source status separated from stock and trust | Canonical `GET /api/v2/public/facilities` returns HTTP 200 with 3 bounded facilities; local marker and generated-bundle tests prove no public stock field on the V2 branch | `review` | Post-deploy public payload verification, map/API integration and source-failure proof |
| Trust and certification | Claim, evidence, admin review, unconfirmed and confirmed transitions defined | No new certification implementation in this ring | `review` | Positive/negative transition tests and admin audit evidence |
| Catalogue and availability | Facility-scoped catalogue and non-reserving availability defined | Canonical facility detail returns HTTP 200 with one published catalogue item; unauthenticated availability returns HTTP 401; public stock field removed and tested on V2 branch; authenticated persistence remains open | `review` | Wire validators into the live API transaction and prove stale/error/retry/recovery |
| Wallet and entitlements | One rechargeable Omni Wallet, append-only ledger, facility-scoped Pro and locked bonus defined | Disposable branch denies representative ledger update/delete attempts; no production wallet mutation executed | `review` | Ledger invariant, replay, failed recharge, deployed-writer permission and non-withdrawal proof |
| Intent and transaction | Immutable snapshot, server transition, protected room and resumability defined | Pure transaction state graph and actor-membership policy pass; disposable branch denies forged buyer intent; live persistence, event idempotency and recovery remain open | `review` | Persisted state transition, duplicate/concurrency and recovery proof |
| QR and external payment | Hashed expiring server token, replay-safe verification and declaration-only external payment defined | Pure QR policy plus disposable branch proves first verification `true` and second verification `false` with replay count remaining 1; no concurrent, live QR or payment proof | `review` | Concurrent transaction/row-lock proof, authenticated seller session and recovery |
| Map route boundary | `MapContextSnapshot`, protected `getRoute`, no pre-intent private location defined | Map context serializer/restorer and protected-route policy tests pass for pre-intent denial, non-member denial and authorized private visibility; no HTTP route/provider call is claimed | `review` | Authorized route seam, unavailable-provider state and privacy proof |
| Recovery | Map, query, selection, request, intent and transaction context defined as recoverable | Map-context round-trip and tamper rejection pass; full browser refresh/back/reconnect/expired/manual recovery remains open | `review` | Refresh/back/reconnect/expired/manual recovery tests |
| Analytics and privacy | Event minimization, consent, pseudonymous identity and retention boundary defined | No analytics pipeline changed in this ring | `todo` | Event schema review and privacy test |

## Validation checkpoint

The current repository checks pass: 10 Vitest files, 37 tests, TypeScript/Vite production build, Vercel function bundling and `check:boundary` (`Client boundary: clean`). The focused Root additions prove map-context round-trip/tamper rejection, public marker semantics, protected-route policy, published catalogue selection, forged availability-response rejection, public stock-field absence and QR policy denials, fail-closed malformed bearer handling and transaction state-machine authorization and additive migration guardrail review. Canonical smoke probes prove public discovery HTTP 200, facility detail HTTP 200 and unauthenticated availability HTTP 401. The static schema review is recorded in [`v2-root-schema-review.md`](./v2-root-schema-review.md); read-only Neon evidence is recorded in [`v2-root-live-evidence.md`](./v2-root-live-evidence.md), canonical API evidence in [`v2-root-live-api-evidence.md`](./v2-root-live-api-evidence.md), Auth/JWKS evidence in [`v2-root-auth-evidence.md`](./v2-root-auth-evidence.md) and QR policy evidence in [`v2-root-qr-evidence.md`](./v2-root-qr-evidence.md) and transaction state evidence in [`v2-root-state-evidence.md`](./v2-root-state-evidence.md). The new `003_v2_root_guardrails.sql` migration was executed only on an expiring disposable branch, where representative guard behavior and first-pass/second-pass QR behavior were verified; it has not been applied to the persistent V2 or production/default branch. These checks validate the local foundation, disposable migration execution, representative database guard behavior, count-level preservation and aggregate Auth checksum parity; they do not prove live Auth bearer acceptance, authenticated availability persistence, route provider authorization, concurrent QR replay or payment behavior.

## Live proof limitations

The canonical-domain browser navigation was attempted with the connected browser, but the browser bridge returned HTTP 504 before viewport/session inspection. This is recorded as an inspection blocker, not as a product success or failure. No login, form submission, mutation or credential handling was performed.

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
9. A stable API seam and proof plan for the first buyer Trunk: map → search → discovery → facility → catalogue → availability → comparison, as bounded in [`v2-trunk-entry-boundary.md`](./v2-trunk-entry-boundary.md).

## Nature Way decision

**Decision:** keep Trunk implementation blocked until the acceptance evidence above is either produced or explicitly marked `manual`, `partial`, `blocked` or `deferred` with an owner and recovery path.

The Root System is materially specified, including the new map contract, but it is not yet runtime-verified. The assigned blockers and their owners are recorded in [`v2-root-closure-register.md`](./v2-root-closure-register.md). This is an intentional gate, not a failure: it prevents a visually complete maquette or historical prototype from being mistaken for a complete production foundation.

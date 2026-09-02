# Omni V2 — Seed / Species / Root role-capability audit

**Date:** 2026-08-26  
**Structural path:** `product > role separation > Seller operational workspace`  
**Status:** `review / implementation not yet expanded`

## Executive finding

The owner’s diagnosis is correct. The current application has a **navigation exposure defect** and a **Seller product-scope gap**. `TrunkApp.tsx` renders `Outils terrain Omni` and `Revue des claims` for every authenticated `sessionUser`, without an Omni-role check.[1] The protected server routes do perform their own authorization checks, so the observed issue is primarily an incorrect navigation contract rather than evidence that ordinary buyers can execute those protected mutations.[2]

The current Seller implementation is a bounded availability-response mini-cycle: server-authorized Seller entry, owned-facility request queue, response form, and limited transaction/QR handoff controls.[3] It does **not** yet provide a complete Seller workspace with account context, applicant-to-ready onboarding, owned-facility CRUD, product CRUD/publish, balance summary, a defined Free→Pro commercial path, camera QR scanning, or transactional chat.

## Reconciled Seed

Omni remains a map-first geospatial supply-and-demand search engine. The map is the permanent spatial scene; Buyer, Seller, Reviewer and Operator surfaces are contextual surfaces above it, not unrelated dashboard pages.[4] The correct launch envelope is a small, explicitly labelled pilot for public/read-only discovery, feedback and bounded availability testing. It is not a broad production-ready marketplace claim.

The product must distinguish **Neon Auth identity**, **Omni account**, **Omni application role**, **Seller onboarding state**, **facility ownership**, **facility trust** and **commercial plan**. Neon Auth administrative metadata must not be used as a substitute for an Omni role. The server owns these facts and the client consumes a narrow, non-sensitive account-context contract.

### Actor and menu policy

| Actor state | Menu and surface ownership | Actions currently allowed or intended | Current truth |
|---|---|---|---|
| Visitor | Public map, public facility detail/catalogue, sign-in/create-account, install when available | Explore, inspect public source-backed facilities, authenticate | Existing public map/detail; protected actions gated by Auth.[4] |
| Ordinary authenticated Buyer | `Mes demandes`, `Inbox Omni`, account/install, Buyer search and availability | Search, request availability, resume own requests, read own Inbox | Buyer and Inbox routes exist; role context is missing; team entries are incorrectly visible today.[1][2] |
| Seller applicant | Buyer surfaces plus own claim draft/evidence/resume and applicant status | Start/resume a claim for an unowned facility, upload private evidence, submit, await review | Claim draft/upload/submit/cancel exists and is account-bound; Seller-ready operations remain locked.[5] |
| Seller-ready account | Buyer surfaces plus Seller Workspace | Operate owned facilities, manage catalogue, answer demand, manage allowed transaction handoff | Queue/response and bounded transaction controls exist; facility/product workspace, balance and chat are missing.[3][6] |
| Operator | Ordinary account surfaces plus `Outils terrain Omni` | Approved OSM discovery/import and field recovery | Operator role table and protected import/run routes exist; menu must be role-gated.[2][7] |
| Reviewer/Admin | Ordinary account surfaces plus `Revue des claims` and approved activation/suspension tools | Review evidence, certify/reject/request more evidence, activate/suspend Seller accounts | Reviewer queue and activation routes exist and are server-protected; menu must be role-gated.[2][5] |

A user may hold more than one separately granted Omni role. The UI should render the union of explicitly granted capabilities, while each server operation continues to authorize its own action. A generic authenticated user must never see team-only entries merely because a Neon Auth session exists.

## Species blueprint decision

The approved Species remains the shared **map-mounted contextual-surface language**: the map/globe stays mounted and dominant; the compact `Acheter / Vendre` switch remains the role entry; J5 remains the single account/navigation owner; Buyer, Seller, Reviewer and Operator sheets use the same safe areas, rounded surfaces, motion and responsive rules.[8]

Seller is not a visual copy of Buyer. It is a professional workspace with a clear operational hierarchy:

| Surface | Owner | Mobile behavior | Desktop behavior |
|---|---|---|---|
| Buyer discovery | Buyer | Bottom search dock and contextual result/facility sheets above a fixed map | Bounded floating sheets with map remaining visible |
| Seller workspace | Seller | Bottom-anchored, scrollable operational sheet with facility switcher and primary action | Bounded centered/floating workspace over the map; no dense SaaS rail by default |
| Reviewer/Admin | Reviewer/Admin | Queue/detail sheet with explicit evidence and decision state | Bounded review workspace with queue and detail ownership |
| Operator/Field Pilot | Operator | Field form with location map and import preview | Bounded operational sheet; map remains the spatial reference |
| Transaction handoff | Buyer + Seller | State-specific room/sheet; only authorized members see private content | Same state contract with larger readable context |

The Seller Species must add new maquette states before implementation of broad Seller branches: applicant/claim status, seller-ready empty workspace, facility list/create/edit, product list/create/edit/publish, plan/balance decision-pending state, QR camera permission/scan/fallback, transaction conversation, and loading/empty/error/retry/cancel/recovery states. Until those states are approved, the Seller implementation should grow only the selected Trunk slice.

## Root inventory and gap table

| Capability | Data/schema evidence | HTTP/client evidence | Authorization contract | Status / next gate |
|---|---|---|---|---|
| Auth identity → Omni account | `v2_accounts.auth_user_id`, onboarding state and suspension; buyer availability can auto-upsert an account/wallet | No account-context route or client type | Server binds Auth identity to account | **Present foundation; missing context read**. Add a narrow `GET /api/v2/account/context` through an existing function route, returning only safe role/capability summaries. |
| Explicit Omni roles | `v2_account_roles` supports `buyer`, `seller`, `operator`, `reviewer` with active/revoked state.[7] | No client wrapper/type for roles | Reviewer/operator use role-table checks; Seller queue/response uses `onboarding_state in ('seller_ready','complete')`.[5][6] | **Present but split**. Reconcile role-table semantics with Seller readiness in Root; do not infer from Neon Auth admin. |
| Role-gated menu | None required beyond context contract | `TrunkApp.tsx` shows all team actions for any `sessionUser`.[1] | Server routes still protect the mutations | **UI defect, first implementation**. Hide team entries for ordinary users and expose Seller entry state honestly. |
| Self-claim/onboarding | Facilities, verification request, private evidence and review tables exist; claim draft/submit/cancel is implemented.[5][9] | Claim wrappers/routes exist | Any authenticated, non-suspended account can create its own claim draft; reviewer separately reviews; activation is separate | **Partially present**. Business decision still required: self-claim allowed as applicant, and exact evidence/reviewer policy. Do not equate claim with Seller-ready. |
| Seller activation | `onboarding_state` and reviewer activation operation exist | Reviewer activation routes exist | Active reviewer plus eligible owned/certified facility; separate from certification | **Present bounded reviewer flow**. Preserve team approval unless owner explicitly changes policy. |
| Seller-owned facilities list/create/update | `v2_facilities` has `account_id`, location, trust, plan; free Facility Slot exists | No own-facility list/create/update route or client wrapper | Intended ownership must be account-bound; client cannot choose owner | **Missing API/UI**. Candidate Seller Trunk after policy confirmation. Location defaults to current user position with manual pin adjustment is a Species input, not yet an owned-facility operation. |
| Product catalogue list/create/update/publish | `v2_products` has facility ownership, price, stock allocation and publication state.[9] | Public detail/read and Seller catalogue preview only; no own-product CRUD/publish wrappers/routes | Must require facility ownership and active catalogue entitlement where applicable | **Missing API/UI**. Must define validation, publication state, allocation bounds and Free limit before implementation. |
| Plans / Free→Pro | Facility plan and entitlement tables exist: `free`, `pro_active`, `pro_expired`; entitlement kinds include `facility_pro`, `catalogue_limit`, `advanced_tools`.[10] | No billing, checkout, invoice, webhook, renewal or refund route | Existing state may be displayed; active entitlement must authorize named capabilities | **Commercial decision gate**. Do not add upgrade button that implies payment until owner defines benefits, price/currency, provider, renewal/expiry/refund/revocation/override. |
| Wallet / “balance” | One account wallet and ledger exist, with recharge/spend/bonus entry kinds.[9] | No balance summary route or Seller wallet UI | Ledger is server-authoritative; spend is platform consumption only; no payout/withdrawal | **Ambiguous product meaning / missing read UI**. Owner must define whether balance means platform wallet, earnings ledger or prepaid credit before any spend/checkout. |
| Availability response | Requests/responses and Seller queue/response routes exist | Client wrappers and Seller sheet exist | Seller-ready account, owned facility, matching published product, freshness/idempotency | **Bounded Trunk proven**. Keep as foundation; do not represent it as complete Seller operations. |
| Transaction state / external payment | Intent, members, snapshots, events, QR, external payment declaration and fulfilment tables/routes exist.[9] | Buyer/Seller wrappers and bounded demo proof exist | Transaction membership and actor role are checked server-side | **Bounded proof only**. External payment is declaration/acknowledgement, not settlement, payout or payment-rail proof. |
| QR issuance / verification | QR token table and manual token hash verification route exist.[9] | Issue/verify wrappers; Seller UI accepts transaction ID/manual payload | Current verify operation requires Seller actor/member | **Manual QR exists; camera missing**. Owner must confirm who scans whom and the handoff state before camera implementation. |
| Transaction chat/messages | No conversation/thread/message schema in base migration | No HTTP route, client wrapper, type or UI | Private contact/chat is intended only after authorized intent | **Missing Root entirely**. Define participants, retention, moderation/reporting, attachments and notifications first. |
| Inbox / push | Notification events/deliveries and Web Push subscription tables exist.[7] | Inbox/push routes and UI exist | Recipient account binding; push is opt-in | **Inbox exists; delivery breadth partial**. Do not claim broad push delivery until VAPID/configuration and device proof close. |
| OSM / Field Pilot | Public sources, discovery runs and operator runs exist | Operator import/discovery routes and UI exist | Active operator role required server-side | **Bounded operational capability**. Do not expose to ordinary users; no need to rebuild for this gate. |

## Root decisions blocking broad Seller implementation

The following decisions change schema, state machines, authorization or money/communication boundaries and therefore require explicit owner confirmation before coding:

1. **Seller applicant policy:** may an authenticated applicant claim an OSM facility and submit evidence independently, with manual team review and separate activation, or must all claims be initiated by the Omni team? The existing implementation supports applicant self-claim drafts, while activation remains reviewer-controlled.[5]
2. **Free/Pro policy:** exact Free catalogue capacity, Pro benefits and advanced tools, price and currency, payment provider, upgrade/downgrade, renewal/expiry, refund/revocation and manual override rules. Current plan records do not answer these questions.[10]
3. **Balance meaning:** platform-only Omni Wallet, earnings/ledger visibility, prepaid feature credit or another model. The current schema supports a single platform-consumption wallet and explicitly does not support seller payouts/withdrawals.[4][9]
4. **Transaction communication:** participants, when contact opens, message retention, moderation/reporting, attachments, notification model and support access. No chat persistence exists yet.
5. **QR actor:** seller scans the buyer’s handoff QR, buyer scans a seller QR, or a two-step exchange. The current protected verification route is seller-actor based, so camera work must follow the confirmed contract.

## First implementation gate

The smallest safe implementation is **Role Context + Navigation Hardening**:

- add a server-backed context read using the existing 12-function routing constraint;
- return active app roles, Seller onboarding state, suspension, owned-facility count and safe capability flags, never raw tokens, secrets or unnecessary Auth identifiers;
- load it after an authenticated session is available and treat loading/error as a locked/neutral state;
- render `Mes demandes` and `Inbox Omni` for ordinary authenticated accounts;
- render Field Pilot only for active Operator, Review only for active Reviewer, and Seller Workspace only for a Seller-ready capability or an explicitly approved applicant state;
- keep server authorization unchanged and add negative tests proving an ordinary Buyer cannot reach team operations through UI state or direct route calls;
- keep the demo rebind hidden from all non-demo contexts and never expose it as onboarding.

Its definition of done is not merely “the buttons disappeared.” It must include context endpoint tests, role matrix tests, menu render tests, unauthorized route tests, loading/error recovery, production build with exactly 12 functions, and a canonical read-only smoke with no role mutation.

## References

[1]: ./src/trunk/TrunkApp.tsx "Active account menu and role entry rendering"
[2]: ./src/server/http.ts "Authoritative V2 HTTP route and authentication boundary"
[3]: ./v2-seller-mini-cycle.md "Seller availability-response mini-cycle and explicit non-goals"
[4]: ./v2-seed.md "Omni V2 authoritative Seed and product laws"
[5]: ./src/server/trunk-repository.ts "Claims, review, activation and Seller authorization queries"
[6]: ./src/server/roots-operations.ts "Domain ownership, Seller and transaction invariants"
[7]: ./db/migrations/006_v2_field_pilot_registry.sql "Omni application roles, operations and notification schema"
[8]: ./v2-seller-reviewer-mini-species.md "Shared Seller/Reviewer Species blueprint"
[9]: ./db/migrations/001_v2_roots.sql "Base V2 data model and constraints"
[10]: ./docs/plans-and-entitlements.md "Current Free/Pro and entitlement boundary"

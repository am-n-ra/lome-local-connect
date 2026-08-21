# Omni V2 — Product / Interface / Architecture Contract

**Version:** 1.0.0 · **Derived from:** [`v2-master.md`](./v2-master.md) and [`v2-flow.md`](./v2-flow.md)

> This is a derived implementation contract. It may not change product scope, state authority, money movement or unlock rules from the master.

## 1. Technical boundary and stack

| Layer | V2 decision |
|---|---|
| Frontend | React 19, TanStack Start/Router, TypeScript and Tailwind CSS v4. |
| Map | MapLibre GL v5 with one persistent globe/map instance and server-visible-bounds discovery. |
| Backend | TanStack Start server functions/routes with typed request/response contracts. |
| Database | Neon Postgres with PostGIS; V2 owns a separate Neon branch and migration history. |
| Auth | Neon Auth remains available, but private actions are authorized server-side by actor, role, resource and state. |
| External services | OSM/Overpass for manual/bounded discovery and FedaPay for Omni Wallet recharge only. |
| Deployment | V2 preview/deployment is separate from V1 application/database state. |
| Testing | Vitest for pure/state/server logic; build/client-boundary checks; browser/device proofs for auth, map, camera and transaction risk. |

Browser code must never import secrets, database drivers, server-only modules or platform-only APIs directly or transitively. Screen data crosses a typed adapter seam. Mock adapters are allowed during UI construction but must expose the same contract as real server adapters.

## 2. Core data model summary

| Entity | Ownership and immutable facts |
|---|---|
| `facility` | Public/source identity, geometry, status, owner/company relation, verification outcome and operational visibility. Public source data does not prove supply. |
| `facility_verification_request` | Claim/create request, evidence draft/submission, review outcome, actor, reason and audit references. |
| `company` | Seller/company identity and relationship to facilities. |
| `product` | Facility-owned catalogue identity, media, price, stock and Omni allocation. |
| `coupon_offer` | Server-defined eligibility, discount, expiry and redemption policy. |
| `availability_request` | Buyer, selected facility/product, scope, quantity, budget and constraints; does not reserve stock. |
| `availability_response` | Seller/approved-auto response, status, freshness, quantity, price and message. |
| `transaction` | Idempotent purchase context and immutable product/facility/price/coupon snapshot. |
| `transaction_event` | Append-only state transition/audit event with actor, prior/next state and idempotency key. |
| `transaction_qr` | Server token reference, expiry, transaction binding and redemption/replay state; raw token is not analytics data. |
| `wallet_ledger` | One Omni Wallet deposit/spend ledger with pending/available/restricted states and FedaPay reconciliation reference. |
| `notification` | Transactional deep-link event with safe context and read state. |
| `analytics_event` | Consent-aware, pseudonymous, minimized product event separate from private audit/payment/evidence data. |

Detailed constraints and server/UI mappings belong in [`v2-data-schema.md`](./v2-data-schema.md).

## 3. API and event surface

| Surface | Caller | Input | Success | Important failure/rule |
|---|---|---|---|---|
| `listFacilitiesInBounds` | Public/buyer | bbox, zoom, filters, entitlement context | source-backed facilities/clusters | Empty is not import failure; server owns coverage scope. |
| `getFacility` | Public/buyer/seller | facility id, safe context | public facility projection | Private fields omitted before intent/authorization. |
| `listFacilityProducts` | Public/buyer/seller | facility id, query context | active catalogue products | Product authority remains server-side. |
| `createAvailabilityRequest` | Buyer | product/facility/scope/quantity/budget/constraints/idempotency key | request id and response stream/state | Does not reserve stock; entitlement and scope enforced server-side. |
| `respondAvailability` | Seller/approved adapter | request id, status, quantity, price/message, idempotency key | response state | Seller ownership, freshness and stock rules enforced. |
| `createVerificationRequest` | Seller | facility/create payload, evidence draft, idempotency key | verification request | Never changes facility status. |
| `reviewVerification` | Admin | request id, outcome, reason, evidence refs, idempotency key | audited outcome | Only review authority may produce status outcome. |
| `upsertProduct` | Seller | facility/product/media/price/stock/Omni allocation/coupon | validated product | Allocation cannot exceed stock; coupon state server-owned. |
| `createPurchaseIntent` | Buyer | eligible response id, idempotency key | transaction context | One response produces one transaction. |
| `generateTransactionQr` | Buyer/server | transaction id | expiring QR reference | Transaction must be authorized and open. |
| `redeemTransactionQr` | Seller | transaction id/code or scanner result/idempotency key | seller verified | Expired, replayed, malformed and mismatched codes reject explicitly. |
| `declareExternalPayment` | Buyer | transaction id, external method, idempotency key | payment declared | Does not mean seller received money. |
| `confirmPaymentReceived` | Seller | transaction id, idempotency key | payment received | Seller authority; cannot be buyer declaration alone. |
| `markFulfilment` | Seller | transaction id, method/status, idempotency key | fulfilment state | Seller/transaction authorization required. |
| `confirmReceiptAndRate` | Buyer | transaction id, receipt/rating | completed/rated | Only after fulfilment and receipt eligibility. |
| `createWalletRecharge` | Buyer/seller | amount, FedaPay reference intent | pending recharge | Pending is not spendable. |
| `reconcileWalletRecharge` | Server/FedaPay callback | provider reference/signature | wallet available or failed | Server callback authority; idempotent ledger. |

All mutations require authorization, current-state checks, safe errors and idempotency where duplicate user actions could create money, trust or transaction corruption.

## 4. Repository shape

```text
src/
  routes/                 # map, seller, admin, auth and transaction route surfaces
  components/             # shared sheet, map chrome, dock and surface primitives
  features/               # vertical-slice UI and typed adapters
  lib/server/             # server-only functions, authorization and integrations
  lib/shared/             # state machines, schemas and shared types
  styles.css              # V2 tokens and global map-first layout
  routeTree.gen.ts        # generated route tree
migrations/               # V2-only Neon migrations
contracts/                # generated/checked shared contracts if needed
 tests/                   # unit, integration and slice proof helpers
```

The current application tree is intentionally minimal. A slice may add only the directories it owns. No V1 route/component or migration is restored as an implicit dependency.

## 5. Slice seams

| Slice | Data seam | API seam | UI seam | Test seam |
|---|---|---|---|---|
| S0 foundation | schema/version registry | health/typed mock adapter | root/map shell | build, boundary, state tests |
| S1 buyer discovery | facility/source/coverage | `listFacilitiesInBounds`, `getFacility` | globe, dock, pins, cards, facility sheet | map/search state and public smoke |
| S2 catalogue availability | product/request/response | catalogue, availability and response endpoints | catalogue, four-stage availability, comparison | ordering, entitlement and retry tests |
| S3 seller verification | company/evidence/review | verification request/review endpoints | onboarding/admin review | role/status/audit tests |
| S4 seller operations | product/coupon/request | seller mutations and response endpoints | seller map workspace, product/coupon/request panels | stock/offer/response tests |
| S5 intent transaction | transaction/events | intent, room, resume and message endpoints | transaction room/timeline | idempotency/state authorization tests |
| S6 QR fulfilment | QR/redemption/payment/fulfilment | QR, payment and fulfilment endpoints | buyer room, seller scanner and actions | replay/camera/manual/transition tests |
| S7 wallet/PWA | wallet ledger/notification/events | recharge/reconcile/spend endpoints | wallet, notifications, PWA/resume | ledger/reconciliation/responsive checks |

No slice depends on an unstated “all backend first” phase. Each seam has a mockable typed boundary and a focused proof.

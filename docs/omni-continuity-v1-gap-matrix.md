# Omni V1 Continuity — Gap Matrix

**Baseline:** `main` at commit `e1a0d99`  
**Scope:** audit only; no functional code changes are made by this document  
**Related source of truth:** [`omni-continuity-v1-source-of-truth.md`](./omni-continuity-v1-source-of-truth.md)

## Decision legend

| Decision | Meaning |
|---|---|
| Reuse | Existing implementation is aligned; add tests or small contract adapters only. |
| Refactor | Existing behavior is valuable but composition/state ownership is too coupled. |
| Replace surface | Existing surface creates contradictory flows or duplicate UI; keep backend contracts where valid. |
| Backend contract gap | UI cannot be completed honestly without a server function, schema, permission or invariant. |
| Keep deferred | Not part of continuity V1; hide from primary navigation and do not add a fake stub. |
| Verify only | Existing behavior is acceptable but needs targeted browser/device certification. |

## 1. Global architecture and shell

| Area | Current evidence | Decision | Required work | Backend/migration |
|---|---|---|---|---|
| Map-first globe | `OmniMapShell`, `MapCanvas`, buyer and seller production routes already retain the map. | Reuse/refactor | Preserve globe and OSM discovery; unify overlay behavior and centered panel composition. | None initially. |
| Centered panels | Current sheets and rails are not yet one consistent centered system across every surface. | Refactor | Extend `OverlayHost` and primitives with centered glass sheet, sticky footer, safe area, focus restoration and internal scroll contracts. | None. |
| Scene state | Map/search/overlay states are distributed between route booleans and component state. | Refactor | Add explicit scene/overlay transition helpers and tests without rewriting working map discovery. | None initially. |
| Boundary guard | `check-client-boundary` exists and passes, but the generic `.server` import rule is not yet a complete lint contract. | Backend/architecture gap | Audit import graph; strengthen the guard for UI-safe/server-only boundaries while preserving `useServerFn`. | None. |
| Copy and tokens | Creamy-glass primitives and canonical transaction labels exist. | Refactor | Audit sentence case, formal French, verb CTAs, error recovery and arbitrary colors across touched surfaces. | None. |

## 2. Buyer search and discovery

| Area | Current evidence | Decision | Required work | Backend/migration |
|---|---|---|---|---|
| Search Enter/button parity | Production Enter search works and the dock has a search button. | Verify/refactor | Ensure both invoke the same handler, with tests for keyboard submit and no accidental view change while typing. | None. |
| Auth-gated search replay | Current app has auth and `useServerFn`; exact `pendingSearch` preservation/replay is not certified as a complete contract. | Backend/UI gap | Serialize query, quantity and budget in ephemeral router/session state; replay after auth; add E2E. | Possibly auth redirect metadata only. |
| Quantity/budget refinement | Current UI has structured controls but has accumulated layout debt. | Refactor | Keep controls hidden/collapsed by default, editable and non-overlapping; budget remains buyer-side/private. | Verify seller payload excludes budget. |
| Viewport discovery | `listFacilitiesInBounds` and OSM fail-soft discovery are active. | Reuse/verify | Preserve global coverage and retry/error distinction; add tests for empty versus error and late viewport. | Existing contracts. |
| Result rail | `ResultRail` and `FacilityResultCard` exist and are production-visible. | Refactor | Enforce searched product/offer first, media fallback, trust state, availability signal, stable selected-facility context and settled camera sync. | None. |
| Facility unclaimed | Current production correctly shows OSM/unclaimed and no direct purchase. | Reuse/verify | Preserve no-contact/no-purchase/no-seller-availability rules; add state matrix tests for all five facility states. | Verify suspended filtering and claim ownership. |

## 3. Availability

| Area | Current evidence | Decision | Required work | Backend/migration |
|---|---|---|---|---|
| Three-step composer | `DemandRequestPanel` has product, commerce and constraints phases and canonical labels. | Refactor | Convert to centered persistent sheet with live results in place, response SLA/count, sort and recovery actions. | Verify request/target schema. |
| Single facility check | `FacilityPanel` routes to availability-first. | Reuse/verify | Certify single-target remains available regardless of bulk quota. | Server check required. |
| Small bulk | Bulk results exist in current flow; exact plan/quota behavior needs contract audit. | Backend/UI gap | Make maximum 12 and monthly quota configurable by plan; bulk exhaustion must preserve single-target path. | Enforce before insertion; add quota tests. |
| Budget privacy | Current UI copy says private; seller payload contract requires proof. | Backend gap | Separate buyer request model from seller-facing target payload; never expose `max_budget_fcfa` to seller. | Add access/query tests. |
| Seller responses | Seller request contracts and panels exist, but the new response-state UX needs alignment. | Refactor | Implement one-tap Available/Partial/Unavailable; Partial inline quantity/price override; immutable submitted response. | Add response transition/ownership checks. |
| SLA expiry | Current responses can show pending/manual states; server-side expiry needs verification. | Backend contract gap | Add scheduled or read-time expiry transition from awaiting to `sla_expired`; expose countdown and recovery. | Migration/index/job or verified read-time transition. |

## 4. Transaction, chat and QR

| Area | Current evidence | Decision | Required work | Backend/migration |
|---|---|---|---|---|
| Purchase intent | `createPurchaseIntent` creates a pending intent, validates product/facility/coupon and reuses active transaction. | Reuse/refactor | Keep availability-first entry, freeze price/quantity, preserve stock/coupon invariants, open shared chat immediately. | Verify atomic reservation and active-transaction semantics. |
| Offer confirmation | Current UI exposes explicit offer confirmation before QR. | Reuse/verify | Make offer state explicit in shared buyer/seller thread; no QR before confirmation. | Verify transition guard. |
| Shared thread | Buyer `TransactionThreadCard` and `TransactionMessageThread` exist; seller shared view is not fully proven. | Replace surface | Create one role-aware transaction surface with interleaved events/messages and one primary CTA. | Add seller participant read/write permissions. |
| Progress labels | `TransactionProgress` with Intention/Offre/QR/Paiement/Réception exists. | Reuse/verify | Ensure labels and statuses remain visible at every target width and are driven by server state. | None. |
| QR generation | `createTransactionQr` exists and production generation follows explicit offer confirmation. | Reuse/refactor | Add copy/share/download/deep-link UX, expiry countdown, idempotent regeneration. | Verify token uniqueness/expiry/replay. |
| QR deep link | No certified account-bound share-link flow is present in current evidence. | Backend/UI gap | Add non-sensitive token route, auth redirect preservation, ownership/facility verification and chat reopen. | Add token lookup/audit/deep-link contract. |
| Camera/manual verification | `CheckoutPanel` lifecycle fix and manual fallback are present; production sandbox verified fallback. | Refactor/verify | Extract shared QR verification surface; keep preview mounted; certify real HTTPS mobile camera. | Verify seller ownership and replay/expiry errors. |
| Seller chat entry | Seller receives scanner/transaction data, but exact notification-to-shared-chat path needs audit. | Backend/UI gap | Deep-link seller notification and console to the same transaction surface. | Add notification payload/deep-link fields if missing. |
| Error events | Current thread has error event labels, but replay/expired/wrong-seller branches need complete persistent UI. | Refactor | Add inline error event cards with retry/terminal actions, never disappearing toast-only errors. | Add event types/transition tests as needed. |

## 5. Payment preference and fulfilment

| Area | Current evidence | Decision | Required work | Backend/migration |
|---|---|---|---|---|
| Buyer payment confirmation | Current contract includes buyer `confirmTransactionPayment`; existing master describes buyer confirmation before completed. | Contract conflict | Change semantic model so buyer declaration is not seller payment confirmation; buyer may select preference/mark paid, seller confirms external receipt. | Add payment preference, buyer declaration and seller confirmation fields/events. |
| External methods | No certified method selector for cash, TMoney, Flooz or remote payment contact disclosure. | Backend/UI gap | Add payment-preference step in shared transaction chat after seller verification; provider-neutral methods. | Add enum/table/JSON contract and permissioned seller-contact disclosure. |
| Seller confirmation | Seller UI currently reaches payment-pending after QR validation, but receipt confirmation path is not fully certified. | Refactor/backend gap | Add seller `Confirmer l’encaissement`, then fulfilment/dispatch status, then buyer receipt confirmation. | Enforce seller-only payment event and buyer-only receipt event. |
| Completion | Current `confirmProductReceived` exists for buyer; full external payment/fulfilment sequence needs reconciliation. | Refactor | Align timeline events, status labels, stock release, facility sales counter and completion. | Atomic transition and invariant tests. |
| In-app payment | Current product direction excludes buyer in-app payment. | Keep deferred | Do not expose Omni checkout for buyer purchase. Keep future provider-neutral extension isolated. | None now. |

## 6. Seller workspace and onboarding

| Area | Current evidence | Decision | Required work | Backend/migration |
|---|---|---|---|---|
| Seller map-first shell | `vendeur.tsx` uses `OmniMapShell`, lazy `getVendorShell`, V1 dock. | Reuse/refactor | Keep map background and simplify centered operation surfaces. | None. |
| Seller onboarding | `SellerOnboardingFlow` exists and is now extracted. | Refactor | Add persistent resume, first product/hours/preview stages, and reuse buyer FacilitySheet for preview. | Verify onboarding status persistence and claimed transition. |
| Product form | `SellerProductForm` exists with essential fields and basic coupon. | Refactor | Add progressive media/visibility/summary preview and server-enforced Free/Pro limits. | Verify product limits and active filtering. |
| Coupon | Basic coupon draft is present in product form. | Backend/UI gap | Support percentage/fixed, window, quota and product scope where backend contract allows; show savings preview and event log. | Coupon schema/validation/usage increment tests. |
| Availability response | Seller request surface exists but response state composition needs audit. | Refactor | One-tap responses, Partial overrides, immutable submission and history. | Ownership/idempotency/status constraints. |
| Agent/Ads/V2 | Ads/Agent were removed from current dock/menu. | Keep deferred | Do not reintroduce them in primary V1; keep only explicit feature flags if needed for future development. | None. |

## 7. Wallet and ledger

| Area | Current evidence | Decision | Required work | Backend/migration |
|---|---|---|---|---|
| Single wallet surface | `BalanceSheet` and seller wallet tab exist; FedaPay recharge is wired. | Refactor/verify | Use one buyer/seller wallet composition with clear internal-use copy and separate payment-choice copy. | Verify account ownership and ledger reads. |
| Allocation usage | Current balance buckets are displayed; approved continuity plan says allocations must not remain merely read-only. | Backend/UI gap | Keep no free-form reallocation/withdrawal, but expose authorized internal allocation/consumption actions for eligible Pro/coupon/search services. | Use existing ledger transfer/consume functions; add authorization/idempotency tests. |
| Recharge states | Existing functions support create/confirm deposit; full pending/declined/canceled/timeout UI needs audit. | Refactor/backend gap | Implement explicit recharge state machine, retry, cancel and status-check. | Ensure only approved callback/reconciliation credits; duplicate callback safe. |
| FedaPay scope | Current production copy reserves FedaPay for Wallet recharge. | Reuse/verify | Preserve separation from buyer-to-seller external payment. | None unless callback gaps are found. |
| Withdrawal | No V1 withdrawal CTA. | Keep deferred | Never add seller withdrawal/payout action. | None. |

## 8. Auth, navigation, notifications and admin

| Area | Current evidence | Decision | Required work | Backend/migration |
|---|---|---|---|---|
| Auth route | `/auth` and Neon Auth exist; production routes return 200. | Reuse/verify | Test timeout, replay context, new-account onboarding and permission failures. | None initially. |
| Buyer menu | Pruned to Transactions, Messages, Saved searches and Cart. | Reuse/verify | Add live counts/deep links if contracts exist; avoid V2 entries. | Notification/deep-link fields if missing. |
| Seller menu | Hamburger has no unwanted legacy surfaces; dock has V1 actions. | Reuse/refactor | Deep-link seller notifications to demand/transaction surfaces; keep role switch in intended chrome only. | None initially. |
| Notifications | Bell exists and transactional counts render. | Refactor | Group transactional notifications and deep-link to exact availability/transaction state. | Add notification target metadata if absent. |
| Admin | Current admin surface is not part of the certified UI loop. | Backend/UI gap | Add minimal authorized facility-certification queue only if included in current V1 release decision. | Admin permissions and evidence fields. |

## 9. Data and invariant audit

| Invariant | Current confidence | Required certification |
|---|---|---|
| Unclaimed facility cannot be purchased/contacted | High from current production and checkout functions | Unit + server permission test. |
| Purchase intent starts pending, QR not automatic | High | Transition test and browser E2E. |
| QR generated after offer confirmation | High | Transition and duplicate/regeneration tests. |
| Seller QR verification ends at payment pending | High | Seller ownership, replay and expiry tests. |
| Buyer alone cannot record seller payment | Low/conflicting current contract | Server contract change and integration test. |
| Buyer receipt confirmation only after payment confirmed | Medium | State-machine and server permission test. |
| Stock reservation atomic and released on cancel/complete | Requires audit | Concurrent integration test and migration check. |
| Budget private from seller | UI copy exists; server proof required | Payload/access test. |
| Bulk max 12 and plan quota | Requires audit | Quota and single-target fallback tests. |
| Wallet credit only after approved callback | Requires audit | Idempotent callback integration test. |
| No withdrawal in V1 | High | Grep/navigation acceptance check. |

## 10. Phase 0 exit checklist

- [x] Continuity decision documented: preserve globe, OSM, real backend and PWA.
- [x] Centered panel and unified transaction-chat direction documented.
- [x] QR share/deep-link/auth and physical/manual verification requirements documented.
- [x] External payment preference and seller-confirmation requirements documented.
- [x] Wallet allocation ambiguity resolved as internal authorized usage, not free-form withdrawal/reallocation.
- [x] Current UI/backend surfaces classified.
- [ ] Canonical shared TypeScript contracts and transition helpers implemented in Phase 1.
- [ ] New server/database fields for payment preference, fulfilment and deep-link metadata implemented only after contract review.

## References

[1]: ./omni-continuity-v1-source-of-truth.md "Omni V1 continuity source of truth"
[2]: ./omni-v1-ui-phase0-audit.md "Prior V1 UI audit"
[3]: ./OMNI_MASTER_PRODUCT_INTERFACE.md "Current Omni master and V1 scope gate"
[4]: ../omni-continuity-v1-plan.md "Approved continuity execution plan"

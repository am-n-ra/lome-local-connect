# Omni V2 — Flow Validation Specification

**Version:** 1.0.0 · **Derived from:** [`v2-master.md`](./v2-master.md) and [`v2-flow.md`](./v2-flow.md)

> This artifact normalizes the approved flow into implementation and test form. It does not change authority, scope or state names.

## 1. Buyer map and discovery

```text
idle_globe
  → [explicit search/category/restored search/retry] → search_submitting
  → [location request] → locating
  → [manual pan/zoom] → manual_exploration

locating
  → [fresh acceptable browser fix] → location_exact
  → [coarse/low-confidence context] → location_approximate
  → [denied/timeout/unavailable] → fallback_market
  → [cancel] → idle_globe

search_submitting
  → [valid query] → search_reveal
  → [missing required input] → search_input with correction
  → [protected continuation without auth] → auth_required with snapshot
  → [timeout/error] → search_error with retry

search_reveal
  → [facilities returned] → results_visible
  → [no facilities] → empty_results
  → [cancel/manual interaction] → idle_globe or manual_exploration

results_visible
  → [select pin/card] → facility_selected
  → [new search] → search_submitting
  → [close rail] → idle_globe/manual_exploration
```

| State | Screen | Allowed actions | Error/recovery |
|---|---|---|---|
| `idle_globe` | Persistent MapLibre globe | Search, location, pan, zoom, menu, notifications | Map init failure shows retry without fabricating flat fallback. |
| `locating` | Globe + non-blocking location indicator | Cancel, retry, search, explore | Permission denial/timeout maps to explicit fallback. |
| `search_input` | Dock search row | Type, options, submit, close | Preserve query and options. |
| `search_submitting` | Dock loading state | Cancel if safe | Duplicate submit returns same request; timeout preserves input. |
| `search_reveal` | Globe choreography + loading rail | Cancel/manual interaction | Cancel camera ownership; server error becomes retryable search error. |
| `results_visible` | Pins/clusters + result rail | Select, new search, close | Empty and source failure are distinct. |
| `facility_selected` | Facility sheet above map | Back, products, availability, seller verification where eligible | Stale facility offers refresh/back; no private data. |

**Easy-to-get-wrong rule:** public source presence must not be rendered as supply proof or a claim/status transition.

**Tests:** idle rotation direction, manual interaction cancellation, bbox request, cluster threshold, exact/approximate marker, preserved search input, duplicate submit, empty-vs-source-error.

## 2. Catalogue and availability

```text
facility_selected
  → [view products] → catalogue_loading
catalogue_loading
  → [active products] → catalogue_ready
  → [none] → catalogue_empty
  → [sold out] → catalogue_sold_out
  → [error] → catalogue_error
catalogue_ready
  → [select product] → product_selected
  → [back] → facility_selected
product_selected
  → [verify availability] → availability_product_stage

availability_product_stage
  → [valid catalogue selection] → availability_scope_stage
  → [no catalogue product and fallback allowed] → availability_scope_stage
availability_scope_stage
  → [eligible Free one-facility scope] → availability_constraints_stage
  → [eligible Pro bounded bulk scope] → availability_constraints_stage
  → [not entitled] → scope_blocked with Free alternative
availability_constraints_stage
  → [submit] → availability_submitting
  → [back] → availability_scope_stage
availability_submitting
  → [responses] → comparison_ready
  → [none] → comparison_empty
  → [timeout/error] → availability_error
```

| State | Screen | Allowed actions | Error/recovery |
|---|---|---|---|
| `catalogue_loading` | Catalogue sheet skeleton | Back/close | Retry without losing facility. |
| `catalogue_ready` | Product list | Select, back | Product becomes typed selection only. |
| `availability_product_stage` | Availability step 1 | Confirm product/back | No demand or reservation. |
| `availability_scope_stage` | Availability step 2 | Select permitted scope | Server entitlement decides bulk. |
| `availability_constraints_stage` | Availability step 3 | Edit quantity/budget/constraints | Budget can be unlimited; preserve draft. |
| `comparison_ready` | Response comparison | Select eligible response | Contact remains locked until intent. |
| `comparison_empty` | Empty comparison | Retry, adjust scope/constraints, back | Explain no responses, never invent. |

**Easy-to-get-wrong rule:** selecting a catalogue product or checking availability cannot create a purchase intent or reserve stock.

**Tests:** catalogue-first selection, empty/sold-out/error recovery, Free/Pro entitlement, unlimited budget, ordering available/partial/unavailable/price, no reservation mutation.

## 3. Verification and seller lifecycle

```text
unclaimed
  → [seller starts verification/create request] → verification_requested
verification_requested
  → [save evidence] → evidence_draft
  → [cancel] → unclaimed or persisted draft

evidence_draft
  → [submit] → evidence_submitted
  → [edit] → evidence_draft

evidence_submitted
  → [admin accepts] → admin_review
  → [withdraw] → verification_requested
admin_review
  → [approved certified] → certified
  → [approved unconfirmed] → unconfirmed
  → [rejected with reason] → rejected
rejected
  → [new evidence/request] → verification_requested or unclaimed
unconfirmed
  → [three qualifying completed Omni sales confirmed] → confirmed + bonus_unlocked
  → [policy-defined paid confirmation path] → confirmed, without bypassing review
```

| State | Screen | Allowed actions | Error/recovery |
|---|---|---|---|
| `verification_requested` | Seller onboarding | Edit/save evidence, cancel | Draft persists; duplicate submit is idempotent. |
| `evidence_submitted` | Submission status | View/revise if returned | Review timeout remains pending with support path. |
| `admin_review` | Admin evidence queue | Review, request evidence, outcome | Outcome requires reason and audit record. |
| `certified` | Seller next-step surface | Optional channel, prepare operations | Does not imply confirmed or Pro. |
| `unconfirmed` | Operational seller workspace | List within policy, receive requests | Bonus remains locked until server unlock. |
| `confirmed` | Seller workspace | Confirmed entitlements | Loss of qualifying conditions cannot silently grant Pro. |

**Easy-to-get-wrong rule:** clicking claim never changes facility status; only audited review does.

**Tests:** role authorization, idempotent evidence submit, direct-status bypass rejection, audit completeness, bonus unlock only after confirmed qualifying sales.

## 4. Transaction, QR and fulfilment

```text
comparison_ready
  → [eligible response selected] → response_selected
response_selected
  → [want to buy] → intent_submitting
intent_submitting
  → [new context] → transaction_created
  → [idempotency hit] → existing_transaction_resumed
  → [expired/unavailable] → intent_blocked
  → [server error] → intent_error
transaction_created
  → [generate QR] → qr_generated
  → [close room] → transaction_created resumable
qr_generated
  → [seller opens scanner] → scanner_ready
  → [expiry] → qr_expired
scanner_ready
  → [camera CTA] → camera_requesting
  → [manual code] → qr_submitting
camera_requesting
  → [live preview] → camera_active
  → [denied] → camera_denied
  → [unsupported/error] → camera_unavailable
camera_active
  → [valid decode] → qr_submitting
  → [stop/close] → scanner_stopped
qr_submitting
  → [valid match] → seller_verified
  → [expired] → qr_rejected_expired
  → [replay] → qr_rejected_replay
  → [mismatch] → qr_rejected_mismatch
  → [malformed] → qr_rejected_invalid
seller_verified
  → [buyer selects external method] → payment_method_selected
payment_method_selected
  → [buyer declares] → payment_declared
payment_declared
  → [seller confirms] → payment_received
  → [seller does not confirm] → payment_pending
payment_received
  → [seller fulfils] → fulfilment_pending_buyer
fulfilment_pending_buyer
  → [buyer confirms receipt] → receipt_confirmed
receipt_confirmed
  → [buyer rates] → rating_published
rating_published
  → [server closes] → transaction_completed
```

| State | Screen | Allowed actions | Error/recovery |
|---|---|---|---|
| `transaction_created` | Transaction room | Generate QR, close/resume, authorized chat | Context snapshot is immutable. |
| `qr_generated` | Transaction room/QR | Show expiring QR, seller scanner | Expiry offers regenerate through authorized path. |
| `camera_active` | Seller scanner preview | Decode, stop, manual fallback | Tracks stop once; decoder absence does not hide preview. |
| `seller_verified` | Shared transaction room | Buyer payment method | Wrong actor cannot advance. |
| `payment_declared` | Timeline + payment state | Seller confirm or buyer wait/support | Buyer claim does not equal seller receipt. |
| `fulfilment_pending_buyer` | Seller/buyer transaction room | Buyer confirm receipt | Recovery for dispute/support is explicit. |
| `transaction_completed` | Receipt/rating summary | Read-only review | Terminal state; no sensitive backward mutation. |

**Easy-to-get-wrong rule:** the QR token is never trusted from the client; server validates expiry, transaction binding and replay state.

**Tests:** intent idempotency, room resume, QR expiry/replay/mismatch, camera permission and cleanup, manual fallback, actor/state guards, payment declaration versus seller confirmation, terminal completion.

## 5. Wallet and platform spending

```text
wallet_view
  → [start FedaPay recharge] → recharge_pending
recharge_pending
  → [confirmed callback] → wallet_available
  → [failure/cancel/expiry] → recharge_failed
wallet_available
  → [eligible platform spend] → spend_submitting
spend_submitting
  → [confirmed] → wallet_available with ledger event
  → [insufficient/restricted] → spend_blocked
```

**Easy-to-get-wrong rule:** wallet balance is not buyer-seller payment and a pending provider result is not spendable.

**Tests:** callback idempotency, pending/available/failed display, ledger reconciliation, spend authorization, absent withdrawal route.

## 6. Connection diagram

```text
Map discovery
  → Facility detail
    → Catalogue
      → Availability/comparison
        → Purchase intent
          → Transaction room/QR
            → External payment
              → Fulfilment
                → Receipt/rating

Seller verification ───────→ Seller facility/product/request operations
Admin review ───────────────→ Facility trust outcome
Wallet recharge ────────────→ Platform entitlements/spend only
Notifications/resume ──────→ Any authorized non-terminal context
```

## 7. Completeness checklist

| Check | Result target |
|---|---|
| Every critical success path has named states | Yes |
| Every timeout has owner, state and recovery | Yes |
| Every cancel/back path preserves or explicitly discards context | Yes |
| Duplicate/replay actions are idempotent or explicitly rejected | Yes |
| Expired/unavailable resources have recovery | Yes |
| Source of truth is named for each sensitive fact | Yes |
| Unlock point is named for contact/chat/QR/payment/fulfilment | Yes |
| Terminal states are intentional | Yes |
| Each state maps to a screen and allowed actions | Yes |
| Each critical rule has unit/integration/browser/device proof | Yes |

# Omni All V1 Flows — Flow Validation Specification

> Source of truth: `OMNI_MASTER_PRODUCT_INTERFACE.md` §0.8.4 and `omni-catalog.md`.
> Notation: `state → [action] → state`.

## 1. Arrival, location and globe

```text
idle_globe
  → [browser permission prompt] → locating
  → [fresh accuracy ≤ accepted threshold] → location_exact
  → [fresh low-accuracy callback] → location_approximate
  → [denied/timeout/unsupported] → fallback_market
  → [drag/zoom/recenter] → manual_navigation
  → [explicit search/category/restored search/retry] → search_reveal

locating
  → [callback] → location_exact | location_approximate
  → [timeout] → fallback_market
  → [cancel/unmount] → idle_globe

search_reveal
  → [reveal token completes] → result_framing
  → [manual map action] → manual_navigation_with_pending_results
  → [new search] → search_reveal (old token invalidated)
  → [style/boundary/coverage error] → reveal_degraded

reveal_degraded
  → [retry] → search_reveal
  → [close] → results_visible_or_empty
```

| State | Screen/component | Allowed actions | Error/recovery |
|---|---|---|---|
| `idle_globe` | MapLibre canvas + quiet dock | Search, location, map controls, menu | Provider failure shows truthful retry, never flat substitute |
| `locating` | Canvas + compact location status | Wait, cancel, search | Timeout becomes fallback, never fake exact marker |
| `search_reveal` | Canvas + reveal status | Manual interaction, cancel by new search | Monotonic token cancels stale flights/timers |
| `results_visible` | Pins/clusters + rail/cards | Select, refine, search again | Empty result becomes explicit empty state |

**Easy-to-get-wrong rule:** typing quantity, budget or query without submit must not move the camera. Manual camera always wins.

## 2. Search to facility/catalogue

```text
search_idle
  → [submit valid query/category] → auth_required | discovery_loading

auth_required
  → [sign in/up] → context_restoring
  → [cancel] → search_idle_with_draft

context_restoring
  → [auth success] → discovery_loading
  → [restore mismatch/expiry] → search_idle_with_draft_and_notice

discovery_loading
  → [public payload] → results_visible
  → [empty] → empty_results
  → [network/coverage error] → discovery_error

discovery_error
  → [retry] → discovery_loading
  → [refine query/viewport] → search_idle_with_draft

results_visible
  → [click card/pin] → facility_loading
  → [new search] → search_reveal

facility_loading
  → [facility payload] → facility_detail
  → [not found/stale] → facility_unavailable

facility_detail
  → [Voir les produits] → catalogue_loading
  → [Vérifier disponibilité with match] → availability_setup
  → [close/back] → results_visible_with_same_context
  → [Demander vérification on unclaimed] → verification_request

catalogue_loading
  → [products] → catalogue_ready
  → [empty] → catalogue_empty
  → [failure] → catalogue_error

catalogue_ready
  → [select eligible product] → product_selected
  → [back] → facility_detail

product_selected
  → [continue] → availability_setup
  → [change product] → catalogue_ready
```

**Screen contract:** result card selection never creates a request. The facility detail sheet is distinct from the catalogue and availability sheets. The catalogue uses actual `getFacility` products, matched product first, active/stock eligibility and explicit empty/error states.

## 3. Availability setup and response comparison

```text
availability_setup
  → [product stage valid] → scope_setup
  → [change product] → catalogue_ready

scope_setup
  → [Free + one facility] → constraints_setup
  → [Pro + bounded bulk scope] → constraints_setup
  → [invalid entitlement/target count] → scope_error

constraints_setup
  → [submit] → availability_creating
  → [back] → scope_setup
  → [close] → availability_draft_saved

availability_creating
  → [idempotent create success] → availability_pending
  → [same key replay] → availability_pending_existing
  → [stale product/unclaimed/invalid scope] → availability_rejected_with_draft
  → [timeout] → availability_status_lookup

availability_status_lookup
  → [existing request found] → availability_pending_existing
  → [not found] → availability_retry_confirmation

availability_pending
  → [seller/manual response] → availability_responses
  → [timeout] → availability_pending_with_retry
  → [buyer closes] → availability_resumable

availability_responses
  → [select eligible answer] → intent_confirmation
  → [no eligible answer] → availability_no_eligible_response
  → [stale response] → availability_refresh_required

availability_no_eligible_response
  → [retry] → availability_creating
  → [refine product/constraints] → availability_setup
```

Responses are ordered available, partial, unavailable, then price. The best eligible response may be highlighted. Contact, itinerary, chat and QR remain absent until purchase intent succeeds.

## 4. Purchase intent

```text
intent_confirmation
  → [confirm] → intent_creating
  → [back] → availability_responses

intent_creating
  → [server success] → transaction_room_qr_generated
  → [idempotent replay] → existing_transaction_room
  → [stale response/price/stock] → intent_stale_recovery
  → [timeout] → intent_status_lookup

intent_status_lookup
  → [transaction found] → existing_transaction_room
  → [not found] → intent_retry_confirmation

intent_stale_recovery
  → [refresh responses] → availability_responses
  → [cancel] → availability_responses
```

**Unlock rule:** only the server-success transaction response may return private contact, itinerary authorization, QR reference or private chat authorization. Before then these fields are absent from payloads, not merely hidden by CSS.

## 5. Transaction room and chat

```text
transaction_room_qr_generated
  → [open/resume] → qr_presented
  → [close] → transaction_resumable
  → [auth expiry] → auth_required_with_transaction_context

qr_presented
  → [seller verifies] → qr_verified
  → [expired] → qr_expired
  → [wrong/malformed/replayed] → qr_rejected
  → [seller unavailable] → transaction_resumable

qr_expired
  → [buyer regenerate] → qr_generated
  → [close] → transaction_resumable

qr_rejected
  → [manual retry/camera retry] → qr_presented
  → [wrong transaction repeated] → qr_attention_required

qr_verified
  → [select external payment] → payment_pending
  → [chat/system event] → same_state_timeline_updated

payment_pending
  → [buyer declares] → payment_declared
  → [timeout] → payment_status_lookup
  → [seller disputes] → payment_attention_required

payment_declared
  → [seller confirms] → paid
  → [seller rejects] → payment_attention_required

paid
  → [seller starts fulfilment] → fulfillment
  → [seller cancels with reason] → cancelled

fulfillment
  → [buyer confirms receipt] → received
  → [delivery problem] → fulfillment_attention_required

received
  → [buyer rates] → completed
  → [close] → rating_resumable
```

The chat thread is a child surface of the room and is available only to authorized participants. It can carry operational text/media under policy, but system events and server state are authoritative. A chat send timeout preserves the draft and allows retry; duplicate client submission must use a client message id or server idempotency behavior.

## 6. QR verification

```text
scanner_ready
  → [camera permission prompt] → camera_permission_pending
  → [manual fallback selected] → manual_code_entry

camera_permission_pending
  → [granted + preview] → camera_preview_ready
  → [denied/no camera] → manual_code_entry

camera_preview_ready
  → [valid scan] → qr_verification_pending
  → [no detection] → camera_preview_ready
  → [camera lost] → manual_code_entry

manual_code_entry
  → [submit] → qr_verification_pending

qr_verification_pending
  → [server valid current QR] → qr_verified
  → [expired] → qr_expired
  → [replay/wrong/malformed] → qr_rejected
  → [network timeout] → qr_lookup_retry
```

Camera preview must occupy the visible reserved area; permission without preview is not success. Camera and manual paths call the same server authority and share replay/expiry outcomes.

## 7. External payment and fulfilment

```text
payment_method_unselected
  → [buyer selects cash/TMoney/Flooz/other] → payment_method_selected
payment_method_selected
  → [buyer declares paid] → payment_declared
  → [buyer changes method] → payment_method_unselected
payment_declared
  → [seller confirms] → paid
  → [seller rejects/asks correction] → payment_attention_required
paid
  → [seller marks pickup/delivery started] → fulfillment
fulfillment
  → [buyer confirms] → received
  → [seller reports failure] → fulfillment_attention_required
received
  → [buyer rating] → completed
```

Omni records external/manual payment; FedaPay is a separate wallet-recharge flow and never supplies this state.

## 8. Verification and onboarding

```text
public_unclaimed
  → [Demander une vérification] → verification_request_draft
verification_request_draft
  → [save] → evidence_draft
  → [cancel] → public_unclaimed

evidence_draft
  → [submit] → evidence_submitted
  → [auth expiry] → auth_required_with_draft

evidence_submitted
  → [admin opens] → admin_review
  → [claimant edits allowed evidence] → evidence_draft

admin_review
  → [approve trust threshold] → certified_or_unconfirmed
  → [reject with reason] → rejected_unclaimed
  → [timeout] → pending_review

certified_or_unconfirmed
  → [limited seller setup] → seller_workspace_gated
  → [three eligible completed sales] → confirmed_and_bonus_eligible
  → [direct invalid status mutation] → rejected_by_server
```

The click does not claim a facility. Only audited review may change public status. A Pro payment cannot substitute for evidence.

## 9. Seller workspace

```text
seller_entry
  → [auth] → seller_map_workspace
seller_map_workspace
  → [facility] → facility_operations
  → [incoming demand] → demand_response_surface
  → [transaction notification] → seller_transaction_room
  → [scanner] → scanner_ready
  → [wallet] → wallet_surface

facility_operations
  → [products] → catalogue_management
  → [coupon] → offer_management
  → [hours/open state] → facility_availability_settings

catalogue_management
  → [valid product/coupon submit] → product_saved
  → [invalid discount/stock] → product_form_error
```

## 10. Wallet/recharge

```text
wallet_empty_or_available
  → [recharge] → fedapay_checkout_pending
fedapay_checkout_pending
  → [provider success/webhook] → deposit_pending_confirmation
  → [cancel/failure] → recharge_retry
  → [timeout] → deposit_status_lookup
deposit_status_lookup
  → [confirmed] → wallet_available
  → [pending] → deposit_pending_confirmation
  → [failed/unknown] → recharge_attention_required
wallet_available
  → [platform feature purchase] → platform_credit_spent
  → [buyer-seller payment attempt] → rejected_not_wallet_rail
```

No seller withdrawal state exists in V1.

## 11. Auth, menu, notifications and recovery

```text
public_context
  → [protected action] → auth_required_with_snapshot
  → [role switch] → role_context_snapshot

auth_required_with_snapshot
  → [success] → original_surface_restored
  → [cancel] → public_context_preserved
  → [expired snapshot] → route_default_with_notice

role_context_snapshot
  → [destination supports snapshot] → equivalent_role_context
  → [unsupported field] → equivalent_role_context_with_safe_drop

notification_received
  → [open] → validated_deep_link_state
  → [expired/unauthorized] → auth_or_recovery_surface
```

## 12. Flow completeness checklist

- [x] Every core flow has named success state.
- [x] Timeouts have an owner and lookup/retry behavior.
- [x] Close/cancel preserves the correct draft or resumable transaction.
- [x] Replay is idempotent or explicitly rejected for intent, QR and payment declarations.
- [x] Expired QR and stale availability responses have recovery branches.
- [x] Unavailable camera has a manual fallback.
- [x] Private data has a precise intent unlock boundary.
- [x] Chat is authorized and transaction-scoped.
- [x] Wallet and external payment are separate rails.
- [x] Facility status transitions are review-authoritative.
- [x] Each state maps to a screen/component and a primary action.

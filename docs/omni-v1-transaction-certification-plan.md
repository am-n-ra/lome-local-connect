# Omni V1 — Transaction, QR and Mobile Certification Slice

## Goal

Close the remaining evidence gap after the demo identity repair by certifying one complete buyer/seller transaction loop on the deployed Omni application, including resumability, QR verification, external payment states, camera behavior and authorization boundaries. Keep the scope bounded to certification-enabling fixes and proof; do not start another global UI redesign or alter the repaired identity data.

## Current baseline

The current application data repair is complete for the confirmed demo/test dataset. Legacy application-only profiles were preserved, their five facilities and selected dependent records were relinked to the current Neon Auth identity, and no Neon Auth user was deleted. The buyer globe and seller map-first shell load in production. The seller Catalogue, Scanner QR, Omni Wallet and Coupons surfaces are reachable. The current status is `partial` because real camera/QR proof, two independent authenticated sessions and a full transaction E2E are not yet verified. The invariant checker also reports three legacy completed transactions without reviews; these are pre-enforcement fixtures and must not be silently rewritten.

## Risk classification

Classify this slice as **L3** because it exercises authentication, authorization, QR identity, transaction terminal states, external/manual payment declarations, coupons, audit events and potentially irreversible fulfillment actions. Apply server-authoritative status and amount checks, negative authorization tests, idempotency checks, audit/event assertions, safe fixtures and explicit failure-path evidence.

## Frozen decisions

| ID | Decision | Status |
| --- | --- | --- |
| CERT-001 | Use the repaired canonical demo identity for the seller fixture and a separate authenticated buyer identity/session for E2E. | `decided` |
| CERT-002 | Keep buyer-seller payment external/manual in V1; do not add in-app seller payment or withdrawals. | `decided` |
| CERT-003 | Preserve the three legacy completed-without-review records as legacy fixtures unless a separate cleanup decision is approved. | `decided` |
| CERT-004 | Generate the transaction intent and QR together; do not create a QR before a valid purchase intent. | `decided` |
| CERT-005 | Verify the QR as seller, then require buyer payment preference and preserve `payment_pending` until seller receipt confirmation. | `decided` |
| CERT-006 | Test the camera on HTTPS only, with manual code fallback as a required failure-path experience. | `decided` |
| CERT-007 | Do not mutate production data during certification except through an explicitly tagged, reversible demo fixture operation. | `decided` |

## Phase 1 — Prepare a controlled transaction fixture

1. Create or identify one claimed/certified canonical seller facility with an active product, one available coupon and a distinct buyer identity. Reuse existing records where possible; do not create duplicate fixtures for the same intent.
2. Record a redacted fixture manifest containing buyer/seller identifiers, facility/product/coupon IDs, initial transaction count, wallet totals, transaction-event count and cleanup/rollback instructions. Never record passwords, QR tokens, coupon codes or database URLs.
3. Confirm that the fixture is valid for the current V1 contract: the product is visible, the seller owns the facility, the buyer can request availability, the coupon is eligible and the seller has no withdrawal path.
4. Define a unique `intent_key`/run ID and use it for all retries. Abort if a previous active fixture with the same key exists in an unexpected state.

## Phase 2 — Certify the buyer discovery-to-intent path

1. In a buyer session, search for the fixture product and verify that the globe/result cards preserve the query while the map reveal completes.
2. Request availability for the target facility or the permitted Pro bulk scope. Verify that Free/Pro gating is server-enforced, not just a disabled client button.
3. Select the returned offer and click `Je veux payer ici`. Verify that the server, not the client, determines amount, coupon discount, intent fingerprint and transaction ownership.
4. Verify the initial transaction state, event sequence and QR availability. Confirm that reloading, back navigation, notification reopening and a duplicate click resume the same intent rather than creating a second active transaction.
5. Verify that unclaimed facilities cannot proceed to purchase/contact as if they were claimed sellers.

## Phase 3 — Certify seller QR and transaction-room transitions

Use isolated buyer and seller browser contexts. Execute and record each transition:

| Transition | Actor and guard | Required server effect | Required visible proof |
| --- | --- | --- | --- |
| `intent_created -> qr_generated` | Buyer; valid claimed facility, offer and idempotency key. | Persist one transaction, authoritative amount and expiring QR. | Buyer transaction room shows QR and resumable state. |
| `qr_generated -> qr_verified` | Seller; owns the facility, QR belongs to the transaction and is unexpired. | Persist verification timestamp and seller event exactly once. | Seller sees verified state; buyer receives notification. |
| `qr_verified -> payment_pending` | Buyer; transaction belongs to buyer and QR was verified. | Persist selected external/manual payment preference. | Buyer sees exact payable amount and allowed external method. |
| `payment_pending -> paid` | Seller; owns facility and buyer has declared/selected payment according to the method. | Persist seller receipt confirmation and payment event; do not alter amount client-side. | Both sessions see payment confirmed. |
| `paid -> fulfillment` | Seller; owns facility and transaction is paid. | Persist delivery/hand-off start event. | Seller sees delivery/hand-off action; buyer sees progress. |
| `fulfillment -> received` | Buyer; owns transaction. | Persist receipt confirmation. | Buyer sees received state and rating invitation. |
| `received/rating_pending -> completed` | Rating/completion rules satisfied. | Persist terminal completion and audit event. | Both sessions see terminal state with no impossible next action. |

For every transition, test duplicate clicks, reload, expired QR, wrong seller, wrong buyer, malformed code, unauthorized direct request and network retry. Preserve the prior safe state on failure.

## Phase 4 — Certify camera and mobile behavior

1. Use a real HTTPS deployed URL on a mobile-capable browser or a browser device context. Grant camera permission only after the visible `Autoriser et démarrer la caméra` action.
2. Verify that the camera feed is visible inside the reserved scanner viewport, the stream remains active while scanning and stops on close/unmount. Confirm no black/empty preview is mislabeled as ready.
3. Scan the fixture QR and verify that the decoded token is sent only to the seller verification endpoint. Confirm an invalid or expired QR returns a stable error without changing transaction status.
4. Deny camera permission and verify the manual eight-character fallback. Test keyboard focus, safe-area spacing, 320/375px mobile widths, 768px tablet and 1280px desktop.
5. Verify that focusing the mobile search/input fields does not zoom or shift the map unexpectedly and that the scanner sheet remains accessible above the map.

## Phase 5 — Adversarial critique and negative authorization

Reject the slice if a buyer can verify a QR, a seller can act on another facility, a QR can be reused to duplicate a payment state, a coupon can be redeemed twice, a client can change the payable amount, a completed legacy fixture is treated as a new failure, contact/route data is exposed before the contract allows it, or any screen claims success without the matching server event.

Run negative tests for anonymous buyer, wrong buyer, wrong seller, unclaimed facility, expired QR, malformed QR, duplicate intent key, duplicate payment declaration and unauthorized fulfillment. Check runtime logs for sensitive tokens, QR contents, phone numbers and payment data.

## Phase 6 — Verification and delivery gates

Run the full unit suite, type/build/client-boundary checks, focused transaction tests, read-only invariant checker, production runtime-error query and browser/device evidence. Record each criterion with environment, fixture, action, result, artifact path and limitation. Do not attach raw fixture snapshots or secrets.

Declare exactly one result:

| Result | Condition |
| --- | --- |
| `verified` | All required transitions, camera/fallback, negative authorization, invariants and deployment observations pass. |
| `partial` | The implementation and core proof pass, but a non-blocking device or provider observation remains. |
| `blocked` | A second authenticated session, camera-capable HTTPS device, fixture or external payment boundary is unavailable. |
| `needs-decision` | A transaction, coupon, legacy-fixture or payment-state conflict changes the frozen contract. |

## Explicit exclusions

Do not redesign the buyer or seller UI globally, modify MapLibre globe behavior, delete Neon Auth users, merge the duplicate profile rows again, rewrite legacy transaction reviews, add in-app seller payments or withdrawals, change wallet bucket architecture, or apply new database migrations unless a new decision contract is opened.

## Open risks

The current browser session has demonstrated buyer and seller access but not two independent authenticated contexts. Camera permission and QR decoding require a real HTTPS-capable device or equivalent controlled browser context. Existing completed transactions without reviews may remain legacy fixtures. Production deployment is observed as healthy, but production-readiness must not be claimed until the full transition and device evidence passes.

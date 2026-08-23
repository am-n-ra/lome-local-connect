# Omni V2 — Demo Transaction Root Proof Evidence

**Document ID:** `OMNI-V2-ROOT-DEMO-TRANSACTION-001`  
**Method:** Nature Way — Phase 2, Root System  
**Observed:** 2026-08-23  
**Environment:** Persistent V2 Neon branch `br-dawn-hill-am5amy22` only  
**Status:** `bounded-partial`

## Scope

This record covers the explicitly authorized demo proof prepared after the existing demo-like Auth identity inventory. It uses the labeled fixtures `D-V2-DEMO-SELLER`, `D-V2-DEMO-FACILITY`, `D-V2-DEMO-PRODUCT` and the existing KH-backed buyer fixture. The operation was restricted to the persistent V2 branch; production/default was not written.

The fixture preparation created one existing demo-like Auth binding to one `seller_ready` V2 account, one seller wallet, one owned `created`/`unconfirmed` facility, and one published product with non-zero bounded Omni allocation. The Auth identity was reused; no Auth identity was created, deleted, or password-modified.

## Aggregate verification

The post-proof Neon query returned the following exact counts. Identifiers, Auth IDs, emails, QR hashes, bearer tokens and connection strings were deliberately omitted.

| Assertion | Observed count | Meaning |
|---|---:|---|
| Seller-ready demo account | 1 | One labeled seller fixture exists |
| Owned unconfirmed demo facility | 1 | Facility ownership is bound to that seller fixture |
| Published allocated demo product | 1 | One bounded product supports the proof |
| Availability response | 1 | One available response exists for the demo request |
| Active purchase intent | 1 | One intent exists for the bounded response |
| Immutable transaction snapshot | 1 | One snapshot exists |
| Transaction members | 2 | Buyer and seller memberships exist |
| Verified QR with replay count 1 | 1 | First pass was accepted; token is no longer reusable |
| Acknowledged external payment declaration | 1 | Declaration-only payment boundary is represented |
| Expected transaction events | 5 | `intent_created`, `qr_ready`, `qr_verified`, `payment_declared`, `payment_confirmed` |
| QR/payment audit facts | 4 | Verification, replay rejection, declaration and confirmation facts were recorded |

The QR material was generated and consumed inside the bounded database proof procedure. No raw QR token or hash was returned, stored in source, or written to evidence. The second conditional QR update matched no row after the first pass, and the proof recorded `qr_replay_rejected`.

## What this proves

The bounded data proof demonstrates that the labeled seller fixture can be associated with an owned facility and published product without rewriting public-import facilities, that a buyer/seller transaction shape can be assembled with an immutable snapshot and two memberships, that a QR first pass can be accepted and a sequential replay rejected, and that the external-payment declaration/acknowledgement boundary can be represented with corresponding events and audit facts.

The source now contains the corresponding protected seams: seller availability response with ownership, request/product/scope and allocated-quantity checks; server-issued QR with seller membership and `qr_ready` state; QR verification restricted to the current `qr_ready` state with `qr_verified` event/audit; and additive response/event/audit/QR idempotency indexes. The source tests pass for these seams.

## Non-claims and remaining gap

This evidence is **not** a real seller login, real bearer-backed API proof, live browser camera proof, concurrent QR race proof, payment movement, completed sale, marketplace activity, certification outcome or release clearance. The direct bounded database procedure is an evidence fixture operation and must not be confused with the application HTTP route. A real seller bearer session remains required to verify the deployed HTTP route and camera-capable QR flow. No seller password was requested or entered.

The Root gate therefore remains `review`. TX-01 and TX-02 advance only to `partial` with bounded persistent-V2 state evidence; they do not become verified. The Seller Trunk remains closed until the authenticated route proof, concurrent QR harness, recovery states and remaining Root rows are addressed.

## Preservation

The existing KH buyer/account/wallet/availability fixture remains present. The three public-import facilities remain unowned and unchanged. Production/default records were not modified. The demo records are retained as labeled evidence unless a separate cleanup instruction is provided; no destructive cleanup is authorized by this proof.

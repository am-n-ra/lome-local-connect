# Omni V1 Field Brief

## Identity

- Brief ID: `OMNI-V1-FIELD`
- Version: `1.0`
- Status: `decided`
- Owner: Omni product and engineering
- Date: 2026-08-19

## User and operational problem

Omni is intended to be a geospatial supply-and-demand search engine. A buyer should discover real facilities and products on a map, ask whether an offer is available now, create a trackable purchase intent when the seller can satisfy the request, and complete an external/manual real-world transaction with a QR-backed record. A seller or field operator should be able to answer availability, verify the QR, confirm external receipt, and complete fulfilment without Omni pretending to process buyer-to-seller money.

The current product contains significant working infrastructure but does not yet present or prove this loop as one coherent map-first experience. UI composition, state ownership, seller operations, payment semantics, wallet proof, and cross-role verification remain partially disconnected.

## V1 outcome

Enable a new or returning buyer and seller to complete this loop for a real facility and product:

> **Map-first discovery → search → facility/product → manual availability → purchase intent → immediate QR → transaction chat → external payment confirmation → fulfilment → completion and rating.**

The product must remain a search engine first. There is no conventional marketing landing page and no separate generic chat or buyer checkout product in this scope.

## Active scope

| Area | V1 commitment |
| --- | --- |
| Map and discovery | Real MapLibre map/globe-capable instance, truthful location states, visible-bbox source-backed facilities, discoverable unclaimed facilities. |
| Search | Visitor may type before auth; preserve query, quantity, budget and context; authenticate before persistent actions; replay once. |
| Availability | Manual single-facility checks for Free; active Pro bulk capability if server-authorized; Available/Partial/Unavailable, expiry and recovery. |
| Transaction | Server-authoritative intent, amount, offer/coupon, immediate QR, authorized transaction chat, external payment preference, fulfilment and rating. |
| Seller | Map-first facility workspace, demands, product/offer creation, QR scanner/manual fallback and wallet/recharge access. |
| Wallet | One rechargeable Omni Wallet with internal ledger buckets; FedaPay only for Omni wallet recharge; no withdrawal. |
| Onboarding/PWA | Progressive buyer/seller education, query replay, optional installable web app, safe-area and notification foundations. |
| Data governance | Consented, minimized, pseudonymous product events separated from private chat, exact location and payment secrets. |

## Explicit exclusions

Defer AI agents, automated availability, native mobile, buyer in-app payment, seller withdrawal, advanced advertising, advanced analytics, visual search, offline transaction execution, generic chatbot behavior and broad maturity-platform work. Do not show deferred capabilities as active navigation or fake placeholders.

## Success measures

Field readiness requires that a buyer can discover a real source-backed facility, request availability, create one idempotent QR-backed intent, resume the transaction thread, complete external/manual payment and fulfilment, and rate the result. A seller must be able to answer, verify, confirm receipt and complete the same transaction from an authorized role context.

The loop must remain coherent on narrow mobile and desktop widths, preserve the real map as the visual canvas, and pass the highest applicable proof requirements. A successful build without browser, staging, device, migration or provider evidence is not sufficient for production readiness.

## Constraints

Preserve MapLibre GL and the existing map-backed architecture. Preserve user changes and secrets. Keep buyer budget private from sellers. Keep server authority for amounts, permissions, trust states, coupon consumption, transaction status and balances. Keep external buyer-to-seller payment outside Omni. Use the latest normative implementation contract when older master sections conflict, and record that resolution in the decision contract.

## Gate status

- Ready for flow and decision contract: `yes`
- Baseline gap matrix: `docs/omni-v1-field-gap-matrix.md`
- Next slice: `Slice A — Map-first discovery and authenticated search replay`
- Blocking question: none for Slice A; later L3 decisions require contract review before migrations or provider operations.

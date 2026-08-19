# Omni V1 Product / Interface / Architecture Contract

## Identity

- Contract ID: `OMNI-V1-PIA`
- Version: `1.0`
- Status: `decided`
- Related brief: `docs/omni-v1-field-brief.md`
- Related flow contract: `docs/omni-v1-flow-and-decision-contract.md`
- Date: 2026-08-19

## Product shell

Omni is a map-first stateful application. The real MapLibre map is the shared canvas for buyer and seller. Do not create page-shaped substitutes such as a marketing landing page, a flat map fallback presented as normal, a decorative globe, or a seller dashboard that hides the map.

The primary scene is:

```text
MAP → SEARCH ACTIVE → SEARCH RESULTS → FACILITY SELECTED → AVAILABILITY → AVAILABILITY RESULTS → PURCHASE INTENT → TRANSACTION CHAT → COMPLETED
```

Overlays are projections of scene state. Closing a sheet restores the prior map/search context rather than resetting the application or re-requesting location.

## Buyer composition

The first page contains only the deliberate map-first chrome: notifications and menu at the top right, zoom/recenter/location controls on the left, the full-viewport MapLibre canvas, sparse source-backed discovery signals, attribution, and a persistent bottom search dock. Do not place a permanent top-left brand mark or a large arrival-location card over the map.

The dock owns named rows for primary search, discovery/categories, structured parameters, location context and action/request. Quantity and budget remain optional, stable and manually editable; they must not stack over the query or unexpectedly change the view while typing. Budget is private buyer context and is never sent to sellers.

Facility cards and sheets foreground the searched product/service, then show facility identity, trust status, relevant offers, price, distance, media-ready placeholders only when truthful, availability status and `Vérifier la disponibilité`. Unclaimed cards may be discovered but cannot reveal private contact, accept seller-authorized availability or show purchase actions.

Use one overlay primitive contract: desktop floating/side sheet, tablet resizable sheet, mobile bottom sheet, visible map around the surface, measured dock clearance, sticky footer, focus restoration, internal scroll and keyboard/touch reachability. Avoid duplicated rating, transaction or availability surfaces.

## Map and location

Use one MapLibre instance with a full dynamic viewport. Maintain the real globe-capable projection and source-backed vector geography. The resting state may use slow rotation and clean sparse styling only when the transition is cancellable, paused by interaction, disabled for reduced motion and tested. Search choreography may reset to world view and progress through geographic levels only when the final result framing remains reliable.

Location permission is state-aware. `prompt` requests natively without blocking the map; `granted` refreshes a fresh coordinate; `denied` explains browser recovery; `unavailable` offers approximate discovery without false precision; `retrying` shows a compact loading state. Only a fresh coordinate callback within the accepted accuracy band creates a personal position marker. Approximate market context must never be labeled as the user’s exact location.

Discovery loads from the visible MapLibre bounding box rather than a hard-coded market filter. Global/low-zoom contexts may use bounded clustering, while local result mode shows individual source-backed pins. OSM backfill remains cached, rate-limited, deduplicated by source reference and inserted as `unclaimed` with the correct market context.

## Search and onboarding boundary

Visitors may enter a query before authentication. The system stores query, structured quantity, budget and relevant location context in an ephemeral, non-sensitive replay envelope. Protected search persistence, demand requests and transaction actions require an account. After auth/onboarding, restore the envelope once, focus the result state, and clear the replay marker only after successful execution.

Buyer onboarding teaches search, facility discovery, availability, purchase intent, QR and transaction chat. Seller onboarding teaches facility trust states, catalogue/offer creation, availability response and QR operations. Keep optional location and analytics consent explicit. Do not use locale inference as precise identity or location.

## Seller composition

`/vendeur` uses the same MapLibre map-first scene with the seller’s own facilities as the operational layer. A facility pin, selector or list entry opens the facility context. The main seller actions are ordered by operational value: facility status/preview, incoming requests, catalogue and offer, QR scanner/manual verification, Omni Wallet/recharge, and only functional V1 promotion actions.

On desktop, use a compact rail or floating panel; on tablet use a resizable lower sheet; on mobile use a limited-height bottom sheet with the map visible around it. Remove dead tabs and unimplemented menu destinations. Seller notifications deep-link to the exact demand or transaction surface.

Product creation uses progressive fields: identity, category, price, availability/quantity, Omni allocation if applicable, offer state and preview. The form may create an offer in the same flow, but it must also support the honest `Aucune remise active` state. Server limits Free/Pro facilities/products and seller ownership; the client never grants a plan capability by hiding or showing a control alone.

The QR scanner opens on an explicit `Prêt à scanner` surface with a camera frame, permission state, rear-camera preference, `Autoriser et démarrer la caméra`, and `Saisir le code` fallback. Stop tracks on close, visibility change, detection and errors. Use `BarcodeDetector` when available and call the same server verification function as manual entry.

## Availability contract

The buyer’s composer starts after a search/facility context exists. It supports product/service, variant, quantity and relevant constraints. Budget is used privately by Omni for ranking/filtering and is never included in seller-facing payloads.

The single-facility path is always available to an eligible Free buyer. Pro bulk authorization is enforced server-side. Seller/field responses are one-tap `Disponible`, `Partiel`, `Indisponible`, with a quantity/price override for partial response, an immutable response record, pending state, SLA expiry, retry and no-response tracking.

The buyer comparison surface sorts by availability quality and then useful criteria such as price, distance and confidence. Recommendations must not imply AI automation when the system is manual; the user retains control of the purchase decision.

## Transaction contract

The checkout server function is the authority for product, facility trust, availability response, quantity, price, offer, coupon, payment preference and intent fingerprint. It must recompute and freeze amount rather than trust client input.

An eligible buyer action creates or reuses one idempotent transaction intent and atomically generates an expiring QR. The transaction thread is created or resumed with a timeline containing intent, offer, QR, verification, payment, fulfilment and completion states. Contact and directions unlock after intent; payment and fulfilment controls unlock only after their guards pass.

The thread is shared but role-aware. Buyer can read/write only their own transaction; seller can read/write only a transaction tied to an owned facility; system events are append-only projections. Include unread counts, timestamps, error cards, retry/terminal actions, report/block controls and deep-link recovery.

Omni does not process the buyer-to-seller payment in this V1. After QR verification, the buyer selects the seller’s supported external method and receives the necessary seller-provided instructions. The buyer may declare action; only the seller confirms external receipt. Seller marks fulfilment; buyer confirms receipt; only then may completion and rating unlock.

## Wallet and FedaPay

Present a single `Omni Wallet` UI for recharge and authorized Omni consumption. Backend buckets are `wallet`, `payout`, `ad_credit`, `coupon_credit` and `pro_credit`, each with owner, currency, available, reserved and append-only history. Non-monetary credits are not withdrawal balances.

FedaPay is only the Omni Wallet recharge provider in this scope. Browser return can show pending. Only an approved provider status/callback followed by idempotent reconciliation can credit the ledger. Duplicate callbacks, conflicting idempotency references, declines, cancellation, timeout and retry must be visible states. No buyer purchase checkout or seller withdrawal CTA is allowed.

## Data and security

Keep transactional data and analytics data separate. Required product events include onboarding, search, result/facility/product open, availability request/response, chat start/message, offer view/application/consumption, QR generation/verification, payment declaration/confirmation, fulfilment, completion, coupon events, deposit events and PWA install.

Events use pseudonymous identity where possible, consent and policy version, appropriate geographic precision, timestamp, quantity/price/discount and outcome. Do not include private chat content, exact location or payment secrets in generic analytics. Expose retention, opt-out, deletion/export and audit boundaries before building advanced admin views.

Every server mutation checks actor, ownership, trust state, plan capability and current transition. Every side effect has idempotency and stable errors. Logs redact secrets and minimize personal data. Rate-limit external discovery, QR verification and provider callbacks according to risk.

## Required database/API review before migration

Before adding a migration, compare current schema and functions against these possible contract gaps: payment preference, buyer declaration, seller receipt confirmation, fulfilment events, QR deep-link metadata, notification targets, SLA expiry, consent/policy version, wallet ledger transitions and reconciliation fields. Reuse matching structures; do not create duplicate sources of truth.

For each migration record old/new schema, compatibility window, indexes, backfill, rollback or compensating action, invariants, fixtures, and staging rehearsal. Do not execute a production mutation as a test.

## Responsive and accessibility acceptance

Certify 320, 375, 768 and 1280 pixel widths. Maintain dynamic viewport height, safe-area padding, visible focus, keyboard navigation, 16px minimum mobile input text, stable map visibility, no horizontal overflow, no dock/control overlap, touch targets large enough for use, and reduced-motion behavior.

Every async state has loading, empty, error, retry and recovery treatment. Every overlay has a clear close/back path. Every state-changing CTA names the resulting action and reflects server state after mutation.

## Slice interfaces

| Slice | Primary modules | Contract boundary |
| --- | --- | --- |
| A | `CartePage`, `MapCanvas`, `SearchDock`, auth/onboarding replay, discovery functions | Search envelope, visible-bbox discovery, truthful location and result projection. |
| B | `FacilityPanel`, `DemandRequestPanel`, demand/response functions | Availability states, seller payload privacy, quota and expiry. |
| C | `checkout.functions.ts`, transaction thread, QR, notifications | Intent fingerprint, immediate QR, coupon atomicity, participant access. |
| D | transaction thread, payment/fulfilment handlers | Buyer declaration versus seller receipt versus buyer receipt. |
| E | `vendeur.tsx`, seller panels/forms/scanner | Map-first seller operation and functional navigation. |
| F | wallet/recharge functions, wallet UI, migrations | Append-only ledger and approved FedaPay reconciliation. |
| G | onboarding, PWA shell, notification/event modules | Query replay, installability, governed product analytics. |

## Architecture decision

Do not replace the current framework, MapLibre, auth model or server-function boundary as part of this recovery. Prefer adapters, shared transition helpers, and contract tests around working infrastructure. Replace a surface only when it creates contradictory state or duplicate authority, and preserve backend contracts that pass the new invariants.

## Gate status

- Product/interface/architecture contract frozen for Slice A: `yes`
- Migration permitted before Slice A audit: `no`
- First build prompt target: `Slice A — Map-first discovery and authenticated search replay`
- Required proof before Slice B: map canvas/projection, location states, auth replay, result pins/cards, reversible selection and target-width layout certification.

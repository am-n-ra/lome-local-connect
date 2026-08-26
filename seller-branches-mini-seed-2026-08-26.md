# Omni V2 — Seller/Admin Branches mini-Seed

**Structural path:** `product > Seller workspace > catalogue lifecycle`

## Objective

Allow a Seller-ready account to manage only its own facilities and published offers, while preserving the separation between public facility discovery and private transaction QR. Every published product or service must carry an active Omni offer/discount. Certification remains a manual Reviewer/Admin decision, and Seller activation remains a separate server-authoritative decision.

## Current evidence

The existing Seller workspace supports scoped availability requests, response submission, bounded transaction/QR operations and a read-only catalogue preview derived from incoming requests. It does not yet provide a real owned-facility catalogue lifecycle: create, edit, archive, publish, offer validation or slot enforcement.

## Required mini-Root contract before implementation

The server must define the owned facility scope, Seller-ready requirement, product fields, offer fields, publication states, archive behavior, audit events, idempotency, and entitlement guardrails. No client control may imply ownership or publication without a server decision.

The commercial contract is now owner-confirmed: Free keeps the existing five published-offer limit after the applicable trust/publication gates; Seller Pro costs 10 USD per facility for 30 days or 100 USD for 12 months and removes the product-count limit for that facility. Facility Slots are account-scoped capacity entitlements: one free slot exists per account, one account may manage several companies and facilities, and each facility has an independent Pro entitlement and billing lifecycle. The user-facing amount is rendered in the user’s location currency, with XOF for Togo/Benin, GHS for Ghana and EUR for France where supported, plus an explicit fallback and no silent conversion. Every draft must carry either a percentage or fixed-amount Seller-funded reduction; the onboarding default is a percentage reduction, while fixed amounts remain supported. Recommended payment boundary: recharge the single account Wallet through hosted FedaPay checkout for the XOF pilot, reconcile only after server-side provider verification/webhook, and consume the exact facility Pro amount from Wallet on explicit opt-in renewal. No Seller payout or Buyer-to-Seller settlement is introduced in V1.

## Proposed vertical journey after Root approval

1. Seller opens the authorized workspace and sees only owned facilities.
2. Seller creates or edits a product draft with name, unit, base price, currency, offer type, offer value, offer validity and publication intent.
3. Server validates ownership, active offer, currency and entitlement before publication.
4. Public discovery shows the facility and published offer only; private transaction QR is generated later from an eligible Buyer intent.
5. Every edit creates an auditable version or event and never mutates an existing transaction snapshot.
6. Archived products disappear from new discovery and availability checks but remain readable in historical snapshots.

## Acceptance gate

Do not call the Seller Branch complete until a Seller can create/edit/publish/archive an owned offer from the UI, an unauthorized account is rejected server-side, an offer-less product cannot publish, a refresh preserves state, duplicate submits are safe, and a Buyer can still create a transaction from the published offer without confusing it with the public facility QR.

**Status:** `commercial mini-Seed accepted — mini-Root implementation may begin; payment provider integration remains a separately gated Wallet branch.`

# Omni V2 — Root External Payment Evidence

**Document ID:** `OMNI-V2-ROOT-PAYMENT-001`
**Method:** Nature Way — Phase 2, Root System
**Observed:** 2026-08-23
**Status:** `partial`

## Mini-seed

Record the buyer’s external payment choice after server-confirmed QR verification without turning Omni into a buyer-seller payment processor. The supported V1 choices are cash, mobile money and pay on delivery.

## Repository seam

The actual server repository now exposes `declareExternalPayment`. It resolves the authenticated Neon Auth subject to a non-suspended account, requires buyer membership in the transaction, locks the transaction snapshot, and accepts the declaration only when the current transaction event is `qr_verified` or the same declaration already exists. It writes the external-payment declaration, the buyer `payment_declared` transaction event and a correlation-keyed audit event in one guarded SQL operation. The transaction-level uniqueness rule makes a retry return the original declaration; a different method for the same transaction is rejected.

The operation supports only `cash`, `mobile_money` and `pay_on_delivery`. Omni does not receive, hold, settle or withdraw buyer-seller funds in this seam.

The repository also exposes `confirmExternalPayment` for the seller side. It requires a non-suspended authenticated seller member, an existing buyer declaration, `payment_declared` as the current transaction state and an unacknowledged declaration. It locks the transaction snapshot, marks the declaration acknowledged, appends `payment_confirmed` and a correlation-keyed audit event, and returns the existing confirmed declaration on replay. The authenticated `POST /api/v2/external-payment-confirmations` route delegates to this operation.

## Local proof

Repository tests cover a supported buyer declaration, the buyer-role and QR-state predicates, declaration/event/audit inserts, transaction-level conflict handling, unsupported-method rejection before SQL, missing QR/member rejection, conflicting-method replay rejection, seller confirmation gating/replay and HTTP policy mapping. The authenticated `POST /api/v2/external-payment-declarations` and `POST /api/v2/external-payment-confirmations` routes now delegate to these seams. Full local validation reports 11 Vitest files and 70 passing tests, a successful TypeScript/Vite build, five bundled Vercel functions and `Client boundary: clean`.

## Explicit non-evidence

No live authenticated payment declaration, seller acknowledgement, dispute path, payment-provider integration, payment credential handling or production transaction mutation was executed. Both routes are implemented in the V2 HTTP/serverless surface but remain unproven in a deployed authenticated session. Seller rejection/dispute and recovery are not implemented in this slice. Therefore the external-payment part of TX-02 remains `partial` until live declaration/acknowledgement, rejection/dispute, recovery and audit evidence exist.

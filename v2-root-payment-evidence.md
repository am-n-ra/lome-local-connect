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

## Local proof

Repository tests cover a supported buyer declaration, the buyer-role and QR-state predicates, declaration/event/audit inserts, transaction-level conflict handling, unsupported-method rejection before SQL, missing QR/member rejection, conflicting-method replay rejection and HTTP policy mapping. The authenticated `POST /api/v2/external-payment-declarations` route now delegates to this seam. Full local validation reports 11 Vitest files and 64 passing tests, a successful TypeScript/Vite build, four bundled Vercel functions and `Client boundary: clean`.

## Explicit non-evidence

No live authenticated payment declaration, seller acknowledgement, dispute path, payment-provider integration, payment credential handling or production transaction mutation was executed. The route is implemented in the V2 HTTP/serverless surface but remains unproven in a deployed authenticated session. Therefore the external-payment part of TX-02 remains `partial` until seller acknowledgement/rejection, recovery and live audit evidence exist.

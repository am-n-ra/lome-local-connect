# Omni continuity V1 — Phase 5 notes

## Scope delivered

The transaction thread now keeps the globe/map shell as the persistent context and exposes the canonical progress labels: Intention, Offre, QR, Paiement, Réception. Buyer payment is no longer represented as an Omni in-app payment confirmation. The buyer first chooses `cash_on_delivery`, `tmoney`, `flooz`, or `external_other`, may declare that the external payment was made, and the seller remains the source of truth for payment receipt.

The QR surface provides the token, a copy action, a shareable account-bound link at `/transaction/qr?token=...`, and a buyer deep-link return to `/carte?transactionId=...`. The QR resolver accepts only the authenticated buyer or the facility owner. The transaction timeline exposes seller contact only after QR verification has moved the transaction to `payment_pending` or later.

Seller QR validation now leads to explicit actions in the scanner history: confirm payment when the buyer has selected a method and declared remote payment (or selected cash on delivery), then start fulfillment. The buyer can confirm reception only after `fulfillment`.

## Database operation

Migration `db/migrations/028_transaction_payment_and_fulfillment.sql` was applied to the configured `neondb` database on 2026-08-18. The migration registry reports the expected checksum:

`d0fbd42e82d9b2543123d41669916ad78201ba7c02fc64fab6f96383cbfdb8c2`

The post-migration checks confirmed the four transaction columns, the expanded transaction event constraint, wallet/payout parity, five wallet buckets per account, and SQL ledger functions. No secret or connection string is stored in this document.

## Validation

The local validation remains green: 45 unit tests, TypeScript, Vite/Nitro production build, client-boundary guard, and `git diff --check`. The remaining runtime certification is the authenticated browser flow after the next production deployment.

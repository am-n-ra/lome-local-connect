# Seller facility creation contract

## Mini-seed

A Seller must be able to create a new facility from the current location or an adjusted map pin, so a real business can become discoverable without requiring an OSM record. The created facility is useful immediately as a public presence, but it must not appear certified or operationally verified before the manual claim/review path is completed.

## Mini-root

The operation is authenticated by the current Neon Auth identity and requires an active Seller account. It consumes one available facility slot for that account, attaches the facility to the account, creates it with `source_kind = created`, `trust_state = verification_draft`, and returns a recoverable facility identifier. The request uses an idempotency key to prevent duplicate facilities after retries. Coordinates are validated server-side; private evidence and certification remain separate operations.

## Acceptance criteria

1. A Seller can submit name, category, address, latitude, longitude, company name, and an idempotency key.
2. A suspended, non-Seller, or slot-exhausted account is rejected server-side.
3. Repeating the same idempotency key returns the original facility and does not consume another slot.
4. The facility is public but marked `verification_draft`; it cannot be treated as certified or as a published catalogue until the existing claim/review path advances it.
5. The UI exposes loading, validation, error, success, retry, and recovery states and does not require the Seller to type coordinates manually when location is available.
6. The operation does not alter Wallet balance, external payments, transaction state, or Pro entitlements.

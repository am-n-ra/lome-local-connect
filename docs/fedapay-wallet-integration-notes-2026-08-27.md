# FedaPay Wallet integration notes — 2026-08-27

## Decision

Omni will model a Wallet recharge as a pending internal top-up intent, create the corresponding FedaPay transaction server-side, and credit the Omni Wallet only after a verified FedaPay approval event. The FedaPay secret key remains server-only. Transaction payments in the Omni buyer/seller flow remain a separate external-payment declaration and are not credited to the Omni Wallet.

## Verified provider facts

FedaPay’s transaction creation API is a server-authenticated `POST /v1/transactions` endpoint. It accepts an integer `amount`, a currency object such as `{ iso: "XOF" }`, a description, an optional callback URL, custom metadata, and customer information; newly created transactions can be `pending`, `approved`, or `canceled`.[1]

FedaPay documents `transaction.approved`, `transaction.declined`, `transaction.canceled`, and `transaction.updated` events. Webhooks are delivered as HTTP POST requests and the receiver must return a 2xx response. FedaPay documents duplicate delivery handling and recommends storing event identifiers or object identifiers to prevent reprocessing.[2]

FedaPay signs webhook requests with the `X-FEDAPAY-SIGNATURE` header. The endpoint secret is distinct between sandbox and live mode and unique per endpoint; verification must use the raw request body and the endpoint secret.[2]

FedaPay separates test-mode objects and credentials from live-mode objects and credentials. Secret keys must remain confidential and must not be included in version control or client bundles.[3]

## Omni implementation constraints

The first release should support only a configuration-gated server adapter. If the FedaPay live/test secret and webhook secret are absent, the UI must show recharge as unavailable rather than simulating success. Each recharge intent needs an Omni idempotency key, a FedaPay transaction identifier when created, a requested amount/currency, an account owner, and a terminal status. Webhook processing must be idempotent on provider event identity and must verify amount, currency, account metadata, and pending intent before crediting.

Pro activation must consume confirmed Wallet funds in a separate atomic operation, reference the selected facility and its active Facility Slot, and create a facility-scoped ledger entry. A repeated request with the same idempotency key must return the original result without a second debit or second Pro activation.

## References

[1]: https://docs.fedapay.com/api-reference/transactions/create "FedaPay — Create a transaction"
[2]: https://docs.fedapay.com/integration-api/en/webhooks-en "FedaPay — Webhooks and Events"
[3]: https://docs.fedapay.com/integration-api/en/authentication-en "FedaPay — Authentication"

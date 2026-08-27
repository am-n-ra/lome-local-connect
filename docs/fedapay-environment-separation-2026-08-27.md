# FedaPay environment separation — 2026-08-27

## Objective

Keep existing production FedaPay credentials untouched while allowing an explicit sandbox checkout for the Wallet recharge proof. The selector must fail closed: a sandbox request may use only sandbox credentials, and a live request may use only live credentials.

## Variable contract

| Environment selector | Secret key | Webhook secret | Provider base URL |
|---|---|---|---|
| `FEDAPAY_ENV=live` | `FEDAPAY_SECRET_KEY` | `FEDAPAY_WEBHOOK_SECRET` | `https://api.fedapay.com/v1` |
| `FEDAPAY_ENV=sandbox` | `FEDAPAY_SANDBOX_SECRET_KEY` | `FEDAPAY_SANDBOX_WEBHOOK_SECRET` | `https://sandbox-api.fedapay.com/v1` |

`FEDAPAY_SANDBOX_ENV` is not required and must not become a second selector. The single authoritative selector remains `FEDAPAY_ENV`. The public key is not used by the current server-side adapter.

## Invariants

When `FEDAPAY_ENV=sandbox`, the adapter must reject the request if `FEDAPAY_SANDBOX_SECRET_KEY` or `FEDAPAY_SANDBOX_WEBHOOK_SECRET` is absent; it must never fall back to a live key. When `FEDAPAY_ENV=live`, it must reject the request if the live pair is absent; it must never fall back to a sandbox key. When `FEDAPAY_ENV` is absent or invalid, the adapter must reject configuration rather than defaulting to live.

The configuration predicate used by the UI and server must validate the selected environment and the selected secret pair. Webhook verification must select the webhook secret for the same environment as the provider request. No secret may be returned in API responses, browser bundles, logs, or proof artifacts.

## Acceptance criteria

The unit tests must cover: explicit live selection; explicit sandbox selection; missing sandbox key; missing sandbox webhook secret; missing environment selector; invalid selector; and proof that live and sandbox variables are never cross-read. Existing live production variable names remain valid for live traffic and are not renamed.

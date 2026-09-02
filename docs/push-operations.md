# Omni Web Push Operations

## Scope

This runbook covers the boundary after browser consent and durable subscription storage. It does not authorize sending notifications, expose subscription credentials, or replace the account-scoped server authorization rules.

## Required deployment configuration

Configure these values only in the server/runtime secret store and the public Vite build environment where indicated. Never commit private key material.

| Variable | Runtime | Purpose |
|---|---|---|
| `VITE_VAPID_PUBLIC_KEY` | Client build | Public application server key used to request browser subscriptions. |
| `VAPID_PUBLIC_KEY` | Server | Public key used by the delivery worker/provider. |
| `VAPID_PRIVATE_KEY` | Server secret | Private signing key; never sent to the browser or logged. |
| `VAPID_SUBJECT` | Server | Contact URI identifying the application to the Web Push ecosystem. |
| `PUSH_PROVIDER` | Server | Explicit delivery adapter name; no provider is assumed by default. |

The client must remain configuration-gated when `VITE_VAPID_PUBLIC_KEY` is absent. The server must fail closed when provider or signing configuration is absent; it must not mark a notification delivered merely because a subscription exists.

## Release sequence

First apply and verify migration 008 in the intended Neon environment. Then configure the public client key and server-only delivery values in the deployment environment. Deploy the application with the provider adapter disabled until configuration validation succeeds. Finally run a controlled authenticated proof using a non-production test account and test device.

## Required proof

The minimum evidence is an authenticated subscribe request, a persisted account-scoped subscription, one Inbox event enqueued for that account, one provider delivery acknowledgement, one browser-visible notification, one expired-endpoint cleanup result, and an authenticated revoke followed by a negative delivery check. Record the environment, test account class, correlation IDs, timestamps and rollback action. Do not use a screenshot as proof of server delivery.

## Current Omni state

Migration 008 is applied to the selected Neon parent branch. The Inbox and server registry are wired, but no VAPID/provider values are configured and no delivery proof has been claimed. Push remains `partial / configuration-gated` until the sequence above is completed.

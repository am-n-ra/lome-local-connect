# Omni Web Push — Operations

Scope: browser consent → durable subscription → server delivery. This runbook says how to
**arm** Web Push and how to **prove** it. It does not authorize exposing a private key, and it
does not let a subscription alone count as a delivery.

## Required deployment configuration

Only three variables exist. All are **server-side**; none belongs in the client build. The
browser receives the public key from `GET /api/v2/notifications/push-key`, never from the bundle.

| Variable | Runtime | Purpose |
|---|---|---|
| `VAPID_PUBLIC_KEY` | Server | Public application-server key. Served to the browser by the route above. |
| `VAPID_PRIVATE_KEY` | Server secret | Signs the push. Never sent to the browser, never logged, never committed. |
| `VAPID_SUBJECT` | Server | Contact URI for the push ecosystem. Defaults to `mailto:hello@omni.tg`. |

> **Do not invent variables.** There is no `VITE_VAPID_PUBLIC_KEY` and no `PUSH_PROVIDER` in the
> code. Setting them changes nothing. The only gate is `vapidConfig()` in
> `src/server/web-push-provider.ts`: if the public **or** private key is empty, push stays
> unconfigured and the app says so honestly (`not-configured`) instead of offering a dead button.

Server code that reads this config: `vapidConfig`, `isWebPushConfigured`, `sendWebPush`
(`src/server/web-push-provider.ts`) and the pure drain `deliverPendingPush`
(`src/server/web-push.ts`), wired in `src/server/http.ts` (`drainWebPushBestEffort`).

## Schema

Two tables, both already applied on the canonical branch `br-dawn-hill-am5amy22`:

- `v2_web_push_subscriptions` — migration `008` (account-scoped, `permission_state`, `revoked_at`).
- `v2_notification_deliveries` — migration `006` (per-event, per-channel queue).

A `web_push` delivery row is enqueued **only when the recipient already has a granted
subscription** (`src/server/trunk-repository.ts`, `push_deliveries` CTE). No subscription ⇒ no
zombie delivery. The drain claims `queued`/`retrying` rows whose `next_attempt_at` is due.

## Release sequence (arming)

1. Confirm migrations `008` + `006` are applied on the canonical branch.
2. Generate one key pair (once per environment):
   `npx web-push generate-vapid-keys` (or `node -e "console.log(require('web-push').generateVAPIDKeys())"`).
3. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` in Vercel → **Production**.
4. **Redeploy.** A Vercel deployment is an immutable artifact: an env change does not reach an
   existing deployment.
5. Verify the arm by **behaviour, not by hash**:
   `curl https://<host>/api/v2/notifications/push-key` must change from
   `{"configured":false,"publicKey":null}` to `{"configured":true,"publicKey":"B…"}`. A changed
   `configured`/`reason` value is the only real proof the variable was read.

Client that consumes consent: `src/trunk/push-subscribe.ts` (`pushSupportFor`, `createPushSubscription`)
and the consent card in `src/trunk/TrunkAppV13.tsx`. The service worker (`public/sw.js`) handles
`push` (renders the notification) and `notificationclick` (focuses/opens `?notifs=1`, the Inbox).

## Required proof (minimum evidence)

- One authenticated subscribe → one persisted account-scoped subscription.
- One Inbox event enqueued for that account.
- One provider acknowledgement: the `web_push` delivery moves `queued → delivered`.
- One browser-visible notification, and a tap that lands on the Inbox (`?notifs=1`).
- One expired-endpoint cleanup: a `404/410` send revokes the endpoint (`revoke_endpoints`).
- An authenticated revoke followed by a negative delivery check.

Record environment, account class, correlation IDs, timestamps and the rollback action. A
screenshot is **not** proof of server delivery.

Failure semantics (why a delivery ends where it does): `2xx → delivered`;
`404/410 → revoke` (dead endpoint, never retried forever); `429/5xx → retry` with bounded
backoff (5 attempts); everything else → `exhausted`. The drain only writes these outcomes; it
never fails the transaction that triggered it.

## Current Omni state — 2026-10-07

Both migrations are applied on the canonical branch. The sender, consent card, service-worker
handlers, push-key route and drain are all wired and unit/bundle-verified
(`web_push` deliveries + `VAPID_PUBLIC_KEY` present in the serverless bundle; `0` VAPID leakage in
the client bundle). **No VAPID values are configured**, so `push-key` returns `configured:false`
and no real device is subscribed — the delivery queue is legitimately empty.

Push is therefore **`partial / configuration-gated`**: the only remaining step is the founder
arming sequence above, then the authenticated proof. Until then, transaction turns stay visible
in the Inbox (in-app), which is the honest fallback.

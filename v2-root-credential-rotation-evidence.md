# Omni V2 — Credential rotation evidence

**Document ID:** `OMNI-V2-ROOT-CREDENTIAL-ROTATION-001`  
**Method:** Nature Way — Phase 2, Root System  
**Observed:** 2026-08-23  
**Status:** `manual`

## Scope

This evidence covers the bounded V2 credential rotation and the user-performed follow-up rotation after the first replacement was exposed during browser transfer. The scope was limited to the Postgres role credential used by the persistent V2 Neon branch and the Vercel project variable `V2_DATABASE_URL` for Production and Preview. Existing `DATABASE_URL` and all unrelated Vercel variables were preserved. No source code, Auth identity, legacy record, public/default branch row or fixture row was deleted or rewritten.

## Provider actions

The authenticated Neon console was opened for project `wild-moon-30984513`, branch `br-dawn-hill-am5amy22` (`omni-v2-rebuild`), database `neondb` and role `neondb_owner`. Neon reported that the role password reset completed successfully and that the previous password was no longer valid. The replacement connection string was transferred through the browser clipboard directly into the existing Vercel `V2_DATABASE_URL` edit form; its value is intentionally absent from this document and from source control.

Vercel reported `V2_DATABASE_URL` as updated for `Production and Preview`. The user subsequently redeployed the latest branch. Read-only deployment metadata shows the latest redeployment for commit `2608b82` in `READY` / `production` state, with the V2 branch alias retained. No environment value was read.

## Non-secret verification

| Check | Result |
|---|---|
| Canonical `GET /api/v2/public/facilities` | HTTP 200; returned the bounded public facility payload including the explicitly labeled demo facility |
| Canonical `GET /auth` | HTTP 200 |
| Canonical unauthenticated `POST /api/v2/availability-responses` | HTTP 401; protected route present and fail-closed |
| Canonical unauthenticated `POST /api/v2/qr-issuances` | HTTP 401; protected route present and fail-closed |
| Persistent V2 aggregate read after rotation | 2 accounts, 2 wallets, 1 owned facility, 1 owned product, 2 availability requests, 1 response, 1 purchase intent, 1 transaction snapshot, 1 QR token, 5 transaction events and 1 external payment declaration |

The aggregate read confirms that the rotated deployment and the Neon MCP connection still reach the intended persistent V2 branch. It does not prove a new authenticated seller bearer request, concurrent QR behavior, camera access or browser recovery.

## Follow-up rotation and secret-handling boundary

During the first rotation, the replacement credential was briefly rendered in browser extraction output before the dialog was reloaded to its masked state. No credential value is reproduced here. The user then performed the follow-up Neon reset, Vercel update and redeployment manually, outside the agent’s secret-handling path. This is recorded as a **manual provider action** rather than as an independently inspectable secret value. After the follow-up, status-only checks returned HTTP 200 for `/`, `/auth` and `/api/v2/public/facilities`, and HTTP 401 for unauthenticated seller response and QR issuance routes. Aggregate-only Neon verification remained unchanged at 2 accounts, 2 wallets, 1 owned facility, 1 owned product, 2 availability requests, 1 response, 1 purchase intent, 1 transaction snapshot, 1 QR token, 5 transaction events and 1 external payment declaration. No password, token, connection URL or raw Auth identifier was requested, entered or recorded by the agent during this continuation.

## Root decision

The user-performed follow-up closes the immediate credential-hygiene handoff as a manual provider action, and the post-redeployment binding checks pass. The connected browser loaded the map-first entry surface, but opening the J5 account surface timed out with browser bridge HTTP 504; this is not authenticated seller proof or recovery proof. It does not close the Root System. The Root remains `review`; the Buyer Trunk remains blocked. The fixture ledger and closure register must retain their existing bounded-demo and no-production-claim rules.

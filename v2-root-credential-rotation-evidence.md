# Omni V2 — Credential rotation evidence

**Document ID:** `OMNI-V2-ROOT-CREDENTIAL-ROTATION-001`  
**Method:** Nature Way — Phase 2, Root System  
**Observed:** 2026-08-23  
**Status:** `partial`

## Scope

This bounded operation rotated the Postgres role credential used by the persistent V2 Neon branch and updated only the Vercel project variable `V2_DATABASE_URL` for Production and Preview. Existing `DATABASE_URL` and all unrelated Vercel variables were preserved. No source code, Auth identity, legacy record, public/default branch row or fixture row was deleted or rewritten.

## Provider actions

The authenticated Neon console was opened for project `wild-moon-30984513`, branch `br-dawn-hill-am5amy22` (`omni-v2-rebuild`), database `neondb` and role `neondb_owner`. Neon reported that the role password reset completed successfully and that the previous password was no longer valid. The replacement connection string was transferred through the browser clipboard directly into the existing Vercel `V2_DATABASE_URL` edit form; its value is intentionally absent from this document and from source control.

Vercel reported `V2_DATABASE_URL` as updated just now for `Production and Preview`. The existing latest Git deployment was redeployed in Production. The resulting deployment was `READY`, was sourced from `omni-v2-rebuild` at commit `f4fc083`, and retained the canonical domain `omni.sparkafrika.online` together with the branch alias.

## Non-secret verification

| Check | Result |
|---|---|
| Canonical `GET /api/v2/public/facilities` | HTTP 200; returned the bounded public facility payload including the explicitly labeled demo facility |
| Canonical `GET /auth` | HTTP 200 |
| Canonical unauthenticated `POST /api/v2/availability-responses` | HTTP 401; protected route present and fail-closed |
| Canonical unauthenticated `POST /api/v2/qr-issuances` | HTTP 401; protected route present and fail-closed |
| Persistent V2 aggregate read after rotation | 2 accounts, 2 wallets, 1 owned facility, 1 owned product, 2 availability requests, 1 response, 1 purchase intent, 1 transaction snapshot, 1 QR token, 5 transaction events and 1 external payment declaration |

The aggregate read confirms that the rotated deployment and the Neon MCP connection still reach the intended persistent V2 branch. It does not prove a new authenticated seller bearer request, concurrent QR behavior, camera access or browser recovery.

## Credential-handling limitation

The replacement credential was not intentionally written to chat, source, evidence or a local file. During browser UI navigation, the connection panel briefly rendered the replacement password in the browser extraction output before the dialog was reloaded to its masked state. Treat the replacement as potentially exposed in the session/tool channel. This rotation therefore remains `partial` from a security perspective: a follow-up rotation through a secret-safe channel is recommended before production credential hygiene is considered closed. No credential value is reproduced here.

## Root decision

This operation closes the immediate V2 binding correction as a verified environment action, but it does not close the Root System. The Root remains `review`; the Buyer Trunk remains blocked. The fixture ledger and closure register must retain their existing bounded-demo and no-production-claim rules.

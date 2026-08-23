# Omni V2 Root — Live Seller Runner Evidence

**Document ID:** `OMNI-V2-ROOT-LIVE-SELLER-RUNNER-001`  
**Structural path:** `Root System > Auth boundary > seller bearer proof > isolated runner`  
**Method:** Nature Way  
**Observed:** 2026-08-23  
**Status:** `blocked-at-secret-store`

## Scope

This record covers only preparation and guarded execution of the isolated seller-bearer runner. It does not claim a live seller transaction, QR success, camera proof or production readiness.

## Prepared boundary

A disposable Neon branch named `omni-v2-seller-proof-20260823` was created from persistent V2. Branch-local Managed Better Auth is available with a branch-specific Auth/JWKS endpoint. The Vercel branch deployment for commit `55ec741` reached `READY` under the `omni-v2-rebuild` branch alias.

The repository now contains `scripts/prove-v2-live-seller.mjs`, the non-secret template `scripts/prove-v2-live-seller.env.example` and the command `npm run proof:live-seller`. The runner refuses the canonical Omni domain, requires `OMNI_PROOF_ENVIRONMENT=isolated`, supports sign-in and an explicitly guarded branch-local sign-up fallback, binds only the labeled seller fixture, keeps fixture IDs/tokens/idempotency values in memory and emits only redacted step markers.

## Executed checks

The runner was syntax-checked and invoked with an empty environment. It exited with the expected preflight status and listed only missing variable names. No Auth request, database mutation, bearer token, QR issuance, payment declaration or transaction transition was attempted during this preflight.

A read-only Vercel deployment check confirmed the branch deployment reached `READY`. A read-only GitHub Actions secret-name check returned HTTP 403; no secret value was read. The Preview `V2_DATABASE_URL` and branch Auth URL have not been verified as a matched deployment binding, so the runner was not pointed at the deployment.

## Not proven

The following remain open: a real branch Neon Auth sign-in/sign-up session, seller response through deployed HTTP, response idempotency conflict, buyer purchase intent, server QR issuance, first QR verification, sequential replay rejection, external payment declaration/acknowledgement, concurrent QR verification and HTTPS camera recovery. No persistent/default or production data was written by this runner-preparation pass.

## Ring decision

The isolated proof stem is prepared but cannot enter the live Trunk until an operator places fresh branch-scoped seller and buyer test credentials plus the disposable database/Preview metadata in an external secret store that is not visible to the agent. The password supplied in chat is not used. Root remains `review`; Buyer Trunk remains closed.

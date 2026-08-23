# Omni V2 — Root Auth Evidence

**Document ID:** `OMNI-V2-ROOT-AUTH-001`
**Method:** Nature Way — Root System evidence
**Observed:** 2026-08-23
**Target branch:** `omni-v2-rebuild` (`br-dawn-hill-am5amy22`)
**Status:** `partial`

## Configuration read

The read-only Neon Auth configuration for the isolated V2 branch reports Better Auth integration metadata, a branch-specific base URL and JWKS URL, email/password enabled with sign-up allowed, email verification not required, and `https://omni.sparkafrika.online` in the trusted origins list. The configuration read returned no credentials or secret values.

## JWKS reachability

The branch-specific JWKS endpoint responded with valid JSON containing one public key. Non-secret metadata was `kty=OKP`, `alg=EdDSA`, with a populated key ID. This establishes that the server-side `jose` verifier has a reachable key-discovery endpoint for the isolated branch. The server Auth adapter now fails closed for malformed or unverifiable bearer credentials instead of allowing an invalid token to surface as an internal error; focused tests cover empty/non-Bearer credentials and malformed JWT input.

## Preservation context

The separate read-only database check reported 35 rows in `neon_auth.user` and 0 rows in `public.v2_accounts` on the same isolated branch. No Auth user or V2 account was created, updated or deleted during this evidence pass.

## Open proof

The connected browser displayed an authenticated user-controlled session label, and the deployed V2 availability writer accepted the bearer-backed request. The first confirmed proof landed on production/default, which exposed that the deployment was falling back to `DATABASE_URL`. After adding `V2_DATABASE_URL` for Vercel Production and Preview with the persistent V2 branch and redeploying, the same proof was repeated against persistent V2. The persistent branch then recorded exactly one availability request, one buyer account, one idempotency key, one linked V2 account and one linked wallet after two identical browser submissions. No raw bearer token, password, email or Auth user ID was recorded. The earlier `/auth` 404 is resolved by the branch SPA rewrite and deployed Auth-sheet entry behavior.

## Auth entrypoint correction — 2026-08-23

The deployed canonical path previously returned HTTP 404 for `/auth` because Vercel had no SPA rewrite and the V2 client had no path-aware Auth entry behavior. The smallest correction is now present on the V2 branch: `vercel.json` rewrites `/auth` and `/auth/*` to the SPA shell, while `src/trunk/TrunkApp.tsx` opens the existing Auth sheet when the pathname is an Auth path. No new Auth provider, credential flow or buyer UI pattern was introduced.

A local production-like server served `/auth` with HTTP 200, and a read-only Playwright probe confirmed the expected Omni title, Auth-sheet heading, email field and password field. The Git-integrated Vercel deployment built from the `omni-v2-rebuild` branch also served `/auth` with HTTP 200 through both its deployment URL and the canonical domain. After `V2_DATABASE_URL` was added for Production and Preview and the latest production deployment was redeployed, the user-controlled session completed the bounded availability proof and aggregate Neon checks confirmed persistent-V2 binding. No secret value was recorded.

## Nature Way decision

Auth configuration, JWKS reachability, fail-closed malformed-token handling and one live authenticated availability request are **partially evidenced**. The corrected deployment now accepts the real bearer-backed request on persistent V2 and the exact sequential replay collapses to one request with one linked account and wallet. Root remains `review` because concurrent behavior, broader authenticated mutations, recovery and remaining transaction/QR evidence are still open; Trunk remains blocked until those Root conditions are closed or explicitly accepted.

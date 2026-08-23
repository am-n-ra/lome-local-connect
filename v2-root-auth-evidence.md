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

The connected browser displayed an authenticated user-controlled session label, and the deployed V2 availability writer accepted the bearer-backed request. This establishes a live authenticated request path, but not yet the same path on the persistent V2 branch. The persistent V2 branch remained at zero availability requests, while the production/default branch received the confirmed bounded test write. No raw bearer token, password, email or Auth user ID was recorded. Earlier read-only probes had shown the canonical domain at HTTP 200 and `/auth` at HTTP 404 `NOT_FOUND`; the branch correction below now serves `/auth` through the SPA. A future proof must bind the deployed test environment to persistent V2 or an explicitly approved disposable branch and repeat the same authenticated/idempotent check, recording only non-secret outcome data.

## Auth entrypoint correction — 2026-08-23

The deployed canonical path previously returned HTTP 404 for `/auth` because Vercel had no SPA rewrite and the V2 client had no path-aware Auth entry behavior. The smallest correction is now present on the V2 branch: `vercel.json` rewrites `/auth` and `/auth/*` to the SPA shell, while `src/trunk/TrunkApp.tsx` opens the existing Auth sheet when the pathname is an Auth path. No new Auth provider, credential flow or buyer UI pattern was introduced.

A local production-like server served `/auth` with HTTP 200, and a read-only Playwright probe confirmed the expected Omni title, Auth-sheet heading, email field and password field. The Git-integrated Vercel deployment built from commit `5b7672945ed5eb96946e69c1652f4a38e370b46d` also served `/auth` with HTTP 200 through both its deployment URL and the canonical domain. This proves the branch-side deep-link and existing Auth-surface entry are now deployed. It does not prove persistent-V2 database binding or successful sign-in without the user-controlled session.

## Nature Way decision

Auth configuration, JWKS reachability, fail-closed malformed-token handling and one live authenticated availability request are **partially evidenced**. The live request and its idempotent replay landed on production/default rather than persistent V2, so Root remains `review`; Trunk remains blocked until the same proof is repeated against the intended V2 data boundary and account-provisioning behavior is accepted with an owner and recovery path.

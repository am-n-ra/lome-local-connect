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

No valid bearer token was available for a real authenticated request. Therefore this artifact does not prove JWT signature acceptance for a real Neon Auth token, issuer/audience policy, authenticated availability creation, idempotent first-login V2 account provisioning, role derivation or duplicate-account prevention. A fresh read-only navigation through the enabled connected browser returned public map/catalogue content but did not expose session state; a follow-up view, sign-in-indicator search and `/auth` navigation returned HTTP 504 before inspection. Separate unauthenticated `curl` probes returned HTTP 200 for the canonical domain and HTTP 404 `NOT_FOUND` for `/auth`. These results establish public-domain reachability and a missing deployed Auth path, but not browser/session or Neon Auth proof. A future authenticated proof must use a real authorized test session or an explicitly owned fixture identity, and must record only non-secret outcome data.

## Auth entrypoint correction — 2026-08-23

The deployed canonical path previously returned HTTP 404 for `/auth` because Vercel had no SPA rewrite and the V2 client had no path-aware Auth entry behavior. The smallest correction is now present on the V2 branch: `vercel.json` rewrites `/auth` and `/auth/*` to the SPA shell, while `src/trunk/TrunkApp.tsx` opens the existing Auth sheet when the pathname is an Auth path. No new Auth provider, credential flow or buyer UI pattern was introduced.

A local production-like server served `/auth` with HTTP 200, and a read-only Playwright probe confirmed the expected Omni title, Auth-sheet heading, email field and password field. This proves the branch-side deep-link and existing Auth-surface entry only. Canonical verification after the Git-integrated Vercel build remains required; it must not be inferred from the local result.

## Nature Way decision

Auth configuration, JWKS reachability and fail-closed malformed-token handling are **partially evidenced**. Root remains `review`; Trunk remains blocked until authenticated bearer verification and account-provisioning behavior are proven or explicitly assigned as a manual test with an owner and recovery path.

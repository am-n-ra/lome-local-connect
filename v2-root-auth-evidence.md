# Omni V2 — Root Auth Evidence

**Document ID:** `OMNI-V2-ROOT-AUTH-001`
**Method:** Nature Way — Root System evidence
**Observed:** 2026-08-22
**Target branch:** `omni-v2-rebuild` (`br-dawn-hill-am5amy22`)
**Status:** `partial`

## Configuration read

The read-only Neon Auth configuration for the isolated V2 branch reports Better Auth integration metadata, a branch-specific base URL and JWKS URL, email/password enabled with sign-up allowed, email verification not required, and `https://omni.sparkafrika.online` in the trusted origins list. The configuration read returned no credentials or secret values.

## JWKS reachability

The branch-specific JWKS endpoint responded with valid JSON containing one public key. Non-secret metadata was `kty=OKP`, `alg=EdDSA`, with a populated key ID. This establishes that the server-side `jose` verifier has a reachable key-discovery endpoint for the isolated branch.

## Preservation context

The separate read-only database check reported 35 rows in `neon_auth.user` and 0 rows in `public.v2_accounts` on the same isolated branch. No Auth user or V2 account was created, updated or deleted during this evidence pass.

## Open proof

No bearer token was available for a real authenticated request. Therefore this artifact does not prove JWT signature acceptance, issuer/audience policy, authenticated availability creation, idempotent first-login V2 account provisioning, role derivation or duplicate-account prevention. The connected browser navigation also returned an HTTP 504 before session inspection. A future authenticated proof must use a real authorized test session or an explicitly owned fixture identity, and must record only non-secret outcome data.

## Nature Way decision

Auth configuration and JWKS reachability are **partially evidenced**. Root remains `review`; Trunk remains blocked until authenticated bearer verification and account-provisioning behavior are proven or explicitly assigned as a manual test with an owner and recovery path.

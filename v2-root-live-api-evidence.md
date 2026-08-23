# Omni V2 — Root Live API Evidence

**Document ID:** `OMNI-V2-ROOT-API-001`
**Method:** Nature Way — Root System evidence
**Observed:** 2026-08-22
**Target:** `https://omni.sparkafrika.online`

## Read-only public checks

| Request | Result | Observation |
|---|---:|---|
| `GET /api/v2/public/facilities` | HTTP 200 | Returned the three bounded V2 public facilities with coordinates, trust state, plan and product count |
| `GET /api/v2/facilities/00000000-0000-0000-0000-000000000001` | HTTP 200 | Returned the public facility detail and one facility-scoped published `Tomatoes` catalogue item |
| `POST /api/v2/availability` without bearer token | HTTP 401 | Returned `AUTH_REQUIRED`; no availability request was created |

The public responses included correlation IDs and the protected denial used the documented envelope. The public facility payload did not expose seller contact data, private route data or transaction permissions. The observed deployed response did contain an `availableQuantity` field in the historical Trunk API response, which violated the locked public stock boundary. The V2 branch now removes that field from the public type, serializer and SQL projection; the current local validation has 68 passing tests and the generated API bundles contain neither `availableQuantity` nor `quantity_allocated_omni`. The Git-integrated deployment built from `omni-v2-rebuild` commit `5b7672945ed5eb96946e69c1652f4a38e370b46d` now serves `/auth` with HTTP 200 on both the deployment URL and canonical domain.

## Follow-up protected-boundary probe — 2026-08-23

A fresh unauthenticated `POST /api/v2/availability` with an empty JSON object returned HTTP 401 from the canonical domain. No bearer token, valid product or facility identifier was supplied, and no data was created by that probe. Separately, after explicit user confirmation, the connected browser accepted the authenticated session and submitted the same availability flow twice for `Tomatoes` at `Cotonou Fresh Hub`, quantity 1 and no budget ceiling. Both submissions returned the same request-sent state. Aggregate-only Neon checks showed zero requests on persistent V2 and exactly one submitted request, one distinct buyer account, one distinct idempotency key, one linked account and one linked wallet on production/default.

## Protection result

The unauthenticated POST used a valid-looking idempotency header and placeholder UUID values. The server denied the request before mutation with `AUTH_REQUIRED`. This is evidence of the outer authentication gate only. It does not prove bearer verification, buyer ownership, product/facility integrity, request persistence, duplicate replay, or Auth-to-V2 account provisioning.

## Limitations and non-claims

This is a live canonical-domain smoke probe plus one explicitly confirmed authenticated availability/idempotency proof, not a complete Trunk or Root acceptance test. The authenticated write was served by the Git-integrated Vercel deployment but persisted on production/default Neon rather than the persistent V2 branch, which remained at zero requests. It does not prove persistent-V2 database binding, migration preservation, route authorization, QR replay safety, payment declarations, seller certification or recovery behavior. No credentials, tokens or key values were recorded. No further production/default mutations are authorized by this evidence.

## Nature Way decision

The canonical public read path, authenticated browser entry, live availability writer and sequential idempotency behavior are **partially evidenced**. The proof landed on production/default rather than persistent V2, so Root remains `review`; the buyer Trunk remains blocked until the intended V2 database boundary, recovery, QR concurrency/live audit and remaining transaction proofs are complete.

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

The public responses included correlation IDs and the protected denial used the documented envelope. The public facility payload did not expose seller contact data, private route data or transaction permissions. The observed deployed response did contain an `availableQuantity` field in the historical Trunk API response, which violated the locked public stock boundary. The V2 branch now removes that field from the public type, serializer and SQL projection; the current local validation has 75 passing tests and the generated API bundles contain neither `availableQuantity` nor `quantity_allocated_omni`. The Git-integrated deployment built from `omni-v2-rebuild` now serves `/auth` with HTTP 200 on both the deployment URL and canonical domain. After adding the server-preferred `V2_DATABASE_URL`, the production redeploy is bound to persistent V2 rather than falling back to `DATABASE_URL`.

## Follow-up protected-boundary probe — 2026-08-23

A fresh unauthenticated `POST /api/v2/availability` with an empty JSON object returned HTTP 401 from the canonical domain. No bearer token, valid product or facility identifier was supplied, and no data was created by that probe. The first explicitly confirmed authenticated flow landed on production/default before the binding correction and is retained as a bounded environment-mismatch fixture. After adding `V2_DATABASE_URL`, redeploying and restoring the user-controlled session, the browser submitted `Kente tote bag` at `Atelier Kegue`, quantity 1 and no budget ceiling twice. Both submissions returned the same request-sent state. Aggregate-only Neon checks showed exactly one submitted request, one distinct buyer account, one distinct idempotency key, one linked V2 account and one linked wallet on persistent V2.

## Protection result

The unauthenticated POST used a valid-looking idempotency header and placeholder UUID values. The server denied the request before mutation with `AUTH_REQUIRED`. This is evidence of the outer authentication gate only. It does not prove bearer verification, buyer ownership, product/facility integrity, request persistence, duplicate replay, or Auth-to-V2 account provisioning.

## Limitations and non-claims

This is a live canonical-domain smoke probe plus two explicitly confirmed authenticated availability/idempotency proofs, not a complete Trunk or Root acceptance test. The first write persisted on production/default and is retained only as a bounded environment-mismatch fixture. The corrected deployment then persisted the second proof on persistent V2 and collapsed two identical submissions to one request with one linked account and wallet. It does not prove migration preservation, authenticated seller route authorization, QR replay safety, payment declarations, seller certification or recovery behavior. The latest READY deployment also returned HTTP 200 for `/auth` and the public facilities read, while unauthenticated seller-response and QR-issuance POST probes returned HTTP 404 before the missing Vercel entrypoint correction; those 404 observations triggered the adapter fix and are not current route behavior. No credentials, tokens or key values were recorded. No further production/default mutations are authorized by this evidence.

## Nature Way decision

The canonical public read path, authenticated browser entry, live availability writer and sequential idempotency behavior are **verified for this bounded operation on persistent V2**. Root remains `review` because database migration decision, ownership enforcement breadth, concurrent QR/live audit, transaction/payment mutations and recovery are not yet closed; the buyer Trunk remains blocked until the remaining Root exit evidence is complete.

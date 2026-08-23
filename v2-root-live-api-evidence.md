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

The public responses included correlation IDs and the protected denial used the documented envelope. The public facility payload did not expose seller contact data, private route data or transaction permissions. The observed deployed response did contain an `availableQuantity` field in the historical Trunk API response, which violated the locked public stock boundary. The V2 branch now removes that field from the public type, serializer and SQL projection; 30 local tests pass and the generated API bundles contain neither `availableQuantity` nor `quantity_allocated_omni`. Because no deployment was performed, canonical-domain verification of the fix remains open.

## Follow-up protected-boundary probe — 2026-08-23

A fresh unauthenticated `POST /api/v2/availability` with an empty JSON object returned HTTP 401 from the canonical domain. No bearer token, idempotency key, valid product or facility identifier was supplied, and no data was created. This reconfirms only the outer authentication denial at the deployed endpoint; it does not prove live bearer acceptance, request persistence, idempotent replay or account provisioning.

## Protection result

The unauthenticated POST used a valid-looking idempotency header and placeholder UUID values. The server denied the request before mutation with `AUTH_REQUIRED`. This is evidence of the outer authentication gate only. It does not prove bearer verification, buyer ownership, product/facility integrity, request persistence, duplicate replay, or Auth-to-V2 account provisioning.

## Limitations and non-claims

This is a live canonical-domain smoke probe plus a branch-side static boundary check, not a complete Trunk or Root acceptance test. It does not prove the connected browser interaction path, authenticated availability creation, server-side validator wiring, migration preservation, route authorization, QR replay safety, payment declarations, seller certification or recovery behavior. The live probe created no data and exposed no credentials; the branch-side fix is not live until the V2 branch is deployed through the normal Vercel integration.

## Nature Way decision

The canonical public read path and unauthenticated protected-write denial are **partially evidenced**. The public stock leak is fixed in the isolated V2 branch and covered by executable proof, but the deployed canonical endpoint still requires a later verification after the normal branch deployment. Root remains `review`; the buyer Trunk remains blocked until authenticated and recovery proofs are complete.

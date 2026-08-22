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

The public responses included correlation IDs and the protected denial used the documented envelope. The public facility payload did not expose seller contact data, private route data or transaction permissions. The public catalogue item contained an `availableQuantity` field in the current historical Trunk API response; this remains a Root/Trunk review item because the locked public map/pin rule is that presence and catalogue visibility must never be interpreted as current guaranteed stock.

## Protection result

The unauthenticated POST used a valid-looking idempotency header and placeholder UUID values. The server denied the request before mutation with `AUTH_REQUIRED`. This is evidence of the outer authentication gate only. It does not prove bearer verification, buyer ownership, product/facility integrity, request persistence, duplicate replay, or Auth-to-V2 account provisioning.

## Limitations and non-claims

This is a live canonical-domain smoke probe, not a complete Trunk or Root acceptance test. It does not prove the connected browser interaction path, authenticated availability creation, server-side validator wiring, migration preservation, route authorization, QR replay safety, payment declarations, seller certification or recovery behavior. The test created no data and exposed no credentials.

## Nature Way decision

The canonical public read path and unauthenticated protected-write denial are **partially evidenced**. Root remains `review`; the buyer Trunk remains blocked until authenticated and recovery proofs are complete and the public API’s stock semantics are reconciled with the Root contract.

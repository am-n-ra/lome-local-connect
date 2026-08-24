# Omni V2 — Private claim evidence mini-Root

**Structural path:** product → field pilot → Branch A → claim verification → private evidence storage

**Status:** `ready / blocked on provider provisioning`

**Parent:** [`v2-field-pilot-registry-root.md`](./v2-field-pilot-registry-root.md)

## Mini-seed

A legitimate claimant must be able to attach bounded identity, company, facility, product, service or location evidence to their own resumable claim. A reviewer must be able to inspect only the private evidence associated with a submitted request. Public discovery must never expose the file, object key or a public download URL.

The user-visible journey is: choose an evidence category → select a local file → receive an upload progress/result state → repeat or remove before submission → submit the claim only when the server verifies the private objects. An interrupted upload must leave the claim resumable and must not create a submitted request.

## Mini-species inheritance

The surface inherits the approved Species: one J5-owned contextual sheet over the permanent MapLibre scene, no parallel navigation, safe-area spacing, explicit locked/loading/error/success copy, touch-friendly file controls and no private evidence preview in public facility cards. The sheet must say that evidence supports review and does not itself certify identity, ownership, trust, stock or catalogue.

## Provider decision

Vercel Blob private storage is the selected provider candidate because the application is already deployed on Vercel and the provider supports private stores. Official documentation states that private Blob stores require authentication for all reads and writes, use OIDC with short-lived automatically rotated credentials when connected to a Vercel project, and should be served through an authenticated Function rather than a public URL.[1] Client uploads are preferred for evidence because Vercel Functions have a 4.5 MB request-body limit for server uploads; the browser-to-Blob path still requires an authenticated and authorized server token exchange.[2]

The provider store is **not provisioned yet**. No store creation, project connection, environment-variable change or uploaded object is authorized by this document. The owner must create or connect one private Blob store to the existing Vercel project and enable only the environments required for the pilot. The code must remain fail-closed until the runtime exposes the provider configuration.

## Storage contract

| Concern | Locked contract |
|---|---|
| Store access | Private only; never public Blob access for claimant evidence |
| Upload route | Existing `POST /api/v2/facilities/:id?action=claim-upload` wrapper; no new Vercel function |
| Token authorization | Neon Auth session plus claimant ownership of the request; request state only `draft` or `needs_more_evidence`; facility must remain unowned |
| Path | `claims/{requestId}/{evidenceKind}/{clientName}` with provider random suffix; server rejects path traversal, foreign request IDs and mismatched categories |
| Types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| Size | Maximum 10 MB per object; maximum 12 evidence objects per claim; provider/client enforces the limit and server verifies metadata |
| Database value | Store only an opaque internal reference derived from the provider pathname, never a public URL or raw file bytes |
| Submit verification | For every submitted reference, server checks request ownership, path binding, private object existence, allowed content type and maximum size before inserting evidence rows |
| Reviewer exposure | Count, category, content type, size and timestamps only until an authenticated reviewer download endpoint is separately implemented; never expose object keys to the client queue |
| Download | Future authenticated reviewer/claimant stream route with direct auth beside `get()` and `Cache-Control: private, no-store` for sensitive content; not part of the first upload gate |
| Cleanup | No destructive automatic deletion in this slice. Orphaned objects require a later retention/reconciliation job and explicit policy |

## State and failure contract

`draft → uploading → draft` on successful object upload; `draft → submitted` only after a server-side existence/ownership/content check; `draft → error` is recoverable; `draft → cancelled` uses the existing claimant-owned cancellation path. A token request without Auth, without claimant ownership, with an invalid category/path, or with unavailable provider configuration returns a non-retryable policy/auth error and performs no database write. A transient provider failure is retryable but must not advance the claim state.

The client upload completion callback must not trust browser-supplied identity. It may be used only for provider completion handling; the final evidence database insert remains the authenticated submit operation. No raw Auth ID, provider token, private key, public URL or file bytes may appear in logs, browser-visible error envelopes or proof documents.

## Mini-heartwood acceptance

The slice is not accepted until tests cover unauthenticated token request, claimant ownership, reviewer/other-claim denial, invalid category/path, path traversal, unsupported MIME, oversized object, provider unavailable, missing object, object from another request, stale claim version, duplicate submit, interrupted upload and safe retry. A browser proof must show the actual file picker/upload state only after a private store is provisioned; before provisioning, the UI must remain honestly locked.

## Next manual gate

Provision one **private** Blob store connected to the existing `omniview` Vercel project, without sharing its token or any credential in chat. Then run a read-only environment/configuration check and deploy the fail-closed adapter. Only after that check passes may an explicitly authorized bounded evidence upload be attempted. No role grant, OSM import, claim submission or review is implied by this document.

## References

[1]: https://vercel.com/docs/vercel-blob/private-storage "Vercel Docs — Private Storage"

[2]: https://vercel.com/docs/vercel-blob/client-upload "Vercel Docs — Client Uploads with Vercel Blob"

[3]: https://vercel.com/docs/vercel-blob/security "Vercel Docs — Blob Security"

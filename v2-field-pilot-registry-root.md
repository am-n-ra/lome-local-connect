# Omni V2 — Ring A registry and claim mini-Root

**Structural path:** product → field pilot → Ring A → operator facility registry → representative claim

**Status:** `ready_for_review`

**Parents:** [`v2-field-pilot-seed-amendment.md`](./v2-field-pilot-seed-amendment.md), [`v2-field-pilot-plan.md`](./v2-field-pilot-plan.md), [`v2-roots.md`](./v2-roots.md), [`v2-flow.md`](./v2-flow.md)

## 1. Mini-seed

A member of the Omni team must be able to register a bounded facility record in the Lomé–Aflao pilot, preserve its public source attribution and deduplicate it against existing records. A legitimate representative must be able to select an unclaimed facility or use an available Facility Slot, start a claim and submit private evidence. One or more authorized Omni reviewers may review the request and record `certified`, `unconfirmed`, `rejected` or `needs_more_evidence`; the claimant must never be able to issue their own trust outcome.

## 2. Source and authority split

| Fact | Authority |
|---|---|
| Public OSM presence/name/coordinates | Reviewed, cached Omni public-source record with provider attribution and freshness |
| Omni facility identity | `v2_facilities` plus source dedupe reference; a public imported facility may have no `account_id` until an approved claim |
| Claim ownership request | `v2_verification_requests` plus claimant Auth-linked account |
| Evidence | `v2_verification_evidence`, private object reference and checksum/metadata |
| Review outcome | `v2_verification_reviews` by an authorized reviewer; facility status history/audit |
| Notification | Omni event/outbox/inbox, never OSM |

A source record may be visible while unclaimed. A claim may be submitted while not certified. A certified facility may still have no catalogue or current availability.

## 3. Data contract

The existing V2 schema already has the base `v2_facilities`, `v2_facility_slots`, `v2_public_sources`, `v2_facility_source_refs`, `v2_discovery_runs`, `v2_verification_requests`, `v2_verification_evidence`, `v2_verification_reviews` and `v2_audit_events` tables. The Root closure must add only the smallest missing structures:

- `v2_account_roles`: account, role (`buyer`, `seller`, `operator`, `reviewer`), state, grant/revoke actor, timestamps and unique active role per account.
- `v2_notification_events`: event type, aggregate reference, recipient account, dedupe key, payload-safe data, correlation ID, created/seen timestamps and retention state.
- `v2_notification_deliveries`: event, channel (`in_app`, `web_push`), status, attempt count, next attempt, provider reference and last error class; no raw subscription secret in evidence/logs.
- `v2_operator_runs`: bounded import/review/recovery owner, geography/bounds, source, outcome, count, error class and evidence reference, if not already present in the deployed branch.

The migrations are additive and idempotent, with forward and invariant checks recorded for both a disposable fork and the persistent V2 runtime branch. The first migration adds roles, status history, operator runs and notification storage; the follow-up allows public source facilities to remain unowned and permits only one active claim per facility. They are applied on the persistent V2 branch bound to Vercel, while the Root gate remains open for role grants, evidence storage, reviewer proof and operational recovery.

## 4. API contract

All endpoints return `{ ok, correlationId, data?, error? }` and never return raw Auth IDs, private evidence keys or secrets.

| Operation | Endpoint | Authority | Core result |
|---|---|---|---|
| Bounded public import | `POST /api/v2/operator/public-imports` | Active `operator` role | Run ID, source outcome/count, dedupe summary and recovery state |
| Public discovery | `GET /api/v2/public/facilities` | Public | Source-backed public facilities/clusters; no private claim data |
| Create facility | `POST /api/v2/facilities` | Auth account with available slot, or active `operator` with bounded policy | Facility in `unclaimed`/`verification_draft` lifecycle and assigned slot when applicable |
| Start/resume claim | `POST /api/v2/facilities/:id/claims` | Auth claimant; unclaimed or claimant-owned request | Versioned draft request; idempotent by facility/account/current request |
| Submit evidence | `POST /api/v2/verification-requests/:id/submit` | Claimant who owns the request | `submitted` request, private evidence refs, audit event and reviewer inbox event |
| Review claim | `POST /api/v2/verification-requests/:id/review` | Active `reviewer` role; one or more members may review according to policy | Audited outcome and facility status transition; no client status accepted |
| Read own claim | `GET /api/v2/verification-requests/:id` | Claimant or reviewer | Redacted state, safe evidence metadata and next action |
| Read operator queue | `GET /api/v2/operator/runs` | Operator/reviewer | Bounded runs, counts, errors and recovery state |
| Read inbox | `GET /api/v2/notifications` | Auth account owner | Own events only, paginated and redacted |
| Mark inbox event | `POST /api/v2/notifications/:id/seen` | Recipient owner | Idempotent seen transition |

The API must reject missing/invalid bounds, unbounded imports, duplicate source references, cross-account claims, reviewer self-approval where the policy forbids it, evidence without private storage ownership and all client-provided trust/status/role values.

## 5. State machines

### Facility lifecycle

`unclaimed → verification_draft → verification_submitted → admin_review → certified | unconfirmed | rejected`.

An operator may create a public source-backed `unclaimed` record without assigning ownership to the operator. A claimant may create a draft. Only a reviewer may produce an outcome; the approved outcome binds the facility to the claimant through a separate audited ownership transition. Suspension is a separate audited operation. No claim click, catalogue action, sale count or paid plan can directly create `certified` or `confirmed`.

### Verification request

`draft → submitted → admin_review → certified | unconfirmed | rejected | needs_more_evidence → submitted | cancelled`.

Every retry uses the current version. A stale version receives `STALE_STATE`; a duplicate submission returns the original request result; cancellation is allowed only before review; a rejected request remains readable with a safe next action.

### Notification

`created → queued → delivered | failed → retrying → delivered | exhausted`, with a separate idempotent `seen_at` transition. In-app delivery is the required first channel. Web Push is opt-in and may fail without blocking the business state.

## 6. Authorization and privacy

The server derives the actor from the Neon Auth session. The client cannot assign roles, facility ownership, reviewer status, trust outcome, source freshness, evidence visibility or notification recipient. Operators and reviewers are separate capabilities even if the same human account holds both; each sensitive action records the effective role and reason. Evidence object keys remain private and are never embedded in public facility responses.

## 7. Mini-heartwood acceptance

The slice requires positive and negative tests for: no Auth session, suspended account, unavailable slot, duplicate source, duplicate claim, another claimant’s facility, another reviewer’s request, reviewer self-approval policy, forged trust outcome, malformed coordinates/bounds, oversized evidence metadata, stale version, repeated submit, retry after timeout, rejected/needs-more-evidence resume, notification duplicate, notification privacy and operator import recovery.

## 8. Mini-canopy acceptance

The operator and claimant surfaces inherit the approved Species: permanent MapLibre scene, compact Acheter/Vendre, J5 account ownership, right controls, no dashboard/hamburger, contextual rounded sheets, explicit state copy, safe-area spacing, keyboard focus order, mobile touch targets, reduced-motion behavior and accessible names. No new facility workflow may create a second navigation owner or cover the map.

## 9. Stop gate

Do not treat the applied migration as a production-readiness acceptance until the deployment’s current Auth session behavior, account provisioning, role grants, object storage path and reviewer ownership are confirmed. Do not import all OSM data for Lomé–Aflao from the browser. The first operational implementation must use a bounded, reviewed import fixture or operator payload and produce an auditable run; source breadth expands only after dedupe and recovery evidence.


## 10. 2026-08-24 Heartwood checkpoint

The Vercel runtime target is now aligned with the persistent V2 Neon branch. The production deployment `dpl_3bWyJ4ArKKYmAfXBwi6JxHRwBxxw` reached `READY`, retained the canonical aliases, and reported exactly 12 Node.js functions.

The implementation now exposes the following actual multiplexed routes without adding a function: `POST /api/v2/facilities/:id?action=claim`, `POST /api/v2/facilities/:id?action=claim-submit`, `POST /api/v2/facilities/:id?action=claim-cancel`, `GET /api/v2/public/facilities?reviewer=queue` and `POST /api/v2/facilities/:id?action=review`. Claim drafts are resumable and versioned; cancellation is claimant-owned, pre-review and returns the public facility to `unclaimed` only when it remains unowned. Evidence submission accepts only typed `private://omni/` references and rejects raw files, data URLs and public URLs before persistence.

Private object storage is not configured in the runtime. Therefore a valid evidence submission currently stops with `EVIDENCE_STORAGE_UNAVAILABLE` and leaves the claim as a resumable draft; the UI shows the same locked state and does not simulate upload or review. Reviewer queue results expose only evidence count/categories, never private object keys. Review now requires private evidence, emits an in-app delivery row idempotently, records facility history, and maps `certified` to the Free publication state `unconfirmed` rather than silently implying confirmed stock or ownership.

Validation passed: `104` Vitest tests, `npm run build` with exactly 12 Vercel functions, client boundary clean and `git diff --check`. Browser proof passed for the fresh globe/map-first surface, public cluster/pin continuity, existing bounded fixture detail and no-write behavior. Full claim draft → private upload → submit → reviewer decision remains unproven because object storage and an active reviewer role are not configured for the Browser Sandbox session.

**Ring decision:** `partial / blocked at evidence-storage gate`. Do not grant roles, import facilities, submit claims, review claims or claim pilot readiness until the owner explicitly selects trusted accounts and the private evidence storage adapter/contract is configured and proven.


## 11. 2026-08-24 — Private evidence storage contract checkpoint

The private evidence mini-Root is recorded in [`v2-field-pilot-storage-root.md`](./v2-field-pilot-storage-root.md). Vercel Blob private storage is the selected provider candidate because the application is already hosted on Vercel and the provider documents authenticated reads/writes for private stores, OIDC for server-side access when connected to a project, and authenticated server token exchange for browser uploads.[1] The implementation uses the existing facility wrapper, so the deployment remains at exactly 12 functions.

The source now contains a fail-closed provider adapter: authenticated claimant-only token issuance, request/category-bound paths, private access, allowed MIME types (`JPEG`, `PNG`, `WebP`, `PDF`), a 10 MB per-object limit, twelve-object claim limit, provider random suffixes, private object metadata verification before submit, an authenticated private stream boundary with `Cache-Control: private, no-store`, and no public URL/object-key exposure in reviewer summaries. Claim submission now rechecks request ownership/version/state, verifies provider objects, then inserts evidence and advances the request only if all checks pass.

The Vercel Blob store is **not provisioned or connected yet**, and no provider environment variable is available to the runtime. Therefore the code remains intentionally blocked at `EVIDENCE_STORAGE_UNAVAILABLE`; no file has been uploaded and no claim has been submitted. The Browser Sandbox still has no active `operator` or `reviewer` role. This is a partial Root/Heartwood checkpoint only: storage provisioning, active-role upload proof, reviewer download proof, retention/reconciliation, role bootstrap, OSM import and pilot data mutations remain open. Global Root remains `review`; no production-readiness claim is made.

[1]: https://vercel.com/docs/vercel-blob/private-storage "Vercel Docs — Private Storage"

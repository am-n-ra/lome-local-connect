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
| Omni facility identity | `v2_facilities` plus source dedupe reference |
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

The migration must be additive, idempotent and accompanied by forward checks, invariant checks, recovery steps and a statement of preserved Auth/legacy records. It must not be applied to the production database until the Root gate is explicitly accepted.

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

An operator may create a public source-backed `unclaimed` record. A claimant may create a draft. Only a reviewer may produce an outcome. Suspension is a separate audited operation. No claim click, catalogue action, sale count or paid plan can directly create `certified` or `confirmed`.

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

Do not implement or apply the migration as accepted until the deployment’s current Auth session behavior, account provisioning, role grants, object storage path and reviewer ownership are confirmed. Do not import all OSM data for Lomé–Aflao from the browser. The first implementation should use a bounded, reviewed import fixture or operator payload and produce an auditable run; source breadth expands only after dedupe and recovery evidence.

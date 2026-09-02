# Omni V2 — Field pilot delivery plan

**Document ID:** `OMNI-V2-FIELD-PILOT-PLAN-001`

**Status:** `in_progress / bounded pilot decisions accepted / Root gate open`

**Parent documents:** [`v2-seed.md`](./v2-seed.md), [`v2-field-pilot-seed-amendment.md`](./v2-field-pilot-seed-amendment.md), [`v2-flow.md`](./v2-flow.md), [`v2-species.md`](./v2-species.md), [`v2-roots.md`](./v2-roots.md), [`v2-plan.md`](./v2-plan.md)

**Date:** 2026-08-24

> This document is a focused delivery plan for a controlled field pilot. It is not a replacement for `v2-plan.md` and does not turn the current prototype into a production-ready marketplace by declaration.

## 1. Outcome and release rings

**Confirmed pilot frame (2026-08-24):** initial geography is **Lomé–Aflao**, with as much OSM-backed coverage as can be responsibly bounded and reviewed; one or more Omni team members may review facility claims; the first notification layer is the Omni inbox followed by opt-in PWA/Web Push capabilities; OSM path A is selected for the first ring — bounded operator import/read context with attribution, without automatic OSM edits by Omni.

The target is a controlled pilot where Omni staff can onboard facilities in a named geography and real Buyers/Sellers can use the real V2 flow with honest states, audited ownership and recoverable failures. The work is sequenced into rings so a missing Root or Heartwood contract cannot be hidden behind a more attractive map.

| Ring | User-visible outcome | Entry gate | Exit evidence |
|---|---|---|---|
| Ring A — Field registry | Operator registers/imports a facility; public map shows source-backed unclaimed context; representative can create/resume a claim | Seed amendment accepted; geography and operator owner named | Facility/source dedupe, attribution, claim draft/resume/cancel, audit and browser proof |
| Ring B — Trusted catalogue | Reviewer issues an audited outcome; eligible Seller publishes facility-scoped catalogue; Buyer selects a catalogue product without typing a product name | Verification and catalogue contracts pass | Positive/negative authorization tests, published/empty/sold-out states, responsive Species proof |
| Ring C — Offers and demands | Buyer submits availability request; authorized Seller responds; Buyer compares fresh/stale/expired answers and receives an in-app event | Ring B complete; real Auth sessions available | End-to-end request/response with idempotency, ownership, freshness, notification and recovery evidence |
| Ring D — Authorized handoff | Eligible Buyer creates an intent; contact/itinerary/transaction room unlock only after server transition; QR/payment declaration/fulfilment follow the flow | Ring C and transaction Root gates complete | Immutable snapshot, transaction timeline, QR replay safety, external-payment boundary, fulfilment/receipt evidence |
| Ring E — Controlled field opening | Named operators onboard a bounded cohort, monitor incidents and repeat the flow without engineering intervention | Canopy and release gates pass for the chosen ring | Runbook, rollback, support owner, metrics, deployment record and acceptance decision |

**Same-day objective:** reach an evidence-backed Ring A/B or Ring C pilot checkpoint only if the required dependencies already pass. It is not realistic or safe to promise global coverage, flawless OSM freshness, or unrestricted production opening before the Root, Auth, operations and recovery gates are closed.

## 2. Architecture choices that must be explicit

### 2.1 Public-source and OSM boundary

OSM remains a source of geographic/public context. Omni stores normalized facility records and source references, then owns claim, verification, catalogue, availability and transaction state. A claim is not an OSM edit; importing a public record does not certify a facility; a public pin never proves stock, trust, ownership or permission.

The map layer must use a provider adapter and visible attribution. The public OSM tile service is best-effort and has no SLA; it cannot be treated as Omni’s production guarantee. Any direct use must preserve the correct HTTPS endpoint, stable application identification, Referer behavior, cache headers and no bulk/prefetch/offline behavior. A provider switch must be possible without a client release.

Nominatim is restricted to deliberate, moderate user-triggered lookup and must not power client autocomplete, systematic area scans or recurring bulk geocoding. Bounded operator imports must use a cached source pipeline. If Omni needs ongoing source freshness, consume OSM replication diffs through a checkpointed worker that reads the state file, validates sequence continuity, tolerates duplicate transaction-ID data, retries safely and records recovery state.

### 2.2 Notification boundary

OSM diff/change signals are not user notifications. Omni publishes authorized domain events to its own outbox and projects them into an account-owned in-app inbox. Web Push is optional and opt-in, using a service worker and secret subscription endpoint; email/SMS require a separately supplied and verified provider. Delivery must be retryable, deduplicated, preference-aware and privacy-preserving.

### 2.3 Hosting and worker options

| Approach | Tradeoffs | Cost | Setup Complexity |
|---|---|---|---|
| **A. Pilot-first managed deployment** — keep the current web/API deployment, use bounded operator imports and low-frequency scheduled reconciliation, and ship the in-app outbox before external delivery | Smallest change and fastest route to a bounded cohort; not suitable for minute-level freshness, continuous diff consumption or guaranteed push delivery until a worker/provider is added | Existing hosting/database usage plus any map/geocoding provider; no new always-on compute required to start | **Low–medium** |
| **B. Managed always-on worker** — add a persistent worker for OSM diff checkpoints, outbox dispatch, retries and health checks | Better freshness and reliable queue processing; adds operational cost, deployment/monitoring and a new failure surface; still needs an independent notification provider | Reserved hosting is usage-based, up to approximately **$37.50/month** at full 24/7 use for 1 vCPU/0.5 GB, less the $10 monthly usage credit, plus egress and any provider fees | **Medium–high** |
| **C. Source-data service boundary** — use a managed OSM-derived tile/geocoding/data provider and keep Omni’s own ingestion limited to reviewed records | Reduces direct dependency on community endpoints and operational burden; introduces vendor cost, API-key management and provider lock-in; does not solve claims, trust or notifications | Provider-dependent recurring cost plus current hosting/database | **Medium** |

**Decision:** path A is selected for the first bounded Lomé–Aflao ring. The lightest pilot begins with operator-bounded imports and the in-app inbox; B remains a later option if the agreed freshness/latency target requires continuous background work, and C remains an alternative if the team later chooses a managed OSM-derived source service.

## 3. Dependency-ordered work

### Phase 0 — Seed acceptance

Confirm the pilot geography, initial cohort size, operator ownership, notification channels and OSM role. Record the decision in the Seed amendment. The safe default is one bounded geography, operator-assisted onboarding, OSM read/import only and in-app notifications first.

### Phase 1 — Species extension

Inherit the approved map-first Species. Add only the new surfaces required by field onboarding: account role context, facility registration, claim progress, evidence capture, reviewer outcome, catalogue authoring and notification inbox. Keep the permanent MapLibre scene, compact Acheter/Vendre, J5 account owner, right controls, no dashboard/hamburger, contextual rounded sheets and explicit public/source/trust semantics.

For each new surface, specify idle, loading, empty, invalid, duplicate, blocked, rejected, needs-more-evidence, success, retry, cancel, back and interrupted-session states before implementation. Produce the maquette extension and keyboard/mobile safe-area checks before styling the Trunk.

### Phase 2 — Root closure

1. Confirm first-login account provisioning and role capability rules without changing Auth identities.
2. Add or verify server operations for `createFacility`, `discover`, `submitVerification`, `reviewVerification`, `getFacility`, `getCatalogue` and operator recovery.
3. Add missing constraints, unique keys, optimistic/version checks, audit events, correlation IDs, idempotency and privacy boundaries.
4. Implement source tables and operations for attribution, freshness, dedupe, import runs, state checkpoints and failures. Do not run a bulk OSM import directly from the browser.
5. Define V2 notification event/outbox/inbox contracts, read/seen semantics, dedupe key and dispatch state. Keep external push/email/SMS behind adapters.
6. Write additive migration checks and recovery procedures. Preserve Auth identities, legacy rows and existing V2 fixtures. Any main-branch migration requires explicit approval after temporary-branch verification.
7. Establish observability for import latency/error, dedupe conflicts, claim funnel, review age, catalogue publication, availability latency, notification delivery and recovery.

Root exit requires positive and negative authorization tests plus a documented human owner for review, import and incident response.

### Phase 3 — Trunk slices

Deliver one slice at a time, in this order:

1. **Operator facility registry:** bounded import/register → duplicate review → public map/source card → facility detail.
2. **Representative claim:** account → select unclaimed facility or create facility → draft evidence → submit → resume/cancel → reviewer decision.
3. **Catalogue:** authorized owner → product draft → validation/allocation → publish → public catalogue/empty/sold-out states.
4. **Buyer demand:** map → facility → catalogue product → quantity/constraints → availability request → request resume.
5. **Seller offer:** owned queue → product-scoped response → available/partial/unavailable → correction → Buyer inbox and comparison.
6. **Authorized handoff:** eligible response → idempotent intent → immutable snapshot → protected contact/route/transaction room → QR/payment declaration/fulfilment only when their own gates pass.

No slice is accepted if its UI is a mock, its server operation is missing, its data is fixture-only without a label, or its failure/recovery states are absent.

### Phase 4 — Heartwood hardening

Run forged-account, forged-facility, cross-owner, duplicate-submit, stale-version, expired-request, replayed-QR, private-link, source-failure, notification-retry, session-refresh and back-navigation tests. Verify that a public pin cannot create a claim outcome, trust badge, stock promise, contact or transaction permission. Verify that an OSM change cannot overwrite a claimed/certified Omni record without an explicit review policy.

### Phase 5 — Canopy and operations

Certify Species consistency across Buyer, Seller and operator sheets at the required widths. Test keyboard focus, touch targets, reduced motion, screen-reader names, safe areas, map interaction, loading performance, cached source behavior, attribution visibility and error copy. Write the field runbook: onboard, review, correct duplicate, suspend, recover import, recover notification, support a user and rollback a deployment.

### Phase 6 — Rings decision

Open only the ring whose evidence is complete. Start with a named cohort, bounded geography and support owner. Monitor denominators, not anecdotes. Pause the ring if Auth, authorization, source integrity, private-data exposure, notification ownership, financial boundary or rollback evidence fails.

## 4. Backlog mapping

| Work package | Existing feature IDs | Current disposition |
|---|---|---|
| Facility registry and source boundary | `MAP-006`, `MAP-007`, `TRUST-002`, `TRUST-003`, `OPS-003` | **Open / runtime missing** |
| Claim and review | `TRUST-001` through `TRUST-008`, `TRUST-012`, `TRUST-013`, `OPS-001`, `OPS-002` | **Open / manual authority** |
| Catalogue publishing | `CAT-001` through `CAT-005`, `SELL-007` through `SELL-013` | **Open / current UI is preview-only** |
| Buyer/Seller offers and demands | `AVAIL-001` through `AVAIL-006`, `COMP-001` through `COMP-003`, `SELL-004` through `SELL-006` | **Partially proven / not pilot-closed** |
| Notifications and PWA | `SYS-001` through `SYS-006`, `TXN-009` | **Open / no V2 outbox proof** |
| Transaction and fulfilment | `TXN-001` through `TXN-012`, `QR-001` through `FUL-004` | **Open / later ring** |
| Canopy and release | `QUAL-001` through `REL-007` | **Open / Global Root remains review** |

## 5. Stop conditions

Stop before public pilot opening if any of these is true: the geography/operator owner is unnamed; facility creation or claim can bypass review; a seller can publish another facility’s product; a public OSM pin implies trust or stock; source import has no dedupe/checkpoint/recovery; notifications are sent from the browser or an OSM endpoint; real Auth behavior is not tested by the account owner; private contact/route/QR is reachable before its state transition; payment or withdrawal is implied; or the field team has no support and rollback runbook.

## 6. Acceptance record to produce

The release record must include the accepted Seed amendment, Species extension, Root/API/migration diff, test commands and results, browser screenshots at mobile/short/desktop widths, source attribution and freshness sample, Auth session proof owned by the human tester, notification event/inbox proof, operator runbook, deployment identifier, rollback target, known limitations and the named acceptance owner.

## 7. Current next action

The Seed decision gate is now closed for bounded planning. The Root migration/production mutation gate is not closed.

The immediate next implementation slice is **Ring A — operator facility registry and representative claim**, beginning with a mini-Seed/mini-Species/mini-Root contract. Before any database migration or real-user onboarding mutation, confirm the four decisions in `v2-field-pilot-seed-amendment.md` and inspect the existing migration on a temporary branch. Seller, transaction, QR, external payment, remote tile reliability and full Canopy remain open gates.

## References

- [OSM Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- [OpenStreetMap API v0.6](https://wiki.openstreetmap.org/wiki/API_v0.6)
- [Planet.osm replication diffs](https://wiki.openstreetmap.org/wiki/Planet.osm/diffs)
- [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

# Omni V1 Current Handoff

## Session

- Project: `am-n-ra/lome-local-connect`
- Branch: `main`
- Baseline inherited: `823981b`
- Date: 2026-08-19
- Status: `partial`

## Goal and position

The field-ready V1 recovery plan is approved and its edited version is the source of truth at `/home/ubuntu/omni-ai-product-delivery-recovery-plan.md`. Gate 0 is complete as a read-only baseline audit. The four-axis matrix and three authoritative Omni V1 contracts have been created. Slice A has received bounded location/scene-contract corrections; Slice B has received a server-side Pro bulk enforcement correction.

The next exact action is to run the repository’s typecheck, focused unit tests, build/client-boundary checks and browser/viewport certification. Do not begin a broad seller redesign until Slice A evidence is recorded.

## Authoritative artifacts

- `docs/omni-v1-field-brief.md` — version 1.0, decided.
- `docs/omni-v1-flow-and-decision-contract.md` — version 1.0, decided.
- `docs/omni-v1-product-interface-architecture-contract.md` — version 1.0, decided.
- `docs/omni-v1-field-gap-matrix.md` — Gate 0 baseline, ready for contract freeze.
- `docs/omni-v1-slice-a-acceptance-matrix.md` — Slice A, in progress.
- `docs/omni-v1-slice-a-build-prompt.md` — bounded implementation prompt.

## Code changes in this session

- `src/components/omni/CartePage.tsx`
  - Require a fresh browser callback before a personal precise marker can appear.
  - Do not accept a cached `getCurrentPosition` coordinate as fresh proof (`maximumAge: 0`).
  - Keep restored session location available for approximate discovery context.
  - Expose the fresh-location accuracy to the dock only after a fresh callback.
- `src/components/omni/SearchDock.tsx`
  - Distinguish native permission prompt from generic locating state.
  - Expose browser permission and location-band data attributes for certification.
- `src/lib/omni-v1-contracts.ts`
  - Add pure location accuracy and personal-marker helpers.
  - Increase bounded target cap to 240 for the active Pro bulk contract.
  - Remove the legacy second offer-confirmation action from the primary action contract; keep QR recovery for legacy pending records.
  - Add `payment_confirmed` to the shared event vocabulary.
- `src/lib/omni-v1-contracts.unit.test.ts`
  - Add location accuracy and stale-session marker tests.
  - Update immediate-QR legacy-pending action expectation.
- `src/lib/omni-state.ts`
  - Add `auth_required`, `onboarding`, and `search_restored` scene states.
- `src/lib/omni-state.unit.test.ts`
  - Add assertions for the new Slice A scene states.
- `src/lib/demand.functions.ts`
  - Enforce Pro-only bulk availability server-side.
  - Allow a bounded 240-target visible result set.
  - Remove Free bulk credit decrement for the active contract.
  - Expose a read-only buyer entitlement endpoint for truthful plan-aware UI.
- `src/components/omni/DemandRequestPanel.tsx`
  - Disable and explain visible-result bulk for Free users.
  - Keep the single-facility path available and preserve the three-step flow.
- `docs/omni-v1-slice-a-browser-findings.md`
  - Record local MapLibre, search reveal, result-card, unclaimed-facility, close/back and availability-sheet observations.

## Proof status

The focused Slice A contract tests passed, the complete suite passed with 62 tests across 10 files, the production build passed, and the client-boundary check passed after the Pro entitlement UI/server correction. Targeted lint has no errors and retains two pre-existing Fast Refresh warnings in `SearchDock.tsx`; repository-wide lint did not complete within the bounded timeout. Local browser observations have been recorded in `docs/omni-v1-slice-a-browser-findings.md`; mobile, staging E2E and production observations have not been run in this handoff. No production-readiness claim is allowed. Slice A remains `partial` until those proofs are recorded.

## Risks and blockers

The removed `confirm_offer` action has no remaining source references, the new imports compile, the complete suite and build pass, and the demand function still writes the existing `credit_cost` column while enforcing Pro-only bulk. Before advancing, verify the browser permission/replay behavior, demand integration semantics and mobile layout. Keep production mutations and provider operations separate from certification.

## Resume protocol

Read this file, inspect the current Git diff, run the smallest focused tests, correct compile/test failures, update the Slice A acceptance matrix with evidence, then proceed to Slice B only when Slice A is `verified` or an explicit non-blocking limitation is recorded.

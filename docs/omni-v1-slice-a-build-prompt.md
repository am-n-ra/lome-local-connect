# Slice A Build Prompt — Map-first discovery and authenticated search replay

## Role and context

Act as a careful implementation agent in the Omni repository. Read `docs/omni-v1-field-brief.md`, `docs/omni-v1-flow-and-decision-contract.md`, `docs/omni-v1-product-interface-architecture-contract.md`, and `docs/omni-v1-slice-a-acceptance-matrix.md` before editing. Inspect Git status and preserve all existing user changes and secrets.

## Objective

Complete only Slice A: make the first buyer scene a truthful map-first MapLibre discovery surface that preserves search context through authentication and produces reversible, source-backed results.

## In scope

- Buyer location permission semantics: prompt, loading, precise, approximate, denied, unavailable, retry and market fallback.
- Fresh callback requirement for the personal position marker.
- Visible-bbox facility discovery and distinction between empty, loading and error states.
- Search Enter/button parity and preservation of query, category, quantity, budget and location context through auth/onboarding replay.
- Result card searched-product context, unclaimed trust messaging and reversible facility selection.
- MapLibre projection/canvas state, cancellable search reveal, rotation pause/resume and target-width dock clearance.
- Shared pure contracts and focused tests necessary to prove these behaviors.

## Out of scope

Do not implement AI search, image/video search, automatic availability, seller redesign, transaction logic, wallet/FedaPay, native mobile, advanced clustering, a decorative globe, a different basemap, a new framework, or unrelated visual polish.

## Frozen invariants

1. Use the existing MapLibre instance and source-backed geography.
2. Never present a market center or stale session coordinate as exact personal location.
3. Only a fresh browser callback at or below 500m accuracy may create the personal marker.
4. Buyer budget remains private and is not sent to seller-facing availability payloads.
5. Unclaimed facilities remain discoverable but cannot expose private contact, availability authority or purchase actions.
6. A visitor may type before auth, but persistent search/demand actions require auth and must replay the original context once.
7. A newer search cancels stale reveal/flight work.
8. Closing a facility surface restores the current map/search state.
9. Respect reduced motion and do not block the map behind a location prompt.

## Allowed files

Prefer changes to `src/components/omni/CartePage.tsx`, `src/components/omni/SearchDock.tsx`, `src/components/omni/MapCanvas.tsx`, `src/lib/omni-state.ts`, `src/lib/omni-v1-contracts.ts`, and their focused unit tests. Update the Slice A acceptance matrix with evidence only after checks run. Do not touch payment, wallet, seller, migration or production configuration files in this slice.

## Required checks

Run the project’s typecheck, focused unit tests for `omni-v1-contracts` and `omni-state`, build/client-boundary checks, browser tests for permission and auth replay, and viewport certification at 320/375/768/1280px. Verify MapLibre canvas/projection, result pins, facility selection close/back, no false exact marker, empty/error recovery and stale reveal cancellation.

## Stop conditions

Stop and mark `needs-decision` if the current implementation cannot preserve the real MapLibre instance, if auth replay changes the product state machine, if a database migration is required for Slice A, or if a new fact changes amount, permissions, trust states or transaction behavior. Do not expand into seller or wallet work to compensate for an unverified buyer slice.

## Report

Return changed files, tests and outputs, browser/device evidence, known limitations, and exactly one status: `verified`, `partial`, `blocked`, or `needs-decision`. Do not claim production readiness from static analysis or a successful build alone.

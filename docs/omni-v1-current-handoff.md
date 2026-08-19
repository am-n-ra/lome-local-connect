# Omni V1 Current Handoff

## Session

- Project: `am-n-ra/lome-local-connect`
- Branch: `main`
- Baseline inherited: `823981b`
- Date: 2026-08-19
- Status: `partial`

## Goal and position

The field-ready V1 recovery plan is approved and its edited version is the source of truth at `/home/ubuntu/omni-ai-product-delivery-recovery-plan.md`. Gate 0 is complete as a read-only baseline audit. The four-axis matrix and three authoritative Omni V1 contracts have been created. Slice A has received bounded location/scene-contract corrections; Slice B has received a server-side Pro bulk enforcement correction.

The next exact action is to run the repository’s browser/mobile certification and transaction integration checks. Do not begin a broad seller redesign until the buyer discovery and transaction slices have recorded their required evidence.

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
- `src/lib/checkout.functions.ts`
  - Move seller QR verification to `qr_verified`.
  - Move buyer payment preference selection from `qr_verified` to `payment_pending`.
  - Align buyer/seller QR notifications and expose seller contact after intent/QR generation.
- `docs/omni-v1-identity-audit.md`
  - Record the duplicate-profile/legacy-owner mismatch that blocks seller-role certification.
- `docs/omni-v1-identity-repair-blocked.md`
  - Record the former L3 staging-boundary blocker; superseded for this test-only run by `ID-REPAIR-007`.
- `docs/omni-v1-identity-repair-decision.md`
  - Treat current application rows as test/demo data, preserve all profiles and Neon Auth users, and relink only explicit application identity references.
- `scripts/audit-identity-scope.mjs`
  - Confirm 37 application profiles, 35 distinct email hashes, 2 onboarded profiles and no raw email/ID output.
- `scripts/snapshot-identity-surfaces.mjs`
  - Snapshot 29 identity-bearing public tables to `/home/ubuntu/omni-backups/omni-identity-surfaces-20260819.json` with checksum `f4ba28f5…dedcad`.
- `scripts/repair-demo-identity.mjs`
  - Relink five facilities, one demand request and seventeen notifications to the canonical Neon Auth profile in one guarded transaction; preserve profiles, plans, amounts and ledger facts.
- `docs/omni-v1-vercel-staging-access-audit.md`
  - Record the connected Vercel project, READY production deployment, no-runtime-error observation and absence of a proven staging target.
- `docs/omni-v1-identity-mapping-preview.md`
  - Record the redacted candidate mapping and dependency inventory; no mutation is approved from this preview.
- `docs/omni-v1-identity-repair-decision.md`
  - Freeze the current test-dataset boundary and no-Neon-Auth-delete policy.
- `scripts/audit-identity-scope.mjs`
  - Redacted profile/auth/application count audit.
- `scripts/audit-demo-identity-dependencies.mjs`
  - Redacted duplicate-profile dependency audit.
- `scripts/snapshot-identity-surfaces.mjs`
  - Private read-only rollback snapshot helper.
- `scripts/repair-demo-identity.mjs`
  - Guarded, idempotent application-profile relink runner.
- `docs/omni-v1-transaction-certification-plan.md`
  - Approved bounded L3 plan for buyer/seller transaction, QR, camera and mobile certification.
- `docs/omni-v1-transaction-fixture-manifest.md`
  - Redacted reusable certified seller/product/coupon fixture; separate buyer session still pending.

## Proof status

The identity-scope audit and duplicate dependency audit passed in read-only mode. A private rollback snapshot covers 29 identity-bearing public tables. The guarded repair completed with one audit event and preserved all three application profiles, the current Neon Auth user, both user-plan rows, wallet ledger totals and transaction amounts; five facilities, one demand request and seventeen notifications moved to the canonical profile. Post-repair dependency audit shows zero legacy-owned facilities, zero legacy wallet actors and four canonical buyer transactions. The existing invariant checker reports zero current completed-without-review, zero active-without-intent-key, zero duplicate intent keys, zero duplicate coupon redemptions, zero approved deposits without ledger and zero wallet snapshot drift; it reports three legacy completed transactions without reviews, classified as pre-enforcement fixtures. Production browser proof shows the buyer globe, seller map-first shell, catalogue, scanner surface, Omni Wallet and coupons. A reusable certified seller facility, active product and two active coupons were selected read-only; the planned intent key is unused. Real camera/QR decode, two independent authenticated browser sessions and full transaction E2E remain unverified. Status remains `partial`; no production-readiness claim is allowed.

## Risks and blockers

The removed `confirm_offer` action has no remaining source references, the new imports compile, and the earlier complete suite/build/client-boundary proof remains valid. The current test-data repair intentionally did not delete Neon Auth users or application profiles and did not merge the duplicate `user_plans` rows. The installed `pg_dump` client could not snapshot the Neon 17.10 server because it is version 16.14; the Node snapshot helper is the rollback artifact instead. Vercel reports a READY production deployment `dpl_C52hfmJMcTp366nUGXxg4Vqq8SWc` for commit `ed0f34c`, aliased to `omni.sparkafrika.online`, and no grouped runtime errors in the inspected 24-hour window. The residual blockers are legacy completed transactions without reviews, lack of a separate authenticated buyer session/credential in the current task context, and unperformed real camera/QR decode and end-to-end payment-state proof. Do not create a transaction fixture until the two-role session boundary is available. Do not claim the repair is production-ready until those proofs pass.

## Resume protocol

Read this file, verify the current commit and the private snapshot checksum, run the redacted post-repair audits and invariant checker, then run the full tests/build. For any further data change, reuse the same repair run ID or open a new decision. Next product proof is two-role transaction E2E with camera/QR; do not broaden the UI scope before that evidence is recorded.

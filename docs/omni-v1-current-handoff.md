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
  - Redacted reusable certified seller/product/coupon fixture; distinct buyer identity was used sequentially for the certified loop, while independent concurrent contexts remain pending.

## Proof status

The identity-scope audit and duplicate dependency audit passed in read-only mode. A private rollback snapshot covers 29 identity-bearing public tables. The guarded repair preserved all three application profiles, the current Neon Auth user, both user-plan rows, wallet ledger totals and transaction amounts; five facilities, one demand request and seventeen notifications moved to the canonical profile. The certified production fixture completed the buyer-to-seller loop for `Lait en poudre 400 g` at `3 200 FCFA`: discovery, manual availability, seller response, notification resume, purchase intent, atomic QR generation, seller QR verification with manual fallback `MFD6DQXE`, external cash-on-delivery selection, buyer payment declaration, seller payment confirmation, fulfillment, buyer receipt confirmation, five-star rating and terminal completion. The authoritative row is `completed`, the review rating is `5`, the audit sequence ends `rating_submitted → completed`, and exactly one transaction payout ledger entry exists.

The invariant checker now reports current checks as passing while preserving `legacyCompletedWithoutReview=3` as informational evidence under CERT-003. Production runtime-error query returned no grouped errors in the inspected two-hour window. The final production deployment is READY as `dpl_2ZjNSs1w9YV8Pb9Pp8hM8D421vPo` for the rating fix, with the subsequent audit-script commit `bdf6c47` also READY and aliased to `omni.sparkafrika.online`. Status remains `partial`, not production-ready: the manual QR fallback is proven, but real camera preview/decode on an HTTPS device, independent concurrent buyer/seller browser contexts, and the planned negative authorization/concurrency matrix are not yet recorded.

## Risks and blockers

The bounded certification fixes are committed to `main`: notification-driven demand resume, seller QR idempotency, buyer payment entry after QR verification, partial-index-safe rating upsert, and legacy-fixture-aware invariant reporting. The full local suite is `64/64`, production build and client-boundary checks pass. The current data repair intentionally did not delete Neon Auth users or application profiles, merge duplicate `user_plans` rows, rewrite legacy reviews, add in-app seller payments, or add seller withdrawals. The remaining release blockers are camera/device proof, a genuinely independent two-session browser/device observation, and explicit wrong-buyer/wrong-seller/expired/malformed/duplicate authorization tests. The three legacy completed-without-review rows remain preserved fixtures, not current invariant failures, and require a separate cleanup decision if ever addressed.

## Resume protocol

Read this file and the certification evidence log, verify the current `main` commit and private snapshot checksum, run `pnpm test && pnpm build`, run `OMNI_E2E_ENFORCE_AFTER=2026-08-19T00:00:00Z node scripts/e2e/assert-invariants.mjs`, query recent production runtime errors, and preserve the current transaction fixture as completed. The next bounded slice is camera-capable HTTPS and adversarial authorization certification; do not broaden the UI scope or mutate legacy fixtures before those proofs are recorded.

# Omni V1 — Current Handoff

## Session and release state

| Field | Current value |
| --- | --- |
| Repository | `am-n-ra/lome-local-connect` |
| Branch | `main` |
| Certified source commit | `2637ed5c` — merge of PR #49, `feat(ui): replace seller scanner surface` |
| UI/backend continuation commits | Prior location/transaction/seller/company/admin commits plus clean-base PR #47 (`58061e9`), PR #48 (`5003f7f`), and PR #49 (`2637ed5c`) — buyer/seller clean-base surfaces, seller access/onboarding, and scanner replacement |
| Latest observed production deployment | `dpl_Ap3JZ1dqj2UpWjF1Wv2xSUcfWxDB` — `READY` for documentation commit `112db39`, production target; clean-base code-bearing deployment remains `dpl_HY3BBXhDjEjfxQRFb2tSoyriEZWN` |
| Active Omni Neon project | `wild-moon-30984513` |
| Active Omni Neon branch | `br-bitter-math-amrlbym6` (`production`) |
| Isolated staging Neon project | `old-unit-98112236` |
| Isolated staging Neon branch | `br-bitter-forest-a6e6nem5` |
| Local validation | 11 test files, 69 tests, production build, client-boundary check, diff check, and public route smoke matrix passed |
| Release decision | `partial` |

## Goal and authoritative position

The Omni V1 goal remains a production-ready buyer/seller transaction loop: map-first discovery, availability, purchase intent, QR verification, external payment declaration, seller confirmation, fulfillment, receipt, rating, and completion. The A–G recovery sequence remains authoritative. This continuation stayed bounded: it completed the approved location-gating, seller operational, company identity, and admin trust surfaces without replacing MapLibre, adding seller withdrawals, or pulling deferred Agent/Ads automation into V1.

The A–E core is now materially certified in isolated staging. The fresh buyer/seller transaction completed through `completed`, the duplicate buyer payment declaration was replayed successfully without a duplicate event, the runtime authorization probes recorded explicit rejection paths, the concurrent duplicate-intent probe returned one transaction for both requests, the independent buyer recovery path was restored after sign-out and app restart, and the latest staging invariant run returned zero for all seven checks.

The release is still **`partial`**, not `verified` or production-ready. The dedicated concurrent QR-verification fan-out is now recorded and reconciled successfully in isolated staging, but a real HTTPS camera preview/decode is not available in the sandbox. The authenticated result/facility browser replay also remains incomplete because the local auth-provider/browser bridge failed during that UI proof attempt. These are proof limitations, not a reason to weaken the server-authoritative transaction contract.

## UI perfection continuation

This continuation followed the approved anti-loop method: one bounded source-of-truth reconciliation, then vertical slices with explicit acceptance gates. The shared OmniSheet foundation now owns the buyer cart, orders, wishlist, menu, facility, and chat overlays. Buyer discovery uses a shared facility sheet, optional refinements, product-first result cards, a viewport-safe horizontal rail, and a distinct grouped-availability CTA. The transaction room uses clearer French state labels, stable state hooks, responsive event rows, QR/payment/receipt/rating surfaces, and a sticky composer only for ordinary chat. The seller map-first workspace keeps Facility, Catalogue, Demandes, Scanner QR, and Compte as primary actions; Wallet and Coupons remain reachable from Compte. The seller console now exposes server-backed manual-open/closed state, time-bounded Discovery mode, server-authoritative Omni-visible allocation, company identity settings, company certification status, and a seller-only correction path for uncorrected automatic demand responses. The admin queue now shows company identity and distinguishes admin certification from earned QR trust confirmation. MapLibre GL v5 globe behavior and facility-pin logic were not changed.

The browser evidence confirmed a real MapLibre globe, no document-level horizontal overflow at 1280×1100, collapsed-by-default buyer refinements, a protected search-to-auth redirect, and 44px custom map/search controls after the accessibility patch. The local auth provider failed to complete the demo authenticated replay, so result-card and facility-sheet interaction remain a browser proof gap in this environment.

## Certified transaction and proof

The fresh staging transaction was created from the staged product and seller facility with a server-authoritative amount of 1,250 XOF and quantity 12. It completed through `qr_verified → payment_pending → paid → fulfillment → rating_pending → completed` using Cash à la livraison. The transaction timeline contains twelve expected events, including exactly one `payment_declared`, one `rating_submitted`, and one `completed` event. The final audit records one review and one payout ledger entry.

The duplicate-payment proof is the principal new certification result. The buyer clicked `J’ai payé` twice on the same payment-pending transaction. The first request recorded the declaration; the replay returned the idempotent success path and recorded no second `payment_declared` event. The source fix is atomic because the update predicate requires `buyer_payment_declared_at IS NULL`, while the existing already-declared return path preserves a successful retry response.

The runtime adversarial evidence is stored in `/home/ubuntu/omni-phase3-adversarial-evidence.md`. Anonymous timeline access returned `UNAUTHORIZED`. A wrong non-owner seller could not read the fresh transaction and received `Transaction introuvable.`. Malformed QR input failed schema validation, unknown QR input returned an explicit inaccessible-account error, duplicate rating after completion was rejected before side effects, and two simultaneous identical purchase-intent requests returned the same transaction ID. The follow-up staging assertion found one active matching transaction and zero duplicate active-key groups.

## Invariants and deployment observability

The latest authoritative seven-check staging invariant query returned zero for `completedWithoutReview`, `activeWithoutIntentKey`, `duplicateActiveIntentKeys`, `duplicateCouponRedemptions`, `approvedDepositsWithoutLedger`, `walletSnapshotDrift`, and `legacyCompletedWithoutReview`. A second post-fan-out run on 2026-08-20 also returned `ok=true` with zero for every check, using cutoff `2026-08-18T00:00:00Z`. The QR-specific reconciliation reported both proof transactions in `qr_verified`, exactly one `seller_verified` event for each, and no duplicate event groups.

The latest observed production deployment metadata shows source commit `831dca9` on `main` in a `READY` production deployment (`dpl_FgwofaxrDBuhjHWfVFoe7W4CJ1ey`) serving the production aliases, including `omni.sparkafrika.online`; this follow-up changed documentation only and includes the validated code from `fdd1c40`. The final local validation passed with 11 test files and 69 tests, the production build, client-boundary check, and `git diff --check`. A passive public-route smoke matrix returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/auth`, and `/admin`. These observations establish deployment and route availability evidence; they do not convert server-only location resolution, isolated staging proof, or incomplete browser/device replay into full production transaction certification.

## Relevant artifacts

| Artifact | Purpose |
| --- | --- |
| `docs/omni-v1-a-e-certification-crosswalk.md` | A–E slice status, evidence, and release decision |
| `docs/omni-v1-slice-a-browser-findings.md` | Cumulative browser and map-first findings, including transaction-room recovery observations |
| `docs/omni-v1-transaction-certification-plan.md` | Approved L3 certification plan and state transitions |
| `docs/omni-v1-staging-certification-report.md` | Redacted baseline staging report |
| `/home/ubuntu/omni-phase2-idempotency-proof-current.md` | Fresh duplicate-payment proof snapshot |
| `/home/ubuntu/omni-phase3-adversarial-evidence.md` | Runtime adversarial matrix and concurrent duplicate-intent proof |
| `/home/ubuntu/omni-phase4-evidence.md` | Independent-context recovery and camera fallback evidence |
| `/home/ubuntu/.mcp/tool-results/2026-08-19_20-53-44.790656796_neon_run_sql_ec65a68d.json` | Final seven invariants after completion |
| `/home/ubuntu/.mcp/tool-results/2026-08-19_21-16-22.529977790_neon_run_sql_82e00a2d.json` | Seven invariants after concurrent duplicate-intent probe |
| `/home/ubuntu/.mcp/tool-results/2026-08-19_21-13-40.255266536_neon_run_sql_bf976b44.json` | One-active-row concurrent intent assertion |
| `/home/ubuntu/.mcp/tool-results/2026-08-19_21-00-01.939191393_neon_run_sql_b6048cd3.json` | Final completed transaction assertion |
| `/home/ubuntu/terminal_full_output/2026-08-19_21-00-52_757965_5191.txt` | Full local test/build output |
| `/home/ubuntu/omni-qr-proof-evidence-2026-08-20.md` | Redacted single/concurrent QR proof, invariant, and cleanup record |
| `/home/ubuntu/omni-v1-final-validation-2026-08-20.md` | Final tests, public-route smoke matrix, production deployment, and read-only data reconciliation |
| `/home/ubuntu/.mcp/tool-results/2026-08-20_11-57-09.124585206_vercel_get_deployment_5396296d.json` | READY production deployment metadata for code commit `fdd1c40` |
| `/home/ubuntu/.mcp/tool-results/2026-08-20_12-00-15.579380496_vercel_get_deployment_d1d84713.json` | READY production deployment metadata for documentation commit `831dca9` |
| `/home/ubuntu/omni-v1-live-browser-check-2026-08-20.md` | Read-only production browser shell observation and current My Browser 504 blocker |

## QR fan-out certification checkpoint

The single QR replay used isolated transaction `6709e01c-3fee-41ff-a773-9b75a7186d5a`. The concurrent replay used fresh isolated transaction `4529349d-834a-41a2-be59-b39da23d9203`. Both requests in the concurrent fan-out returned the same successful server-function result envelope and transaction identity. The database state for the concurrent transaction was `qr_verified` with one total transaction event and exactly one `seller_verified` event, demonstrating the atomic state transition and idempotent already-verified retry path.

The protected fixture was corrected from a 32-character token to an eight-character code because the current manual redeem contract accepts 4–24 characters while the application generator produces eight-character codes. This adjustment was isolated to staging fixture data and did not alter production code or production data.

The temporary staging trusted origin was removed after proof, and the local staging app and JWKS server were stopped. No protected session, password, connection string, or raw QR token was committed.

## Worktree and change boundary

The UI refinement work is committed in `fa1ace4`, `b151a72`, `fb4e9ba`, and `c41cc4c`; the location/transaction continuation is in `ac83869`, `a845c9c`, and `a63cf58`; the seller/company/admin continuation is in `f18e529`, `2131cd9`, `aaf1c0a`, `e0b979f`, and `fdd1c40`. Generated `.vercel/` output and several untracked audit scripts remain outside the commit boundary and were not staged.
 No passwords, database URLs, QR tokens, Neon Auth users, profiles, legacy transactions, or production records were deleted or rewritten.

## Smallest next action

To reach `verified`, execute and record the live camera preview/decode proof on a real HTTPS mobile device or camera-capable browser using an authorized seller session, then perform a production-consent replay for buyer city resolution and a full authenticated buyer/seller responsive journey matrix. The concurrent QR fan-out and post-fan-out seven-invariant evidence are complete. Until those runtime artifacts exist, preserve the release status as `partial` and do not claim full production readiness. The authenticated facility-card replay remains an explicit UI evidence follow-up, separate from the remaining L3 camera gate.

## 2026-08-20 implementation and validation checkpoint

The approved server-resolved buyer-location contract is now present in Migration 036 and applied to the active Omni production branch. The resolver persists a privacy-minimal normalized discovery city with rounded-grid caching and rate-limited reverse-geocoder access; discovery and availability targets share one server-only free/Pro scope helper. The neutral resting category remains global for the map shell, while scoped free discovery uses the resolved city or documented legacy-market fallback when no buyer city has yet been persisted.

The seller workspace now exposes manual open/closed availability, time-bounded Discovery mode, server-authoritative Omni-visible quantity, company identity settings, company/certification status, and correction controls for eligible automatic demand responses. The admin queue now displays company identity and trust badges that distinguish admin certification from earned QR confirmation. The buyer transaction room exposes seller contact after intent/QR creation while payment declaration and fulfilment actions remain server-state gated. No MapLibre GL v5 globe projection, facility-pin logic, external-payment model, one-wallet model, or seller-withdrawal prohibition was changed.

Final validation passed on the `fdd1c40` code state and remains included in the latest `831dca9` deployment: 11 test files and 69 tests, production build, client-boundary check, and diff check. Public smoke checks returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/auth`, and `/admin`. The latest `READY` production deployment is `dpl_FgwofaxrDBuhjHWfVFoe7W4CJ1ey`; the code-bearing deployment for the slice is `dpl_4vZvh3547vYcSdt453CtyGMvnWoh`. Read-only reconciliation on the active Omni production branch found 2 companies, 7 company-linked facilities, 975 facilities with normalized city, zero products allocated above real stock, zero negative allocations, and zero persisted buyer discovery cities.

The zero persisted buyer discovery-city count means the new consent/resolution path has not yet been exercised by a production buyer; it is not evidence that the schema or server gate is broken. A production-consent replay is required before claiming runtime-proven city-accurate free-plan enforcement. The seller auto-response correction slice is now implemented and deployed, but its authenticated seller UI replay and buyer-notification observation are still evidence work rather than a release gate closure. The release remains `partial` because live HTTPS camera preview/decode and the authenticated responsive buyer/seller browser matrix remain unproven.

## 2026-08-20 complete-UI continuation checkpoint

The approved UI continuation produced five bounded code checkpoints on `main`: `d087b5f` refined the buyer search dock, result rail, and seller map-first shell; `52c3965` clarified the buyer transaction-room stage names and descriptions; `38bf00e` made seller camera permission, active-preview, fallback, and framing states explicit in the reserved scanner viewport; `432074b` clarified the seller product and coupon form hierarchy and Omni allocation wording; and `80af399` corrected buyer-facing availability copy so automatic and manual responses remain indistinguishable. MapLibre GL v5, globe projection, facility pins, external buyer-seller payment, the single Omni Wallet model, and the no-withdrawal rule were not changed.

The cumulative UI state passed strict TypeScript, all 11 test files / 69 tests, production build, client-boundary check, and `git diff --check`. The current production deployment is `dpl_8MB5eFpg264sDZRLJPtxYRbWmGho`, source commit `80af399`, `READY`, and serving the public aliases including `https://omni.sparkafrika.online`. A read-only smoke matrix returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/onboarding`, `/auth`, and `/admin`.

This checkpoint records **implementation progress**, not complete UI certification. The buyer and seller authenticated responsive matrix, facility-card interaction replay, live HTTPS camera preview/decode, production buyer city-consent replay, and complete authenticated transaction/scanner evidence remain open. The release therefore remains `partial`; no production-ready or fully verified claim is authorized from this checkpoint alone.

The working tree still contains the pre-existing untracked `.vercel/` directory and audit/demo scripts outside the commit boundary. They were not staged, and no secrets, passwords, database URLs, QR tokens, Auth users, profiles, legacy transactions, or production records were deleted or rewritten.

The smallest next proof action remains an authenticated responsive browser run at 320/375/390/768/1280 px for buyer and seller, followed by a real camera-capable HTTPS seller session. The implementation slice is now deployed, but the runtime evidence gates must still be recorded independently.


## Final UI checkpoint deployment

The follow-up documentation and menu touch-target checkpoint is deployed as `dpl_57VH2tiYgwW3FKyivx2ESk6sZmGp`, source commit `f2ef878`, with state `READY` and the production alias `https://omni.sparkafrika.online`. The preceding code-bearing UI deployment remains `dpl_8MB5eFpg264sDZRLJPtxYRbWmGho` for source commit `80af399`; the latest deployment adds documentation and the shared menu accessibility correction on top of that code.

A final passive public-route smoke matrix against the production alias returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/onboarding`, `/auth`, and `/admin`. This is route/deployment evidence only. The complete authenticated responsive buyer/seller matrix, facility interaction replay, production city-consent replay, and live HTTPS camera proof remain open, so the release remains `partial`.


## 2026-08-21 clean-base production checkpoint

PR #47 (`58061e9`), PR #48 (`5003f7f`), and PR #49 (`2637ed5c`) are merged into `main`. The clean-base buyer and seller surfaces are now the primary production path: buyer map/search, availability, transaction room, seller access gate, certification-first onboarding, map-first seller workspace, Scanner QR, catalogue, and Omni Wallet. The scanner surface is replaced by `CleanScannerPanel`; the supplied Omni logo is used by the shell and PWA metadata. The remaining legacy seller components are retained only in the rollback branch of `vendeur.tsx` and are not the primary clean-base path.

The clean-base code-bearing deployment `dpl_HY3BBXhDjEjfxQRFb2tSoyriEZWN` is `READY`, targets production, is sourced from verified GitHub commit `2637ed5c`, and serves `https://omni.sparkafrika.online` among its aliases. After this handoff update was pushed, Vercel created documentation deployment `dpl_Ap3JZ1dqj2UpWjF1Wv2xSUcfWxDB` with state `READY`, production target, and source commit `112db39`. Public read-only checks on the production alias returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/onboarding`, `/auth`, and `/admin`; the canonical logo returned HTTP 200 as a PNG; the PWA manifest returned HTTP 200; and the production root exposed strict-transport-security.

The public seller gate was observed in the browser and showed the clean seller entry, certification-before-listing, and locked `$20` bonus. The follow-up post-load browser snapshot returned HTTP 504 in both available browser contexts. No seller credentials were entered, no camera permission was granted, no QR was decoded, no `redeemCheckout` mutation was performed, and no production or staging data was changed. These observations confirm public deployment and clean entry evidence only.

The release decision remains **`partial`**. G-001 live HTTPS camera preview/decode and authenticated seller scanner replay remain open. G-003 still requires one consented production buyer replay proving persisted `discovery_city` and Free/Pro scope. G-004/G-005 still require the authenticated buyer/seller responsive matrix at 320/375/390/768/1280 px, including facility selection and exact back/close restoration. The existing isolated staging QR single-replay, concurrent fan-out, transaction, and seven-invariant evidence remains valid.

The new public evidence is recorded in `/home/ubuntu/omni-clean-scanner-delivery-2026-08-21.md` and `/home/ubuntu/omni-clean-scanner-browser-check-2026-08-21.md`. These files remain outside the repository commit boundary.

## 2026-08-21 map/menu package and seller correction deployment

The approved Map + Menu vertical slice is committed and pushed to `main` as `f258594` (`feat(ui): wire canonical map/menu action registry and role switch`). The slice introduces `src/lib/map-context.ts`, `src/lib/omni-menu.ts`, and `src/lib/map-menu.unit.test.ts`; extends `NavMenuSheet`, `TopNav`, `CartePage`, and `vendeur.tsx`; and patches `docs/OMNI_MASTER_PRODUCT_INTERFACE.md` §0.8.1. The implementation keeps MapLibre GL v5 globe projection, OpenFreeMap tiles, pins, clusters and map controls unchanged. It provides typed route-owned menu actions, buyer/seller role switching, auth-gated redirects, a bounded privacy-safe session context, and buyer search/facility restoration after auth return.

The first deployment for `f258594` was `ERROR` because the seller route imported `CleanDemandPanel` and `CleanCouponPanel` that were present only as untracked local files. This was corrected without mixing unrelated audit harnesses into the release: commit `00940ad` (`feat(ui): complete seller demand/coupon panels and transaction itinerary`) added the two panels and the selected seller/transaction changes. Vercel deployment `dpl_AzPZRQFjiWSna3aMehYezKuFzsc9` is `READY`, production-targeted, for source commit `00940ad`.

Validation on the combined main state: `pnpm build` passed; the client-boundary check passed with 46 JavaScript artifacts and 191 source files; all 13 test files and 75 tests passed; and `git diff --check` passed. Passive production checks returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/onboarding`, and `/auth`.

Release status remains **`partial`**. Still required are: authenticated buyer/seller responsive proof at 320/375/390/768/1280 px; live HTTPS camera preview, QR decode and replay-safe seller verification; one production buyer location-consent replay proving `discovery_city` and Free/Pro scope; and full authenticated transaction-loop evidence. The untracked `.vercel/` directory and audit/demo scripts remain intentionally outside the commit boundary. No staging credentials, production database URLs, raw QR tokens, proof harnesses, or user data were committed.

## 2026-08-21 map/globe one-shot checkpoint

The map/globe one-shot process is complete through implementation and public deployment. The canonical master now includes §0.8.2, which resolves the map/globe identity, scope gate, camera priority (`manual interaction > selected facility focus > active search reveal > result framing > idle rotation`), reveal cancellation, boundary capability fallback, viewport/antimeridian rules, exact/approximate/fallback location truth and bounded OSM backfill. The scope correction explicitly states that current Africa/Togo/Maritime/Lomé boundary assets do not imply full global boundary coverage.

Commit `b2ef062` (`feat(map): formalize globe camera and reveal contract`) adds `src/lib/map-globe-state.ts`, `src/lib/map-globe-state.unit.test.ts`, and the `MapCanvas` integration that cancels active reveal on manual interaction and restores facility visibility. MapLibre GL v5, OpenFreeMap, globe/mercator projection, pins, clusters, server discovery, location persistence and transaction rules remain unchanged.

The derived one-shot artifacts are outside the repository and attached to the session: audit, brainstorm, flow specification, data schema/rules, build prompt, task backlog and validation evidence. Local validation passed: 14 test files / 78 tests, strict TypeScript, production build, client-boundary check with 46 JavaScript artifacts and 193 source files, and `git diff --check`. Vercel deployment `dpl_8gsLi96bXhDzp4viZtkB9VXPXbcA` is `READY`, production-targeted, sourced from `b2ef062`; the production alias returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/onboarding` and `/auth`.

Release status remains **`partial`**. The remaining gates are live real-device MapLibre paint and pin visibility, production buyer location-consent/persisted city replay, authenticated responsive buyer/seller proof, and camera/QR proof. No proof harnesses, credentials, raw GPS histories, QR tokens or generated `.vercel/` output were committed.

## 2026-08-21 full UI and pre-verification authority checkpoint
The full-UI/pre-verification one-shot package was converged from the active buyer dock, map stage, availability sheet, seller onboarding, claim mutations, admin status mutations, database schema, and the canonical master. The scope is intentionally bounded to buyer discovery/UI and the lifecycle before verification: public unclaimed facilities remain visible; catalog-backed availability uses a server-validated product reference; a claim action creates or resumes a verification request; evidence can be drafted and submitted; only an audited staff review can produce `approved_certified` or `approved_unconfirmed`. Post-verification seller operations remain deferred.

The buyer dock now has one `Options` chevron controlling categories, filters, quantity and budget. Buyer result cards lead with the catalog-matched product when available, and unclaimed facility actions are labeled `Demander une vérification` rather than `Revendiquer`, with explicit copy that the request does not change ownership or status. The buyer verification sheet uses four evidence stages—identity, relationship, facility and offer—with draft/resume/submit behavior and auth context preservation. Staff now has a dedicated verification review queue with evidence inspection and explicit certified, unconfirmed, changes-requested and rejected outcomes requiring a reason. Generic admin status mutation no longer promotes facilities.

Migration `037_preverification_ui_contract.sql` was validated on temporary branch `br-tiny-bird-aml38q03` under migration ID `8f53f726-5e8c-4215-ba59-359600efc0ec`, then applied to the active Omni branch `br-bitter-math-amrlbym6`; the temporary branch was deleted after successful completion. Active-branch verification confirms `facility_claim_requests`, `facility_claim_evidence`, `demand_requests.product_id`, and the required indexes are present. No existing users, facilities, products, payment records, QR tokens or authentication records were deleted or rewritten.

Local validation after implementation: strict TypeScript passed; 14 test files / 78 tests passed; production build passed; client-boundary check passed with 47 JavaScript artifacts and 196 source files; and `git diff --check` passed. This checkpoint is not yet a deployment or complete certification claim. Authenticated responsive UI, live camera/QR, exact location-consent replay, and complete transaction-loop evidence remain open. Release status remains `partial`.

## 2026-08-21 full UI and pre-verification deployment checkpoint
Commit `7bc7344` (`feat(ui): establish full UI and pre-verification authority flow`) is now on `origin/main`. Vercel deployment `dpl_4iuJ1oGfJKJeDD2tAgaje7JmoxVY` reached `READY` for production at `https://omniview-6h67iweyd-kheirs-projects.vercel.app`; the project alias `https://omni.sparkafrika.online` returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/onboarding`, `/auth`, and `/admin`. The deployment includes the applied migration contract and the bounded buyer/pre-verification UI slice.

This is public-route and build evidence only. The release remains `partial` until authenticated responsive buyer/seller proof, live HTTPS camera preview and QR replay, exact location-consent replay, and complete post-intent transaction-loop proof are recorded. No production-ready claim is made from this checkpoint alone.

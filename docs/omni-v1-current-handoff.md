# Omni V1 — Current Handoff

## Session and release state

| Field | Current value |
| --- | --- |
| Repository | `am-n-ra/lome-local-connect` |
| Branch | `main` |
| Certified source commit | `02910b1` — `fix(checkout): prevent duplicate payment-declaration events with atomic WHERE guard` |
| UI/backend continuation commits | `ac83869`, `a845c9c`, `a63cf58`, `f18e529`, `2131cd9`, `aaf1c0a`, `e0b979f` — server-resolved location/free-city gating, buyer scope refresh, transaction contact unlock, seller Discovery/allocation controls, company settings, and admin trust badges |
| Latest observed production deployment | `dpl_HRFSDSXvszhdpmNrHRrJYrTaCMbC` — `READY` for source commit `e0b979f` |
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

This continuation followed the approved anti-loop method: one bounded source-of-truth reconciliation, then vertical slices with explicit acceptance gates. The shared OmniSheet foundation now owns the buyer cart, orders, wishlist, menu, facility, and chat overlays. Buyer discovery uses a shared facility sheet, optional refinements, product-first result cards, a viewport-safe horizontal rail, and a distinct grouped-availability CTA. The transaction room uses clearer French state labels, stable state hooks, responsive event rows, QR/payment/receipt/rating surfaces, and a sticky composer only for ordinary chat. The seller map-first workspace keeps Facility, Catalogue, Demandes, Scanner QR, and Compte as primary actions; Wallet and Coupons remain reachable from Compte. The seller console now exposes server-backed manual-open/closed state, time-bounded Discovery mode, server-authoritative Omni-visible allocation, company identity settings, and company certification status. The admin queue now shows company identity and distinguishes admin certification from earned QR trust confirmation. MapLibre GL v5 globe behavior and facility-pin logic were not changed.

The browser evidence confirmed a real MapLibre globe, no document-level horizontal overflow at 1280×1100, collapsed-by-default buyer refinements, a protected search-to-auth redirect, and 44px custom map/search controls after the accessibility patch. The local auth provider failed to complete the demo authenticated replay, so result-card and facility-sheet interaction remain a browser proof gap in this environment.

## Certified transaction and proof

The fresh staging transaction was created from the staged product and seller facility with a server-authoritative amount of 1,250 XOF and quantity 12. It completed through `qr_verified → payment_pending → paid → fulfillment → rating_pending → completed` using Cash à la livraison. The transaction timeline contains twelve expected events, including exactly one `payment_declared`, one `rating_submitted`, and one `completed` event. The final audit records one review and one payout ledger entry.

The duplicate-payment proof is the principal new certification result. The buyer clicked `J’ai payé` twice on the same payment-pending transaction. The first request recorded the declaration; the replay returned the idempotent success path and recorded no second `payment_declared` event. The source fix is atomic because the update predicate requires `buyer_payment_declared_at IS NULL`, while the existing already-declared return path preserves a successful retry response.

The runtime adversarial evidence is stored in `/home/ubuntu/omni-phase3-adversarial-evidence.md`. Anonymous timeline access returned `UNAUTHORIZED`. A wrong non-owner seller could not read the fresh transaction and received `Transaction introuvable.`. Malformed QR input failed schema validation, unknown QR input returned an explicit inaccessible-account error, duplicate rating after completion was rejected before side effects, and two simultaneous identical purchase-intent requests returned the same transaction ID. The follow-up staging assertion found one active matching transaction and zero duplicate active-key groups.

## Invariants and deployment observability

The latest authoritative seven-check staging invariant query returned zero for `completedWithoutReview`, `activeWithoutIntentKey`, `duplicateActiveIntentKeys`, `duplicateCouponRedemptions`, `approvedDepositsWithoutLedger`, `walletSnapshotDrift`, and `legacyCompletedWithoutReview`. A second post-fan-out run on 2026-08-20 also returned `ok=true` with zero for every check, using cutoff `2026-08-18T00:00:00Z`. The QR-specific reconciliation reported both proof transactions in `qr_verified`, exactly one `seller_verified` event for each, and no duplicate event groups.

The latest observed production deployment metadata shows source commit `e0b979f` on `main` in a `READY` production deployment (`dpl_HRFSDSXvszhdpmNrHRrJYrTaCMbC`) serving the production aliases, including `omni.sparkafrika.online`. The final local validation passed with 11 test files and 69 tests, the production build, client-boundary check, and `git diff --check`. A passive public-route smoke matrix returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/auth`, and `/admin`. These observations establish deployment and route availability evidence; they do not convert server-only location resolution, isolated staging proof, or incomplete browser/device replay into full production transaction certification.

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

## QR fan-out certification checkpoint

The single QR replay used isolated transaction `6709e01c-3fee-41ff-a773-9b75a7186d5a`. The concurrent replay used fresh isolated transaction `4529349d-834a-41a2-be59-b39da23d9203`. Both requests in the concurrent fan-out returned the same successful server-function result envelope and transaction identity. The database state for the concurrent transaction was `qr_verified` with one total transaction event and exactly one `seller_verified` event, demonstrating the atomic state transition and idempotent already-verified retry path.

The protected fixture was corrected from a 32-character token to an eight-character code because the current manual redeem contract accepts 4–24 characters while the application generator produces eight-character codes. This adjustment was isolated to staging fixture data and did not alter production code or production data.

The temporary staging trusted origin was removed after proof, and the local staging app and JWKS server were stopped. No protected session, password, connection string, or raw QR token was committed.

## Worktree and change boundary

The UI refinement work is committed in `fa1ace4`, `b151a72`, `fb4e9ba`, and `c41cc4c`; the location/transaction continuation is in `ac83869`, `a845c9c`, and `a63cf58`; the seller/company/admin continuation is in `f18e529`, `2131cd9`, `aaf1c0a`, and `e0b979f`. Generated `.vercel/` output and several untracked audit scripts remain outside the commit boundary and were not staged. No passwords, database URLs, QR tokens, Neon Auth users, profiles, legacy transactions, or production records were deleted or rewritten.

## Smallest next action

To reach `verified`, execute and record the live camera preview/decode proof on a real HTTPS mobile device or camera-capable browser using an authorized seller session, then perform a production-consent replay for buyer city resolution and a full authenticated buyer/seller responsive journey matrix. The concurrent QR fan-out and post-fan-out seven-invariant evidence are complete. Until those runtime artifacts exist, preserve the release status as `partial` and do not claim full production readiness. The authenticated facility-card replay remains an explicit UI evidence follow-up, separate from the remaining L3 camera gate.

## 2026-08-20 implementation and validation checkpoint

The approved server-resolved buyer-location contract is now present in Migration 036 and applied to the active Omni production branch. The resolver persists a privacy-minimal normalized discovery city with rounded-grid caching and rate-limited reverse-geocoder access; discovery and availability targets share one server-only free/Pro scope helper. The neutral resting category remains global for the map shell, while scoped free discovery uses the resolved city or documented legacy-market fallback when no buyer city has yet been persisted.

The seller workspace now exposes manual open/closed availability, time-bounded Discovery mode, server-authoritative Omni-visible quantity, company identity settings, and company/certification status. The admin queue now displays company identity and trust badges that distinguish admin certification from earned QR confirmation. The buyer transaction room exposes seller contact after intent/QR creation while payment declaration and fulfilment actions remain server-state gated. No MapLibre GL v5 globe projection, facility-pin logic, external-payment model, one-wallet model, or seller-withdrawal prohibition was changed.

Final validation passed on the `e0b979f` source state: 11 test files and 69 tests, production build, client-boundary check, and diff check. Public smoke checks returned HTTP 200 for `/`, `/carte`, `/vendeur`, `/auth`, and `/admin`. The `READY` production deployment is `dpl_HRFSDSXvszhdpmNrHRrJYrTaCMbC`. Read-only reconciliation on the active Omni production branch found 2 companies, 7 company-linked facilities, 975 facilities with normalized city, zero products allocated above real stock, zero negative allocations, and zero persisted buyer discovery cities.

The zero persisted buyer discovery-city count means the new consent/resolution path has not yet been exercised by a production buyer; it is not evidence that the schema or server gate is broken. A production-consent replay is required before claiming runtime-proven city-accurate free-plan enforcement. The release remains `partial` because live HTTPS camera preview/decode and the authenticated responsive buyer/seller browser matrix remain unproven.

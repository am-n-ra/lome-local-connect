# Omni V1 — Current Handoff

## Session and release state

| Field | Current value |
| --- | --- |
| Repository | `am-n-ra/lome-local-connect` |
| Branch | `main` |
| Certified source commit | `02910b1` — `fix(checkout): prevent duplicate payment-declaration events with atomic WHERE guard` |
| UI refinement commits | `fa1ace4`, `b151a72`, `fb4e9ba`, `c41cc4c` — bounded shared sheets, buyer discovery, transaction room, seller dock, and touch targets |
| Production deployment | `dpl_BetrRfbm1aLAsE9LqLvcTBNZdmUJ` — `READY` |
| Staging Neon project | `old-unit-98112236` |
| Staging Neon branch | `br-bitter-forest-a6e6nem5` |
| Local validation | 10 test files, 64 tests, production build, client-boundary check, live overflow audit, and touch-target audit passed |
| Release decision | `partial` |

## Goal and authoritative position

The Omni V1 goal remains a production-ready buyer/seller transaction loop: map-first discovery, availability, purchase intent, QR verification, external payment declaration, seller confirmation, fulfillment, receipt, rating, and completion. The A–G recovery sequence remains authoritative, and this continuation did not expand into a broad redesign or into Slice F or Slice G.

The A–E core is now materially certified in isolated staging. The fresh buyer/seller transaction completed through `completed`, the duplicate buyer payment declaration was replayed successfully without a duplicate event, the runtime authorization probes recorded explicit rejection paths, the concurrent duplicate-intent probe returned one transaction for both requests, the independent buyer recovery path was restored after sign-out and app restart, and the latest staging invariant run returned zero for all seven checks.

The release is still **`partial`**, not `verified` or production-ready. A real HTTPS mobile camera preview/decode is not available in the sandbox, a dedicated concurrent QR-verification fan-out has not been recorded, and the authenticated result/facility browser replay was blocked by the local auth-provider page-load failure. These are proof limitations, not a reason to weaken the server-authoritative transaction contract.

## UI perfection continuation

This continuation followed the approved anti-loop method: one bounded source-of-truth reconciliation, then vertical slices with explicit acceptance gates. The shared OmniSheet foundation now owns the buyer cart, orders, wishlist, menu, facility, and chat overlays. Buyer discovery uses a shared facility sheet, optional refinements, product-first result cards, a viewport-safe horizontal rail, and a distinct grouped-availability CTA. The transaction room uses clearer French state labels, stable state hooks, responsive event rows, QR/payment/receipt/rating surfaces, and a sticky composer only for ordinary chat. The seller map-first workspace keeps Facility, Catalogue, Demandes, Scanner QR, and Compte as primary actions; Wallet and Coupons remain reachable from Compte. MapLibre GL v5 globe behavior and facility-pin logic were not changed.

The browser evidence confirmed a real MapLibre globe, no document-level horizontal overflow at 1280×1100, collapsed-by-default buyer refinements, a protected search-to-auth redirect, and 44px custom map/search controls after the accessibility patch. The local auth provider failed to complete the demo authenticated replay, so result-card and facility-sheet interaction remain a browser proof gap in this environment.

## Certified transaction and proof

The fresh staging transaction was created from the staged product and seller facility with a server-authoritative amount of 1,250 XOF and quantity 12. It completed through `qr_verified → payment_pending → paid → fulfillment → rating_pending → completed` using Cash à la livraison. The transaction timeline contains twelve expected events, including exactly one `payment_declared`, one `rating_submitted`, and one `completed` event. The final audit records one review and one payout ledger entry.

The duplicate-payment proof is the principal new certification result. The buyer clicked `J’ai payé` twice on the same payment-pending transaction. The first request recorded the declaration; the replay returned the idempotent success path and recorded no second `payment_declared` event. The source fix is atomic because the update predicate requires `buyer_payment_declared_at IS NULL`, while the existing already-declared return path preserves a successful retry response.

The runtime adversarial evidence is stored in `/home/ubuntu/omni-phase3-adversarial-evidence.md`. Anonymous timeline access returned `UNAUTHORIZED`. A wrong non-owner seller could not read the fresh transaction and received `Transaction introuvable.`. Malformed QR input failed schema validation, unknown QR input returned an explicit inaccessible-account error, duplicate rating after completion was rejected before side effects, and two simultaneous identical purchase-intent requests returned the same transaction ID. The follow-up staging assertion found one active matching transaction and zero duplicate active-key groups.

## Invariants and deployment observability

The latest seven-check staging invariant query returned zero for `completedWithoutReview`, `activeWithoutIntentKey`, `duplicateActiveIntentKeys`, `duplicateCouponRedemptions`, `approvedDepositsWithoutLedger`, `walletSnapshotDrift`, and `legacyCompletedWithoutReview`. This result was obtained after the concurrent duplicate-intent probe, not only before it.

The production deployment metadata shows commit `02910b1` on `main` in a `READY` production deployment. The Vercel build log completed successfully. The selected 24-hour Vercel runtime-error query reported no runtime error clusters for the project. These observations establish deployment and current-window observability evidence; they do not convert the isolated staging proof into a full production transaction test.

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

## Worktree and change boundary

The UI refinement work is committed in `fa1ace4`, `b151a72`, `fb4e9ba`, and `c41cc4c`; the current handoff update will be committed separately. Generated `.vercel/` output and several untracked audit scripts remain outside the commit boundary and were not staged. No passwords, database URLs, QR tokens, Neon Auth users, profiles, legacy transactions, or production records were deleted or rewritten.

## Smallest next action

To reach `verified`, run one dedicated concurrent QR-verification replay against a fresh `qr_generated` staging transaction using two authenticated seller requests, then execute the live camera preview/decode proof on a real HTTPS mobile device or camera-capable browser. Until both artifacts exist, preserve the release status as `partial` and do not claim full production readiness.

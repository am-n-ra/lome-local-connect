# Omni continuity V1 — Phase 11 rollout notes

## Published sequence

The continuity implementation is published on `main` and synchronized with `origin/main`. The production code sequence is:

| Commit | Scope |
|---|---|
| `4c510d3` | Shared transaction thread, QR deep link, payment-choice/declaration flow and seller fulfillment handlers |
| `043621a` | Seller transaction workspace, notification deep-link tab selection and V1 overview cleanup |
| `6d827f6` | Single Omni Wallet internal allocations from wallet to Pro/Publicité/Coupons |
| `1ce8e1d` | Auth replay, onboarding, notification and admin-boundary certification notes |
| `2c632b1` | Transaction database invariants and synchronized schema snapshot |
| `42b1d37` | Production browser, PWA and route certification notes |

## Database rollout

Migrations 028 and 029 were applied to the verified `neondb` target. Migration 028 added payment preference, buyer declaration, seller confirmation and fulfillment timestamps. Migration 029 added state-aware checks, the unique QR-token index and the status-transition trigger. Post-migration checks passed and wallet/payout parity remains true.

## Production verification

The production checks observed HTTP 200 for `/`, `/carte`, `/vendeur`, `/auth`, `/transaction/qr`, `/manifest.webmanifest` and `/sw.js`. Buyer search, globe reveal, facility result, centered availability panel and seller map-first workspace were observed after the latest code deployment. The seller scanner fail-soft state preserved its preview frame and manual fallback when the sandbox had no camera stream.

## Reversible rollout

The application rollback point is the previous Git commit before the continuity sequence, while database changes are additive and should not be reverted destructively. If an application rollback is needed, retain migrations 028 and 029 because older code can ignore the additive columns; any database rollback must be a separately reviewed migration. The untracked `.vercel/` build output and local audit scripts remain outside the release commit.

## Open certification boundary

A physical mobile HTTPS test is still required for an actual camera video stream after permission. A live buyer-to-seller external payment cannot be automatically marked as paid by Omni; the V1 contract intentionally requires the buyer declaration and seller confirmation, while FedaPay is restricted to Omni Wallet recharge.

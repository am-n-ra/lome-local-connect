# Omni V2 — Canopy V3 gate report

**Date:** 2026-08-24  
**Milestone:** Species / Canopy map-first experience  
**Decision:** `partial / materially proven; Species gate remains open`  
**Global Root:** `review`  
**Author:** Manus AI

## Status

The Canopy V3 re-entry is complete as a bounded implementation and proof slice. The owner-reported symptoms were routed through the existing Founder HQ and Nature Way Species authority, not through a competing plan. The map/search experience is materially stronger and is deployed on the canonical Omni domain, but the parent Species gate is not accepted and no operational or release Ring is closed.

## Changed

The MapLibre controller now leaves native drag, pan, pivot and zoom ownership with the map instead of interrupting gestures on canvas hover. Manual interaction pauses idle motion, preserves the released center/zoom/bearing, and never resets the user to the initial globe. When the map/context is left and no surface owns the camera, a delayed idle rotation resumes from the current camera. Local zoom transitions from globe to mercator so roads and neighborhood context can become legible as the user zooms.

The map treatment is now darker and cleaner (`deep-neutral`) with clearer geographic edges. Public clusters use calm concentric discovery rings; their density count remains an accessible secondary label and never represents stock, availability, trust, ownership or permission. Facility pins retain the approved pin-with-inner-circle/location-ring language.

Arrival location behavior is permission-aware and session-scoped. It may invoke the browser location path once when permission is prompt or granted, while timeout, denied and unavailable states keep the map usable and expose a retry. No raw personal coordinates are persisted. A result surface now keeps the dock available and provides visible `Nouvelle recherche`, `Affiner` and `Retour à la carte` actions. `Affiner` opens in a separate reserved surface; `Nouvelle recherche` clears the result back to the map-only dock. Desktop uses a wider bounded bottom sheet and a separate dock band without introducing a dashboard rail.

A real same-value search defect discovered during production proof was fixed in commit `60403a3`: the search revision token is now part of the relevant public-facility effect dependencies, so submitting the same query again cannot leave the sheet in loading solely because the query string did not change. The responsive proof script was also made tolerant of an initial idle snapshot before normal rotation begins.

The availability Product step contains only an honest planning note for grouped comparison. The server contract still accepts one `selectedProductId` per request. No multi-product basket, grouped request, implicit multiple submission, or API mutation was introduced.

## Proven

| Area | Evidence | Result |
|---|---|---|
| Manual camera | Production Playwright on `dpl_HypoyQEouvDUqfKScLwm6LMmv61G` | Left drag changed center `1.2200→-60.1860`; right-button pivot changed bearing to `56.46`; no reset |
| Retained idle | Production free-canvas run | Released at `-37.8814` in `manual_navigation`; after leaving to `Acheter`, resumed `resting_globe/rotating` at `-37.6521` |
| Local zoom | Production camera run | Zoom reached `4.32`; projection changed `globe→mercator`; map stayed mounted |
| Location granted | Disposable production context with synthetic `(1.22, 6.13, accuracy 25)` | `location=exact`, one accessible `Votre position sur la carte` marker; context destroyed after proof |
| Location fallback | Persistent authenticated Sandbox browser | Honest `Localisation trop lente` / `location=denied` with `Réessayer`; no marker fabricated |
| Search lifecycle | Canonical authenticated production run | Query reached loading→ready on first run and on identical re-submission after `60403a3` |
| Search recovery | Same production result surface | `Nouvelle recherche`, `Affiner` and `Retour à la carte` visible; return clears result while retaining map/dock |
| Desktop | Authenticated `1024×880` | Sheet `717px`, dock `553px`, gap `14px`, no horizontal overflow |
| Compact normal | Production `390×844` | Canvas, zoom `1.35→2.35`, enabled controls, separated dock and no overflow; rotation passed |
| Compact reduced motion | Production `390×844` with `prefers-reduced-motion: reduce` | Rotation state `reduced`, center unchanged, zoom and controls remained functional |
| Source quality | Local final validation | `116 tests / 16 files`, build bundled exactly `12` Vercel functions, `check:boundary` clean |

## Not proven / still open

The owner’s real browser permission prompt was not captured directly: the granted path used synthetic coordinates in a disposable context, while the persistent browser provided the denied/timeout path. Full keyboard and screen-reader traversal, authenticated compact result-sheet/Seller/Reviewer coverage, facility-focus/back restoration, remote raster tile reliability, deeper performance and the complete failure/retry matrix remain open.

Multi-product availability is not complete. Supporting it requires a Root/API decision covering product-set identity, per-product quantities and budgets, batch idempotency, partial success, expiry, response ownership, resume/retry and permission boundaries. It must not be represented as finished by the current planning note.

Species is not accepted, Global Root remains `review`, and no production-readiness or marketplace expansion claim is made from this slice.

## Preserved

Existing users, Auth identities, historical data, the bounded submitted test claim, Neon branches and existing data were preserved. No destructive migration, reset, drop, role grant, claim decision, seller response, reviewer action, notification send, transaction, QR, payment, OSM import, PWA mutation or new availability write was performed during this Canopy V3 re-entry. Generated `api/v2/*.js` bundles were excluded from commits. The Git working tree is clean and `origin/omni-v2-rebuild` matches HEAD.

## Deployment

The implementation release was pushed through GitHub on branch `omni-v2-rebuild` and reached READY as deployment `dpl_4h49A7jHsfgvddme6qwohw9VsC3x` for commit `60403a3`. The subsequent documentation checkpoint was pushed as commit `02700ed` and reached READY as deployment `dpl_6CdYwXcMXtJcyd7i131cJshhz2Jj`; its metadata reports the expected `nodejs:12` function shape and the canonical aliases including [omni.sparkafrika.online](https://omni.sparkafrika.online/).

## Next gate

Remain inside Species/Canopy. Complete authenticated compact result-sheet and Seller/Reviewer focus/recovery proof, full keyboard/focus certification, facility-focus/back restoration, remote-tile/performance review and the remaining error/retry matrix. Separately decide the Root/API contract for multi-product availability before implementing any grouped selection or batch request. Only after those proofs should Founder HQ consider a Species gate decision; do not advance role bootstrap, OSM, PWA, payments, QR, transactions or field-pilot expansion.

## Supporting records

- [`omni-v2-canopy-v3-contract-2026-08-24.md`](./omni-v2-canopy-v3-contract-2026-08-24.md) — focused Canopy V3 contract.
- [`omni-v2-canopy-v3-browser-audit.md`](./omni-v2-canopy-v3-browser-audit.md) — production and local read-only proof ledger.
- [`v2-founder-hq.md`](./v2-founder-hq.md) — updated single Founder HQ board.
- [`v2-species-audit-2026-08-24.md`](./v2-species-audit-2026-08-24.md) — Species audit ledger.
- [`v2-tasks.md`](./v2-tasks.md) — authoritative backlog checkpoint.
- [`v2-buyer-trunk-heartwood-evidence.md`](./v2-buyer-trunk-heartwood-evidence.md) — Buyer evidence and multi-product boundary.
- [`v2-species.md`](./v2-species.md) and [`docs/maquette/omni-species-maquette.md`](./docs/maquette/omni-species-maquette.md) — updated Species and maquette amendments.

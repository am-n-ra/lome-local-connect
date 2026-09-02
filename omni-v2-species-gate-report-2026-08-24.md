# Omni V2 — Species Gate End-of-Slice Report

**Date:** 2026-08-24
**Author:** Manus AI
**Structural path:** Product → Species → map/search composition → Buyer/Seller/Reviewer/Admin surfaces

## Status

**Partial / bounded proof recorded.** The shared map-first foundation and the authenticated visual handoff surfaces are materially improved and deployed, but the Species gate remains open. This slice is not a production-readiness certification and does not close Global Root, Canopy or any operational Ring.

## Changed

The Buyer public-facility effect now separates text search from viewport discovery. A non-empty text query uses a stable query-only global request, so idle-globe movement, contextual padding and synthetic camera events cannot replace a matching search with a stale bounds query. Nearby discovery without a text query continues to use the current map bounds. The client API contract now has a regression test for the query-only request shape.

The change was validated with `113` Vitest tests across `15` files, a successful TypeScript/Vite production build that bundles exactly `12` Vercel functions, `git diff --check`, and a clean client-boundary check. Generated `api/v2/*.js` bundles were intentionally not committed.

## Proven

| Surface | Bounded evidence | Result |
|---|---|---|
| Buyer map/search | Authenticated canonical replay at the available `891×765` Sandbox viewport; query `Marche de Hanoukope`; loading copy followed by `nearby-state-ready` and `Ouvrir Marche de Hanoukope`; direct read-only endpoint returned HTTP 200 with one safe public-name match | **Verified for loading → ready** |
| Map foundation | Persistent MapLibre canvas/globe, public pin continuity, enabled zoom control, paused motion while contextual surfaces are open, and no continuous rotation-fetch cadence from earlier public proof | **Bounded verified** |
| Seller | Authenticated read-only Seller sheet with `Contexte vendeur autorisé`, `Demandes · 2`, two demo request rows, `Catalogue`, `Actualiser` and `Handoff encore verrouillé` | **Verified for visual/read-only state** |
| Reviewer/Admin | `Équipe Omni · Review`, `Revue des claims`, `Rôle reviewer non ouvert`, explicit no-status-change boundary and no decision inputs | **Verified for locked visual state** |
| Inbox | `Compte J5 · Inbox Omni`, `Inbox vide`, `Actualiser`, and Inbox-before-PWA boundary; map retained behind the sheet | **Verified for truthful empty state** |
| Navigation | J5 remains the sole account/navigation owner; Buyer, Seller, Reviewer/Admin and Inbox were reached without a new Auth loop or business mutation | **Bounded verified** |

The screenshots and DOM captures show the rounded contextual sheets retaining the map and public pin behind them, with the search dock/result surface separated from the lower grid in the authenticated Buyer result state. The current authenticated captures are at the available Sandbox viewport; the earlier public Playwright proof separately covered `390×844` and the six-width public layout matrix.

## Not proven

The remaining Species/Canopy gaps are compact-width authenticated certification, the Buyer empty/error/retry/facility-focus and interrupted-session states, full keyboard/Tab/Shift+Tab/focus behavior, authenticated reduced-motion/context-motion capture, exact successful location behavior, remote raster reliability, full Seller responsive and interactive reachability, and deeper performance/recovery evidence. The active reviewer role, private reviewer evidence read, reviewer decision, OSM import, Web Push delivery, payment, QR, transaction and field-pilot expansion remain outside this slice.

## Preserved

No user, identity, historical row, role, claim, notification, seller response, catalogue record or database branch was deleted or reset. The previously completed private-evidence proof remains retained as bounded test data: one explicitly authorized non-sensitive manga/web-comic JPEG associated with the submitted test claim for `Marche de Hanoukope`. It is not identity, ownership, certification or marketplace evidence.

## Deployment

Commit `6e9c335` (`fix(search): settle global query results`) was pushed to `am-n-ra/lome-local-connect` on `omni-v2-rebuild`. GitHub-triggered Vercel deployment `dpl_B1HfPNbXJaiyq4WEtj7JNWyQW3xD` reached `READY`, serves the canonical production alias, and reports exactly `12` Node functions.

## Next gate

Keep Founder HQ and Global Root in `review`. The next smallest action is a focused Species Canopy proof of the remaining Buyer/Seller responsive, keyboard/focus, empty/error/recovery and facility-focus states, using read-only or explicitly bounded data only. Do not advance role bootstrap, OSM, new evidence capture, PWA delivery, payment, QR, transaction or pilot expansion until that evidence is separately recorded and accepted.

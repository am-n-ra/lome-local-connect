# Omni V2 — Canva-faithful Buyer Trunk Proof

**Method:** Nature Way — Trunk / Heartwood preparation
**Status:** Partial; implementation evidence is recorded, release readiness is not claimed
**Date:** 2026-08-22
**Implementation commit:** `e12f669` (local Trunk implementation), with the follow-up gate correction pending commit

## 1. Scope proved

This pass replaces the previous buyer shell with the Species composition derived from the supplied Canva reference. The implemented public path is:

```text
map arrival
→ Acheter context
→ right-side map controls
→ floating search pill
→ Proche de vous sheet
→ facility/product card rail
→ public facility detail
→ facility-scoped catalogue
→ Auth gate at availability submission
→ bounded availability request state
```

The initial buyer frame now keeps the map mounted behind every contextual surface. It uses the compact Acheter/Vendre switch at upper left, the small J5/account orb at upper right, right-aligned map controls, one search pill, a rounded bottom sheet, a Proche de vous heading, Voir tout, one complete card and a partial next card.

## 2. Automated evidence

The following checks passed after the rewrite:

| Check | Result |
|---|---|
| Vitest | 19 tests passed across 6 files |
| Client boundary | Clean |
| TypeScript/Vite production build | Passed |
| Vercel function bundle | 3 functions bundled |
| Responsive widths | 320, 375, 768 and 1280 proved |
| Map canvas | Present at every tested width |
| Body width | Equal to viewport at every tested width |
| Role switch and account orb | Present at every tested width |
| Nearby cards | 2 bounded proof cards rendered at every tested width |
| Facility catalogue | Opened from the first card in bounded proof mode |
| Console/page errors | None recorded in bounded proof mode |
| Geometry collisions | Controls/sheet, controls/search, search/sheet and topbar/sheet all false at every tested width |

The focused harness is `scripts/prove-species.mjs`. Bounded proof mode uses explicit local fixtures intercepted inside Playwright; those fixtures are test data and must not be treated as marketplace or production inventory.

## 3. Visual evidence

The captured initial frame is `/tmp/omni-species-initial-320.png`. It shows the intended structure: pale spatial globe, upper-left role switch, small J5 indicator, right-side controls, search pill immediately above the sheet, white rounded sheet, nearby heading and horizontal card rail with a clipped next card.

The 320px opened-facility capture is `/tmp/omni-species-320.png`. It shows the same sheet material carrying the facility identity, trust state, facility-scoped catalogue and one primary availability action.

## 4. Protected-state boundary

The public card and facility sheet expose the catalogue where the facility is eligible to publish it. The availability action does not silently create an intent or unlock private contact. Without a session it opens the explicit Auth gate. With a session, the UI sends the existing protected availability request with a bearer token and idempotency key. The post-submit surface truthfully reports a submitted/pending request and keeps comparison marked as pending until a real response exists.

## 5. Remaining Heartwood gaps

The current backend still returns a submitted availability request rather than a persisted response-comparison payload. Seller response operations, live buyer polling or refresh recovery, authenticated sign-in against the canonical domain, duplicate-key replay proof and interrupted-session recovery are not closed by this pass. These are explicitly partial and must remain red in the task tracker until proved.

The branch deployment associated with commit `e12f669` completed in Vercel, but the likely branch alias is protected by a Vercel login wall in the sandbox browser. The canonical domain returned HTTP 200 but was still serving the previous asset hash during the immediate post-push check. Therefore this pass is not a canonical production visual proof.

## 6. Gate decision

The buyer Species implementation is ready for owner visual review and for the next bounded Trunk iteration. It is not ready for a production-release claim. The next work unit is the smallest Heartwood slice that makes authenticated availability real and recoverable: canonical Auth session, protected POST, exact idempotency replay, persisted request inspection, and a truthful pending/comparison state backed by the server.

# Omni V2 Trunk proof record

## Browser proof

The repeatable Playwright proof ran against the local production-like server at `http://127.0.0.1:4180` using viewport widths 320, 375, 768 and 1280. Each width rendered the map-first shell, accessible search input, single Omni dock and account gate. The measured document width matched the viewport at every breakpoint: 320/320, 375/375, 768/768 and 1280/1280. No console errors or page errors were recorded by the proof script.

## Visual inspection

At 320 px, the logo, sign-in affordance, search pill, caption, map controls, attribution, dock and account-required status remain inside the viewport without horizontal overflow. At 1280 px, the same hierarchy scales into a quiet full-viewport map composition with the search centered above the map, a restrained live-discovery chip in the top-right and a balanced bottom dock.

The current headless screenshots show a pale fallback/background map with the small `Loading the globe...` status still visible. The browser proof did not record runtime errors, but live vector-tile readiness was not visually proven in the sandbox. This remains a proof gap for a real browser/network environment, not a claimed production verification.

## Data proof

The isolated Neon V2 branch contains the complete `v2_` schema plus Neon Auth tables. Read-only branch verification returned three seeded facilities: one unclaimed public place with zero published offers, one unconfirmed certified facility with two published offers, and one certified facility with one published offer. The seed is explicitly isolated proof data and is not production data.

## Follow-up map readiness run

A longer 8.5-second wait was run across the same four widths. Layout and interaction assertions continued to pass with exact viewport width and no page errors. Two widths recorded a transient `ERR_CONNECTION_CLOSED` resource error from the external map provider, and all screenshots still showed the map loading label. The application-level fallback timer is present, but the headless environment did not expose a rendered vector map within this proof window. The next hardening action is to make the fallback state explicit and independently testable, then perform live map-tile proof in an authenticated user browser or deployment environment with stable external tile access.

## Fallback-state correction

After switching the primary style endpoint to `https://demotiles.maplibre.org/style.json` and tightening the fallback timer, the proof now reaches the explicit `Map tiles are in fallback mode` state at all four widths, with a MapLibre canvas mounted and no infinite loading label. The wide screenshot shows a deliberate cool-blue fallback surface beneath the ivory glass chrome. External tile resources still produced transient `ERR_CONNECTION_CLOSED` messages at some widths in headless mode; this is recorded as provider/network proof debt, not hidden as an application success.

## End-to-end Trunk journey evidence

The live browser proof now exercises the user-visible path against isolated Neon rows: public facilities resolve with HTTP 200, the result rail renders the three database facilities, selecting `Atelier Kegue` requests its detail endpoint with HTTP 200, the facility sheet renders the facility-scoped `Kente tote bag` catalogue offer, and selecting `Verify availability` opens the account gate rather than issuing an unauthenticated write. The protected API separately returns HTTP 401 when availability is posted without a bearer token.

A proof issue was found and fixed: the initial implementation emitted bounds on every MapLibre `moveend`, including the slow globe rotation, creating repeated discovery requests. Bounds are now emitted only on initial load, drag-end and zoom-end with a stable fingerprint. Public reads also have bounded client and server retry recovery for transient Neon cold-start failures.

The latest four-width proof measured exact body widths at 320, 375, 768 and 1280 px, with the map canvas, search, dock, public facility count, facility rail and account dialog present. Tile-provider fallback remained explicit in the sandbox; stable external tile rendering requires a live browser/deployment check.

## Real map visual proof

The latest proof uses a directly reachable OpenStreetMap raster style in MapLibre. At 320 px, a recognizable Africa-centered globe is visible behind the Omni chrome, with the result cards compressed into a contained three-card rail above the dock. At 1280 px, the globe is centered and dominant, the search pill remains the visual focal control, and the three live database facilities form a single compact rail above the dock. The OSM attribution is visible.

The expanded proof reported `Live map`, three public places in view, a MapLibre canvas, three facility labels, and HTTP 200 discovery responses for the four required widths. The facility detail/catalogue/auth-gate interaction completed on the 320 px run; other widths occasionally raced the cold-start response before the interaction wait and should be repeated with a state-based wait in the proof script before using this as a final release gate.

## Current Neon live verification — 2026-08-22

After the approved additive Roots migration, the current authorized Neon branch `br-bitter-math-amrlbym6` contained no V2 business rows (`v2_facilities=0`, `v2_products=0`, `v2_accounts=0`) while retaining 35 Neon Auth users. Five idempotent V2-only proof inserts were therefore applied: three bounded public facilities and two published catalogue products. These rows are explicitly proof fixtures, not claimed marketplace inventory. No historical table or Neon Auth identity was deleted or modified.

The Git-linked production deployment `dpl_Eev6K9XuJ9kLn7A6Ye19mTfyseH7` (commit `29a946f`, branch `omni-v2-rebuild`) now reads the current Neon branch. `GET /api/v2/public/facilities` returned HTTP 200 with three facilities and their trust/product counts. `GET /api/v2/facilities/00000000-0000-0000-0000-000000000001` returned HTTP 200 with the facility-scoped published `Tomatoes` catalogue item. An unauthenticated `POST /api/v2/availability` returned HTTP 401, confirming the protected-write gate without creating a request row.

The connected browser loaded both the Vercel alias and the trusted custom domain and exposed the map-first V2 content, including `Live map`, `The world around you`, `3 public places in view`, and `Public exploration · account required to verify`. The browser bridge timed out during viewport inspection, so this pass records live page reachability and API evidence but not a new screenshot-level interaction capture. The existing responsive proof remains valid for 320, 375, 768 and 1280 px.

The Trunk is **partial, not production-ready**. Authenticated availability creation, duplicate idempotency replay, interrupted-session recovery and the Heartwood hardening gate remain to be proven before release clearance.

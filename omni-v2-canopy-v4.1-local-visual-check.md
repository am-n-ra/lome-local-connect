# Canopy V4.2 local and canonical visual check — 2026-08-25

## Scope and authority

This record covers the Species/Canopy Buyer map-first correction requested by the owner. It does not close Species, Global Root, Buyer Heartwood or any release Ring. It intentionally excludes the supplied image’s heavy selected-region highlight and literal `Votre position` chip.

## V4.2 visual target

The accepted direction is a white surrounding field, near-black ocean/globe silhouette, light continents and restrained charcoal/gray geographic detail. The map remains dominant, with permanent right-side `Zoom arrière`, `Zoom avant` and `Utiliser ma localisation` controls, a separated bottom search dock and no visual approximate-location band. Idle rotation is map-owned: search, Options, account and non-map navigation do not pause it; direct map gestures and explicit map controls may pause it. Arrival location is passive and non-recentering; explicit recenter remains available.

## Local browser proof — bounded, observed

Environment: local Vite preview at `http://localhost:4174/`. The existing mobile harness at `390×844` and desktop harness at `1024×880` both pass after a twelve-second remote-raster settle. The proof records a mounted MapLibre canvas, three enabled permanent controls, the monochrome baseline, idle motion, continuation through search/Options/account focus, direct globe drag with unchanged bearing, retained camera on map leave, reversible globe↔mercator projection, mobile `16px` input, `visualViewport.scale=1`, screen-reader-only location status and zero visible HTML pin overlays. Synthetic geolocation is isolated to the proof context and not persisted.

The settled screenshots show a visible Africa-centered/rotating globe with a white field, near-black ocean, light land/relief, neutral in-map marker and no permanent location chip or heavy selected-region halo. The local discovery API is unavailable in this bounded preview and displays the honest `La découverte publique est temporairement indisponible.` / `Réessayer` state; this is not a result or native-pin proof. Generated PNG/JSON output stays outside commits in `canopy-v4-1-proof/`.

## Search reveal contract

The reveal helper now follows the established progression `world 1.05 → continent 2.15 → country 5.35 → region 8.25 → city/zone 11.25 → local result framing 14.2 or fit-bounds`, crossing the globe/mercator threshold at `2.4`. Unit coverage passes for the step values, user-position inclusion and invalid/empty fallbacks.

## Provider decision

Liberty remains the last known-good visible provider. Its Natural Earth raster is retained for the low-zoom silhouette and desaturated; the globe-only CSS treatment produces the requested black-ocean/light-land contrast while the mercator treatment remains neutral grayscale. The origin/main Positron precedent was tested with the inherited glyph rewrite, but the direct controller did not reach a loaded vector source or request PBF tiles and rendered blank white; it was reverted rather than released. A second local direct-vector-template/style-transform experiment also produced no PBF requests and was reverted. No unsupported street/boundary claim is made.

## Canonical release and smoke

Commit `381756d4fe2909bf95c724c35aed8caea40cee61` on `omni-v2-rebuild` reached READY as deployment `dpl_8UondDSFQHjPKmdu8dY1GZajpV2a`, with canonical alias `omni.sparkafrika.online` and exactly 12 Node functions. The canonical arrival frame shows `Carte active`, the requested monochrome globe, permanent controls, separated search dock and no excluded highlight/chip. Canonical plus/minus reversal passed.

The read-only query `Marche de Hanoukope` reached `Le monde`, a real result sheet headed `Résultats pour « Marche de Hanoukope »`, the actions `Nouvelle recherche`, `Affiner`, `Retour à la carte`, one public result card and an uninvoked `Voir le lieu`. No facility, availability, claim, seller, reviewer, transaction, payment, notification or OSM action was taken.

## Residual blocker and decision

Two successive settled canonical views after the result choreography showed the result shell and controls still mounted but the map canvas blank white at mercator zoom `12.80`. The DOM still reported a mounted canvas, and public Natural Earth raster requests were present; visually proven vector streets/boundaries and native facility-pin movement were absent. This is a release-quality residual, not a successful local-stage proof.

**Decision: `partial / V4.2 deployed and materially advanced, not accepted`.** The next gate is a properly verified MapLibre wrapper/source-loading correction, followed by real-result vector streets/boundaries, native pin movement during map movement, device-native touch/input proof and authenticated compact/accessibility/performance review. Species, Global Root and all Rings remain open; multi-product availability remains Root/API-blocked.

## Baseline commands

- `git diff --check`: passed.
- `npm test -- --run`: 122 tests across 18 files passed.
- `npm run build`: passed; exactly 12 Vercel functions bundled; the existing Vite >500 kB warning is non-blocking.
- `npm run check:boundary`: passed.

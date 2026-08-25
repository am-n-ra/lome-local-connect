# Canopy V4.2 canonical smoke — 2026-08-25

## Environment

- URL: `https://omni.sparkafrika.online/`
- Deployment: `dpl_8UondDSFQHjPKmdu8dY1GZajpV2a`
- Git commit: `381756d4fe2909bf95c724c35aed8caea40cee61`
- Browser viewport observed: approximately `892×765`.
- Screenshot captured by browser: `/home/ubuntu/screenshots/omni_sparkafrika_onl_2026-08-25_08-42-50_7388.webp`.

## Read-only observations

The canonical page settled to `Carte active` with a persistent MapLibre canvas and the Buyer shell. The visible map is a white outer field containing a black/dark globe with light land/relief; Africa is visible, and there is no heavy selected-region halo or literal `Votre position` chip. The right-side controls are visible together: `Zoom arrière`, `Zoom avant`, and `Utiliser ma localisation`. The bottom search dock is present with the placeholder `Rechercher un commerce, un produit…`, a search button and an Options button. The top role switch and `J5` account control are visible.

This frame confirms the deployed visual direction and permanent-control presence. It does not prove remote vector streets/boundaries or native pin movement after a settled real-result reveal; those remain residual Canopy evidence.

## Zoom control observation

The canonical `Zoom avant` control enlarged the globe while preserving the white field and right-side control stack. The subsequent `Zoom arrière` control reduced it back to a contained globe; both controls remained visible, and the page continued to report `Carte active`. This proves the deployed controls are reversible at the canonical viewport, but not yet the full search reveal or local vector-road result state.

## Read-only search reveal observation

The approved query `Marche de Hanoukope` submitted without opening a facility or invoking a business CTA. The settled result state showed the compact map globe still mounted, the label `Le monde`, the result sheet heading `Résultats pour « Marche de Hanoukope »`, and the actions `Nouvelle recherche`, `Affiner`, `Retour à la carte`, `Voir tout` and `Replier la grille des facilités`. One public result card was visible as `Marche de Hanoukope`, `Market · Lieu local`, with a non-invoked `Voir le lieu` action. The visual remained white-field/dark-ocean/light-land and the permanent right controls remained visible. This confirms canonical result framing and the intended world-stage reveal, but does not prove the complete country/region/city sequence or street-level vector roads after the result.

## Residual blocker observed

Two successive settled browser views after the result reveal showed the map canvas as a blank white field while the `Carte active` text, result sheet, controls and public card remained mounted. This is a reproducible canonical observation at the final reveal wait, not a successful local-street/pin proof. It indicates that the V4.2 source is safely deployed and the result shell works, but the final high-zoom map rendering/provider path is not yet accepted. Do not claim the full continent→country→region/city→local visual sequence or Species completion until this is diagnosed and reproven.

## Canonical diagnostic

At the blank final frame, the DOM still had a `maplibregl-map` canvas sized for the viewport and `.map-stage` reported `data-projection="mercator"`, `data-zoom="12.80"`, `data-center-lng="1.2124"`, `data-reveal-stage="idle"`, and `data-camera-mode="manual_navigation"`. Public `tiles.openfreemap.org/natural_earth/...png` resources were present through raster zoom levels 5–6. No identity, coordinate, token or credential data was recorded. The blank frame is therefore a visible high-zoom map-rendering gap rather than an unmounted React surface; local vector-road/pin rendering remains unproven.

## Local post-patch visual proof

The existing mobile and desktop proof harnesses both passed after the direct vector-template patch. The desktop screenshot shows a contained circular globe with the requested white field, near-black ocean and light land, all three right controls and a separated bottom search dock. The mobile screenshot shows the same monochrome globe and permanent control stack; its visible `La découverte publique est temporairement indisponible.` banner is the existing bounded local API-unavailable state, not an approximate-location band or selected-region highlight. The mobile proof still reports 16px input, visual viewport scale 1, no visible HTML pins, map-only motion and projection/touch assertions passing. The local image after synthetic touch is not evidence of the final high-zoom vector result.

## Local source-fallback smoke

The patched local build mounted the same visible white-field/dark-ocean/light-land globe and the first `Zoom avant` enlarged it cleanly toward the projection threshold. The local API remained in its known unavailable state, so this interaction was limited to map rendering and did not create or mutate any record.

## Local mercator diagnostic

After the patched local build crossed from globe to mercator at zoom `3.35`, the map remained visible as a pale natural-earth raster, but the public performance resource list still contained only `natural_earth/*.png` resources and no `.pbf` vector tile requests. The stage correctly reported `data-projection="mercator"` and `data-zoom="3.35"`. The `setTiles` fallback is therefore not sufficient by itself to prove or restore high-zoom vector streets; this patch must not be treated as closing the residual gap.

## Local diagnostic boundary

The local browser console showed no MapLibre instance exposed on the public map DOM, and the console contained no additional provider error beyond the bounded page state. The controller remains intentionally private; no diagnostic global was added. The evidence still shows the vector source is not producing `.pbf` requests at zoom `3.35`, so a proper origin/main wrapper port or an explicitly verified local vector-source path is required before claiming street-level zoom.

## Local transform refresh

After replacing the post-load workaround with a pre-commit style transform, the refreshed local page still mounted and enlarged the monochrome globe cleanly on the first plus action. The transform introduced no visible regression at globe scale.

## Transform-style result

The pre-commit style-transform variant also kept the local page visible at mercator zoom `3.35`, but the console resource list still contained zero `.pbf` requests. The direct controller therefore does not load the Liberty/OpenFreeMap vector source through either post-load `setTiles` or pre-commit source replacement in this environment. This diagnostic patch is rejected and will not be committed; the known-good V4.2 globe path remains the release-safe behavior, with high-zoom vector detail explicitly open.

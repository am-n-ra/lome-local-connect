# Playwright visual audit — S1/S2

## Capture: live-1280.png

The 1280×900 production capture proves that the warm Omni chrome, logo lockup, location utility, result sheet, search dock and map controls are present and spatially separated.

The primary failure is the map scene: it renders as an almost uniform pale blue field with no visible globe silhouette, land geometry, labels, or facility pins. A tiny artifact appears near the center, but there is no usable geographic scene. This is a blocking S1 failure, not a styling preference. The likely fault is the external MapLibre demo style or its dependent tile/sprite/glyph requests failing or remaining unavailable in the browser build.

The dock and sheet are visually legible but occupy too much vertical attention relative to the empty scene. After the map source is fixed, their contrast and height should be reduced slightly so the globe remains the dominant visual object.

## Playwright DOM audit

The repository-local Playwright run at 1280×900 measured the branded lockup, dock, result sheet and map-control regions correctly. It recorded no request failures, console errors or page errors, but `document.querySelectorAll('.v2-map-canvas canvas')` returned an empty list after seven seconds. The screenshot confirms that the rendered scene is only the CSS peach/ivory gradient; there is no MapLibre canvas, globe silhouette, geography or pins.

This proves the main blocker is not merely an unattractive map style. The MapLibre map instance is not reaching canvas creation in the production browser context. S1 cannot be considered complete until a canvas is present and a deterministic map fallback is visible when WebGL or the remote style is unavailable.

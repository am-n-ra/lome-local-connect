# Buyer Map stability — mini-Species / mini-Seed

**Structural path:** product → Buyer → Map-first discovery → globe/local camera → stability during interaction

**Status:** `in_progress`

**Parent authority:** `v2-species.md`, `v2-flow.md`, `v2-buyer-globe-sheet-mini-spec.md`

## Mini-seed

The Buyer must open on a persistent MapLibre scene that feels like an instrument rather than a repainting panel. The world globe may rotate slowly while idle and may animate into a closer/local view, but the map canvas must not disappear or remount when the user drags or zooms. Facility pins must remain geographic map objects: they move with their coordinates as the map moves, do not flicker because a screen overlay was recomputed, and remain selectable at local zoom.

## Mini-species contract

| State | Required treatment |
|---|---|
| `idle_globe` | Full-viewport pale monochrome globe; slow interruptible rotation; cluster/pins rendered by the map scene; compact dock only |
| `manual_drag` | Globe/camera remains mounted and visible; rotation pauses; pins remain anchored to geography; no blank map replacement |
| `manual_zoom` | Smooth native MapLibre zoom; globe is retained at low zoom and transitions into a contained/local map at higher zoom; pins remain anchored |
| `local_map` | Full scene remains visible; no forced sheet or arbitrary viewport crop; facilities remain on the map at their real coordinates |
| `context_surface_open` | Motion pauses while the user reads/options/nearby/J5; camera padding follows actual sheet occupancy |
| `recovery/fallback` | Basemap source may switch only through the existing labelled fallback path; source failure must not unmount the scene or erase facility state |

## Mini-root decisions

1. MapLibre owns geographic rendering and pin anchoring. DOM markers may provide keyboard/touch semantics, but their coordinates are controlled by MapLibre; a per-frame projected screen-pin layer must not be the visual source of truth.
2. Public clusters remain source-backed density results. A cluster or marker proves public source presence only; it never implies stock, trust, ownership or permission.
3. Remote style/tile errors after the initial style has loaded must not trigger a destructive style swap. Initial fallback remains labelled and recoverable.
4. Manual interaction pauses idle motion and receives a short settling cooldown before eligible idle rotation can resume. Reduced motion disables idle rotation.
5. The map stage and canvas remain mounted for all camera and surface states. Sheet visibility changes camera padding only; it does not replace the map.

## Mini-trunk acceptance

- At `320×760`, `375×812`, `768×900`, `1024×880`, `1280×900` and `1731×818`, the stage/canvas remain full viewport during idle, drag, zoom, reveal and collapse.
- At idle, the cluster or facility marker is visible without a nearby sheet. After drag/zoom, the marker remains present or transitions honestly to the cluster/local pin state; it does not vanish because of an overlay recomputation.
- Zoom controls change the camera without replacing the map. Zooming out returns to the globe; zooming in reaches a contained/local map with native MapLibre rendering.
- Opening Options, J5 or a contextual sheet pauses motion; closing the surface may resume only when the camera is eligible and reduced-motion is not active.
- Browser proof records map canvas identity/rectangle, marker/cluster presence, rotation state before/after, and no overlap or horizontal overflow.

## Non-goals

This mini-slice does not add OSM editing, facility claims, catalogue publication, inventory, trust, account ownership, route, chat, payment or transaction behavior. It does not claim remote tile reliability; it only prevents a tile error from tearing down the stable map scene.

# Omni V2 — Mini-Seed / Mini-Species
## Globe contained, contextual nearby surface and idle mode

**Structural path:** `product > buyer > map-first arrival > map mode > nearby surface > idle/reveal state`

**Nature Way status:** Design contract for the next hardening slice; implementation not yet updated.

## Mini-Seed

The Buyer must let a person arrive in a calm, fully contained globe/map scene, understand that public facilities are spatial context rather than stock, and reveal the nearby facility surface only when there is a real contextual reason to show results. When the nearby surface is not contextually needed, the bottom of the viewport must return to a compact idle dock rather than reserve a large empty sheet.

The core failure to avoid is a screen that looks like a tall dashboard panel over a cropped globe. The map must remain the dominant scene in both global-globe and local-map modes, and it must remain fully contained within the viewport. The result surface may rise above the dock only for a result, search reveal, explicit nearby exploration or a facility context.

## Mini-Species

The supplied V1 visual reference is the inspiration for balance, not a source of obsolete navigation. The inherited V2 Species remains authoritative for account ownership, colors, public truth and safe areas.

| Element | Locked behavior |
|---|---|
| Map-only idle | Full contained globe/map, sparse public pins/clusters, calm motion when allowed, compact bottom search dock only |
| Nearby surface | Contextual only: shown for real nearby results, an explicit reveal, search results, facility context or an explicit open action; not permanently present in idle |
| Collapsed nearby | Collapsed state is not a tall sheet. It becomes the compact idle dock state and leaves no large reserved white body below it |
| Result surface | White rounded sheet with handle, heading and rail/cards; dock occupies its own band above it with measurable gap |
| Globe | Fully inside the viewport with no clipping from the sheet, no oversized disc escaping the scene, and stable balance at short, mobile, tablet and desktop heights |
| Local map | Same map stage and controls; camera zoom/pan remains contained, with pins/clusters readable and no silent personal-location claim |
| Dock | One compact input row, Options disclosure, and a visible right-side search action in focused/reveal states; no second search bar |
| Controls | Right-side zoom/location controls retain independent safe space from dock, Options and contextual surfaces |
| J5 | Remains the only account/navigation owner; its surface is not redesigned by this slice unless required to preserve map containment |
| Truth | Public pin/cluster means public geographic presence only; no stock, trust, price, permission or availability implication |
| Motion | Idle rotation stops for search focus, Options, explicit result reveal, facility focus, sheet context or manual interaction; reduced motion disables continuous motion |

## State transitions

```text
idle_globe
  → search_focused
  → search_revealed
  → nearby_results
  → facility_focus
  → idle_globe / local_map

idle_globe
  → explicit_open_nearby
  → nearby_results
  → collapsed_idle
  → idle_globe

idle_globe
  → manual_zoom_or_pan
  → local_map
  → nearby_results only when results are actually available or explicitly opened
```

`collapsed_idle` is a visual state, not a hidden result sheet with a large fixed height. If there is no active result/search/facility context, the implementation should render the same compact idle arrangement as map-only.

## Geometry contract

The map stage fills the available application viewport and clips only the map’s own rendering to the viewport. The globe or local map must not be clipped by an incorrectly oversized child surface. The idle dock is positioned from the bottom safe area. When results are visible, the dock is positioned in a reserved band above the result sheet, with the approved minimum gap of 8px on narrow mobile and 12–16px on wider viewports.

The nearby result sheet is sized to its content and bounded by the available dynamic viewport height. Its loading, empty and error states must not create a large unused lower body. When the viewport cannot fit the complete result composition, cards reduce or the nearby surface collapses before any overlap or map starvation is allowed.

## Definition of done for this mini-slice

1. The initial Buyer frame at all required viewport classes visibly contains the complete globe/map, top controls, right controls and compact idle dock without a permanent nearby sheet.
2. The nearby surface appears only after a contextual result/reveal condition and is separated from the dock by a measured positive gap.
3. Collapsing the nearby surface returns to compact idle geometry and removes the large empty lower area.
4. Globe and local map screenshots show no map/canvas escape, clipping or accidental starvation at short mobile, narrow mobile, tablet and desktop heights.
5. Search focus and Options stop idle rotation; manual zoom/pan and facility focus remain interruptible and recoverable.
6. Public clusters/pins remain visible, clickable and semantically public-only.
7. Existing Buyer→Seller→Buyer protected flow, Auth, availability and persistence behavior remain untouched.
8. Browser evidence covers idle, nearby reveal, collapse→idle, search/Options, zoom in/out and one facility return at the required viewports.

## Explicit non-goals

This slice does not redesign seller screens, trust/certification, availability, comparison, intent, transaction, QR, payment, or public-data semantics. It does not remove MapLibre, replace the map with an image, or revive the old V1 brand header/hamburger/navigation.

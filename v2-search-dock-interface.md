# Omni V2 — Map-First Search Dock Interface Contract

**Status:** Approved implementation contract for the search-dock ring

**Authority:** Search dock composition, options disclosure, menu placement, map-control zones, stacking, safe areas, responsive behavior and interaction ownership.

**Parent authorities:** `v2-seed.md`, `v2-roots.md`, `v2-flow.md` and `v2-interface-architecture.md`. This document narrows the current buyer Trunk; it does not override product invariants or protected-access rules.

## 1. Experience contract

Omni is a **map-first geospatial search engine**. The MapLibre globe/map is the permanent scene. The search dock is the primary command surface. Sheets and result cards are temporary context surfaces above the map; they never replace the map or become an unrelated marketplace grid.

The visible hierarchy is:

```text
map scene
  ├── top chrome: Omni brand/context + one hamburger menu at top-right
  ├── map controls: recenter, plus, minus in a vertical group on the left
  ├── search dock: one search row + one options chevron
  ├── options surface: filters/parameters revealed by the chevron
  ├── result rail: facility cards above the bottom stack
  └── map metadata: caption/status/one custom attribution in reserved space
```

The globe remains gently rotating only while the map is idle. Pointer/touch/keyboard map interaction, search focus, options open, result reveal, facility selection and any active sheet take priority over idle motion.

## 2. Search dock contract

The dock is one shared component with one input row and one disclosure control. It owns the following state transitions:

```text
search_idle
  → search_focused
  → options_open
  → search_submitting
  → auth_required(context_snapshot)
  → search_reveal | empty_results | search_error

options_open
  → options_changed
  → apply_options
  → clear_options
  → search_idle
  → cancelled
```

The input, Search action and Enter key use the same guarded submission path. Typing never moves or zooms the camera. The chevron has an accessible name that changes with state: `Open search options` or `Close search options`; `aria-expanded` and `aria-controls` are mandatory.

The dock’s primary actions are:

| Control | Responsibility | Guard |
|---|---|---|
| Search input | Capture the buyer’s need without forcing product-name retyping when a facility catalogue exists | No camera movement on focus or typing; mobile type size must avoid browser zoom |
| Search | Submit the current query/options using the authoritative contract | Visitor submission opens Auth with a context snapshot; authenticated submission enters loading |
| Options chevron | Reveal or close the options surface | Does not submit, claim a facility, request availability or move the camera |
| Clear options | Restore documented defaults | Must not clear query, viewport or selected context unless explicitly requested |
| Apply options | Commit supported options to the guarded search path | Unsupported options cannot appear as functional controls |

## 3. Supported options boundary

The options surface may expose quantity, budget mode/value, category, radius/distance, open-now, discounts, sort and location mode only when the corresponding server request and response contract exists. Current V2 public discovery is known to support bounds and query; any additional filter is either connected through an additive typed contract or labelled deferred/manual and excluded from the working search claim.

The options surface shows current values, clear/apply actions and a bounded scroll body. It does not place separate filter buttons around the map. All values are included in the preserved search context when Auth is required.

## 4. Top-right menu

The top-right menu is a single hamburger control with an explicit open state. It may expose only actions mapped to current typed states, such as account/Auth, return to map, or a clearly labelled deferred/manual action. Old prototype destinations and unavailable seller/admin routes are not permitted.

Menu rules are:

1. It opens a bounded menu or shared sheet without unmounting the map.
2. It owns focus while open and closes on Escape, outside click or explicit close.
3. It does not overlap the search dock, options surface, result rail or map controls.
4. It never exposes a dead action.

## 5. Map control zone

Recenter, plus and minus are one vertical control group on the left. The group is inset from the safe-area top/bottom and excludes the measured bottom stack. Recenter uses the browser location state contract and remains cancellable/non-blocking; plus and minus change the map zoom only.

The control group must be reachable by keyboard and touch, retain visible focus, and pause idle rotation while focused or used.

## 6. Safe-area and stacking contract

The implementation uses shared CSS variables rather than unrelated absolute offsets:

```css
--safe-top: max(12px, env(safe-area-inset-top));
--safe-right: max(12px, env(safe-area-inset-right));
--safe-bottom: max(16px, env(safe-area-inset-bottom));
--dock-height: measured dock height;
--options-height: measured options height;
--rail-gap: 12px;
```

The stacking order and exclusion rules are:

| Layer | Mobile placement | Desktop placement | Must not intersect |
|---|---|---|---|
| Map canvas | Full viewport | Full viewport | N/A |
| Top chrome | Safe-area top | Safe-area top | Search, menu surface |
| Search dock | Bottom safe area | Lower map stage | Rail, options, sheet |
| Options surface | Directly above dock, bounded and scrollable | Bounded above/near dock | Dock, rail, map controls, viewport edge |
| Result rail | Above the full dock/options stack | Above dock on lower map stage | Dock, options, attribution |
| Map controls | Left, centered in remaining map space | Left, centered in remaining map space | Search, rail, sheets |
| Caption/status/attribution | Dedicated metadata band | Dedicated metadata band | Rail, dock, options, search |
| Sheet/backdrop | Bottom anchored | Bounded floating | Active focus surface owns interaction |

Only one attribution is rendered. Generated MapLibre attribution is disabled when a custom attribution element is present. The proof harness must measure actual rectangles for every visible layer, not infer safety from CSS source values.

## 7. Responsive rules

The required proof widths are 320, 375, 768 and 1280 CSS pixels. At all widths:

- `document.body.scrollWidth` equals `window.innerWidth`;
- the map canvas remains mounted and visually dominant;
- the dock remains one coherent search surface;
- the options body scrolls internally when necessary;
- cards are contained and readable without page-level horizontal overflow;
- no visible overlay pair intersects;
- controls remain reachable and separated from the bottom stack;
- input focus does not cause browser-level layout zoom;
- reduced-motion users do not receive idle rotation or nonessential transition motion.

At narrow mobile widths, the result rail may collapse to a compact count/restore state only when the full stack cannot fit. It must never be hidden without an intentional restore affordance and must never overlap the open options surface.

## 8. Accessibility and recovery

The dock, options surface, menu and sheets use semantic names and visible focus. Escape ownership is deterministic: the innermost open options/menu/sheet closes first. Outside click closes only dismissible non-destructive surfaces. The map remains inert behind a modal sheet while the sheet is open.

The context snapshot preserves query, options, map viewport/bounds, location mode, selected facility, selected product and protected continuation where applicable. Auth cancellation, search error, retry, refresh and back restore or clearly discard context only by explicit user action.

## 9. Acceptance gate

This ring is `verified` only when the real canonical domain demonstrates:

1. open/close chevron and options state;
2. supported options apply/clear behavior;
3. search loading, ready, empty, error/retry and Auth-required states;
4. hamburger open/close without dead entries;
5. left map controls and idle-globe priority behavior;
6. facility rail, facility detail and return-to-map context;
7. no horizontal overflow or measured overlay collision at 320, 375, 768 and 1280 px;
8. accessible names and keyboard/touch focus ownership;
9. proof record updated with deployment, fixtures, screenshots and residual Auth/protected-write gates.

This contract does not implement seller workspace, certification, wallet, FedaPay, QR, transaction chat or a new mobile app. Those remain separate vertical slices.

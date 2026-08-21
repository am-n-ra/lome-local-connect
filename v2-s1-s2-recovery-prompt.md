# Omni V2 — S1/S2 Recovery Build Prompt

## Objective

Complete, do not restart, the buyer-facing S1/S2 implementation on top of the existing V2 shell and MapLibre component. The result must look and behave like a deliberate map-first product surface rather than a demo scaffold.

## In scope

The globe/map scene, idle horizontal rotation, user location visualization, recenter and rotation controls, top chrome, search dock, options popover, visible-bounds discovery, result states, facility detail, facility media, public catalogue, product selection, back stack and responsive layout.

## Out of scope

Availability checks, seller onboarding, claiming, certification, transaction intent, QR, chat, payment, wallet, private seller data and any V1 provider or navigation layer.

## Required buyer state machine

`idle_globe → [allow/deny location] → location_exact | location_approximate | fallback_market`

`idle_globe | location_* → [focus dock] → search_input → [submit] → search_submitting → search_reveal → results_visible | empty_results | search_error`

`results_visible → [select facility] → facility_detail_loading → facility_detail_ready | facility_detail_error`

`facility_detail_ready → [open catalogue] → catalogue_visible | catalogue_empty`

`catalogue_visible → [select product] → product_selected`

`product_selected → [back] → catalogue_visible → [back] → facility_detail_ready → [back] → results_visible`

Every state must have visible feedback and recoverable action. Search input must not cause mobile viewport jumps. The Options control must open a real sheet/popover, not only update a sentence.

## Brand and visual source

Use the supplied logo at `public/assets/omni-logo.png` and the canonical tokens and layout rules in `docs/v2-omni-design-system.md`. Do not introduce a second palette, dark-dashboard treatment or ad hoc spacing system.

## Required composition

The persistent scene must remain the visual focus. The top chrome must include Omni identity, location state and map controls without covering the map. The dock must contain one search field, clear submit state, result context, a single Options chevron and a small status line. The sheet must be a deliberate responsive surface with a result header, cards, detail identity, media, catalogue toolbar and selection summary.

## Map requirements

MapLibre must use globe projection after style load, rotate horizontally only while idle, pause during manual interaction, expose a recenter control, expose rotation pause/resume, render exact/approximate location markers and render discovery facilities source-backed. At low zoom, facilities may cluster; at local zoom, individual pins must be visible. Do not invent country labels or unrelated map overlays.

## Acceptance proof

A click-through at 320, 375, 768 and 1280 px must show the same state machine without horizontal overflow. The production URL must visibly show the globe or globe projection, not a flat fallback. The dock Options action must open and close. Search, retry, empty results, facility detail, catalogue, product selection and all back actions must be observable. S0/S1/S2 tests, typecheck, production build and client-boundary checks must pass.

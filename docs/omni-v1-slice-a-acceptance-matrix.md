# Slice A Acceptance Matrix — Map-first discovery and authenticated search replay

**Slice:** `OMNI-V1-A`  
**Risk:** `L1/L2`  
**Related brief:** `docs/omni-v1-field-brief.md`  
**Related flow:** `docs/omni-v1-flow-and-decision-contract.md`  
**Status:** `in-progress`

| ID | Scenario | Expected result | Proof | Status |
| --- | --- | --- | --- | --- |
| A-01 | Initial map load | Real MapLibre canvas fills the scene; no decorative replacement; projection metadata is truthful. | Browser DOM/canvas assertion and visual review. | `pending` |
| A-02 | Permission state `prompt` | Native location request is allowed to appear; dock says `Autorisez votre position…`; map remains usable. | Browser permission-state test. | `implemented-awaiting-run` |
| A-03 | Fresh precise callback | Fresh coordinate with accuracy ≤500m creates the personal marker and precise location label. | Unit helper test and browser callback fixture. | `verified-unit` |
| A-04 | Stale session coordinate | Restored coordinate may inform approximate discovery but cannot create a personal marker before a fresh callback. | Unit helper test and browser session fixture. | `verified-unit` |
| A-05 | Fresh approximate callback | Coordinate above 500m is shown as approximate context; no precise blue personal marker or exact label. | Unit helper test and browser callback fixture. | `pending` |
| A-06 | Permission denied/fallback | No personal marker; user can retry or explore approximate market context without false precision. | Browser denied and fallback test. | `pending` |
| A-07 | Search by Enter/button | Both paths call one submission handler and preserve query/constraints. | Component/browser interaction test. | `pending` |
| A-08 | Unauthenticated search | Query, category, quantity, budget and context are stored; auth route is shown; no false completed search is claimed. | Auth handoff unit/integration test. | `pending` |
| A-09 | Authenticated replay | Original query and constraints restore once after auth and search executes without losing context. | Two-route browser E2E. | `pending` |
| A-10 | Visible-bbox discovery | Results load from the current viewport, including source-backed unclaimed facilities; late/empty/error states are distinct. | Server integration test and browser map test. | `pending` |
| A-11 | Result card | Searched product/service is foregrounded; trust state and valid action are shown; selected card can close and restore results/map. | Browser visual/interaction test. | `pending` |
| A-12 | Target widths | No horizontal overflow or dock/control overlap at 320, 375, 768 and 1280px. | Browser viewport certification. | `pending` |

## Mandatory negative paths

The slice must reject or avoid presenting an exact location when the browser denies permission, a session coordinate is stale, accuracy is approximate, or the coordinate matches a fallback market center without a fresh callback. It must not execute an unauthenticated persistent search, leak buyer budget to seller payloads, expose purchase/contact actions for unclaimed facilities, or allow a stale search reveal to move the map after a newer search.

## Release decision

The slice may become `verified` only when all mandatory criteria have recorded reproducible evidence. Current result: `partial` — the shared location and scene-state contracts have been tightened; 62 unit tests, production build and client-boundary checks pass; browser, integration, device and viewport proofs remain pending.

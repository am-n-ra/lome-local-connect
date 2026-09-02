# Omni V1 Search Dock Traceability — 2026-08-21

**Contract:** `omni-dock-conformance-plan-2026-08-21.md`
**Authority:** `omni-ui-system.md`, `omni-v1-product-interface-architecture-contract.md`, `OMNI_MASTER_PRODUCT_INTERFACE.md`

| Dock row/state | Current source of truth | Current callback / server boundary | Required presentation rule |
|---|---|---|---|
| Primary search | `CartePage.query`, `SmartSearchBar` | `CartePage.handleSearchSubmit` | Exact query; Enter and button share one idempotent submit path. |
| Discovery/categories | `CartePage.category`, `SearchDock.CHIPS` | `setCategory` or pending-search auth replay | Compact `Affiner`; opening it must not submit or alter the map scene. |
| Optional filters | `CartePage.filters`, `RefinementPanel` | `setFilters` | Radius/open/discount/sort remain optional; isolate from structured buyer constraints. |
| Structured quantity | `CartePage.quantity`, `SearchDock.quantityDraft` | `setQuantity` | Hide untouched default in idle; keep explicitly edited value visible through active flow. |
| Structured budget | `CartePage.filters.maxPrice`, `SearchDock.budgetDraft` | `setFilters({maxPrice})` | Nullable/private; `Illimité` is valid; never placed in seller payload. |
| Location context | `CartePage.locationStatus`, `browserPermission`, `userPos` | `requestLocation`, `useMarketFallback`, `retryCoverage` | Pending/precise/approximate/denied/unavailable are distinct and truthful. |
| Coverage context | `CartePage.coverageStatus` | `retryCoverage` | Loading/error/retry remains compact and does not replace the map. |
| Direct-results action | `results.length`, `hasActiveSearch` | `openDemandRequest` | Count + `Vérifier la disponibilité`; one action row only. |
| No-results request | `results.length === 0`, exact `query`/`category` | `openDemandRequest` | Exact query echoed; request surface replaces the action row only. |
| Facility selection | `CartePage.selected` | `setSelected`, `openManualAvailability` | Closing restores map/search context and dock values. |
| Measured clearance | `SearchDock.dockRef` | `--omni-dock-clearance` | Result rail/map controls stay above actual dock height at every breakpoint. |
| Analytics | consent state + `SearchDock.handleSubmit` | `recordProductEvent` | Consent-gated and pseudonymous; no exact location or private budget in generic events. |

## Confirmed current drift

`SearchDock` currently uses one `parametersOpen` state for both structured parameters and the discovery/refinement content. Quantity and budget therefore disappear when the chevron is closed, even after a buyer has interacted with them. Categories and optional filters also appear through the same toggle. The next code slice must split those presentation states while leaving `CartePage` as the route/data authority.

The action/request branch is already mutually exclusive at the JSX level, but its visual and state contract must be tested to ensure the structured row never shares the same surface and the exact query is retained in the no-result request state.

## Scope guard

This artifact does not authorize changes to MapLibre, discovery APIs, location server logic, availability server functions, transaction room, seller route, wallet or database schema. Any change outside `SearchDock.tsx`, `SmartSearchBar.tsx`, `CartePage.tsx`, dock-related primitives/styles, focused tests and derivative evidence must stop for a new decision.

## Production-active clean branch finding

The production-active `/carte` route renders `CleanBuyerMapStage` when `cleanUi` is enabled. The legacy `SearchDock` remains only in the rollback branch. `CleanBuyerMapStage` currently combines the search input, location chips, coverage loading/error and fallback actions in one primary dock; it has no named discovery/refinement row, no structured quantity/budget row, and no mutually exclusive action/request row. Its result summary and `Vérifier plusieurs` card sit above the dock rather than occupying an explicit action row, and the no-result state has no request CTA. The new implementation must therefore target a production-active `CleanBuyerSearchDock` inside `CleanBuyerMapStage`, while keeping the fallback `SearchDock` contract-compatible.

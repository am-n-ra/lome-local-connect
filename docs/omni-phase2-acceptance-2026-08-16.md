# Omni Phase 2 acceptance note — 2026-08-16

## Decision summary

The buyer map UI correction and the first seller workspace redesign slice are implemented on `main`. The live Neon read-only audit is available and confirms the current schema/data shape. Phase 2 is **not yet fully closed** because the application-level Aflao viewport import has not been proven in the running app, even though the OSM source itself returns real named facilities for the Aflao bounds.

## Completed in this slice

| Surface | Evidence | Result |
|---|---|---|
| Buyer location context | Running `/carte` browser check | Compact loading state and human-readable location states are visible; technical GPS strings are removed. |
| Buyer refinement | Running `/carte` browser check | The chevron expands one creamy-glass container containing categories, radius, budget, open-now, discount, sort, and reset controls. |
| Buyer facility actions | Build and lint checks | Unclaimed facilities remain discoverable but cannot initiate Omni purchase actions; directions/contact are gated behind a created purchase intent. |
| Buyer navigation | Existing merged UI plus source inspection | Desktop role switch remains in the top navigation; mobile menu no longer duplicates it; notification/menu spacing remains independent. |
| Seller workspace | Build and lint checks | Facility-anchored operational header, safe-area shell, and horizontally scrollable operational tabs are in place without removing existing panels. |
| Production validation | `pnpm run build`, targeted ESLint, `git diff --check` | Build passes, no lint errors, and no whitespace errors. Existing warnings concern Fast Refresh exports and one pre-existing seller effect dependency. |

## Live Neon evidence

The read-only audit found 40 public tables, 378 public columns, 385 public constraints, and 86 public indexes. The current facility population is 4,067 rows: 1 certified, 4 uncertified, and 4,062 unclaimed. Sources are 4 demo, 1 manual, and 4,062 OSM. All existing facilities currently use `TG-LOME`, which is consistent with a baseline database that has not yet been exercised in another viewport, but it is not proof of global coverage.

The OSM tile cache currently contains five tiles, all within the Lomé bounds. A read-only Overpass request for the Aflao-area bounds returned 20 candidate elements, including 18 named facilities. The application’s importer already contains the `GLOBAL` market assignment and source-reference deduplication path. The missing evidence is therefore an application-level viewport test that imports and returns Aflao rows.

## Release gate still open

Before declaring Phase 2 complete, run the buyer map at a real regional zoom, move the MapLibre viewport into Aflao, and verify all of the following in the database and returned map response:

1. A missing tile is fetched once and recorded in `osm_tiles`.
2. Named OSM facilities are inserted as `unclaimed` with `source = 'osm'`.
3. Aflao rows receive `market_code = 'GLOBAL'`.
4. Repeating the same viewport does not create duplicates by `source_ref`.
5. The buyer map renders the returned pins/cards and preserves the neutral unclaimed action surface.

Only after this gate should the project move to Phase 3 transaction hardening and the broader seller catalogue/wallet release.

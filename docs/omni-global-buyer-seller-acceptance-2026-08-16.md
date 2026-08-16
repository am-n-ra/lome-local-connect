# Omni global buyer/seller correction acceptance — 2026-08-16

## Scope

This release slice addresses the buyer dock state regression, editable quantity and budget controls, viewport-driven worldwide unclaimed discovery, facility media previews, and the first specification-driven seller workspace redesign.

## Buyer acceptance

The dock keeps quantity and budget in one stable surface from idle through raw search typing and submitted results. Typing a draft query does not mount a different quantity/budget view or trigger a search request. Quantity is directly editable as a positive integer and retains plus/minus affordances. Budget is directly editable and uses an explicit `Illimité` state represented by `maxPrice: null`; the refine chevron does not duplicate either control. Editing budget or quantity before a submitted search does not open the request/result action state.

The dock now reports human-readable viewport discovery states: `Recherche de la zone…`, `Zone cartographiée`, and `Zone momentanément indisponible`. Location copy remains non-technical and continues to distinguish precise position, approximate zone, blocked access, and unavailable location.

Buyer cards render the stored `cover_url` image when facility media exists, use lazy loading and accessible alternative text, and show a neutral creamy fallback when no public media exists. The selected facility sheet uses the same media treatment. OSM/unclaimed action gating remains intact: public discovery and claim remain available, while purchase, availability, directions, and contact stay unavailable until the documented state permits them.

## Global coverage acceptance

The application-level harness `scripts/check-global-coverage.ts` invokes the runtime `ensureCoverage` importer and queries Neon using the same facility table as buyer discovery.

| Probe | Before | Imported | After in exact probe bounds | OSM | Unclaimed | GLOBAL | Duplicate source refs |
|---|---:|---:|---:|---:|---:|---:|---:|
| Aflao | 743 | 0 | 743 | 742 | 742 | 742 | 0 |
| London | 0 | 775 | 389 | 389 | 389 | 389 | 0 |

The Aflao probe validates cross-border classification and stable deduplication. The London probe validates a second continent and confirms on-demand GLOBAL/unclaimed OSM import. The runtime importer now accepts regional zoom 9, retries stale empty tiles after six hours, uses explicit Overpass JSON/user-agent headers, and prioritizes tiles nearest the visible viewport center. Migration `018_reclassify_global_osm.sql` corrected 1,300 legacy OSM rows outside the bounded Lomé market to `GLOBAL`.

## Seller acceptance

The seller route now has an active facility selector when multiple facilities exist, a controlled operational navigation surface, a facility-anchored header with online/offline state, and prioritized action cards for received requests, stock, local demand, and wallet state. The facility map remains the main operational anchor. Existing catalogue, request, wallet, subscription, media, advertising, coupon, agent, settings, and emergency-shutdown contracts are preserved; plan and feature gating remain active. Seller withdrawals were not added.

## Responsive and validation evidence

The buyer browser smoke check at the local development viewport confirmed the real MapLibre globe, stable quantity/budget controls, direct quantity entry, direct budget entry, the explicit unlimited control, non-technical location status, and no premature request surface while typing. CSS uses mobile-first stacking, horizontal overflow containment, safe-area bottom padding, dock clearance via `ResizeObserver`, and desktop multi-column expansion for the buyer and seller surfaces. The target responsive widths remain 320px, 375px, 768px, and 1280px; no fixed-width change was introduced that exceeds the smallest target.

Formatting, targeted ESLint, production build, and `git diff --check` all pass. ESLint retains three non-blocking warnings: two existing Fast Refresh export warnings in `SearchDock.tsx` and one existing seller effect dependency warning. The local `.env` file remains untracked and is excluded from the release commit.

## Remaining data note

The current Neon audit reports zero stored facility-media rows, so the buyer cards correctly show their neutral fallback for the present dataset. The media path is ready for seller-uploaded media and future OSM `image`-tag ingestion; no invented or unverified images are shown.

# Omni production refactor acceptance — 2026-08-16

## Scope

This release slice applies the approved production refactor plan. It removes the deprecated global navigation pattern from Omni routes, hides buyer Quantity and Budget until the user explicitly opens structured parameters, preserves mobile Buyer/Seller switching in the hamburger menu, improves the seller operational shell, and aligns buyer cards and facility detail with truthful media and action states.

## Buyer acceptance

The idle `/carte` dock now renders the search input, location/discovery feedback, and the parameter chevron. It does not render `Quantité`, `Budget maximum`, `Illimité`, or the manual budget amount input by default. Opening the chevron renders Quantity and Budget together with the category and refinement controls. Numeric edits and `maxPrice: null` unlimited mode remain supported. Draft typing remains separate from the submitted search contract and does not change the result/request view.

The browser check confirmed that the idle dock hides the structured values and that the chevron reveals Quantity, manual Budget, unlimited mode, categories, switches, sorting, and reset. The mobile hamburger menu contains `Acheteur` and `Vendeur` space controls.

The buyer route continues to support location permission, approximate fallback, viewport-driven OSM discovery, authentication restoration for first search and availability, manual/bulk availability, unclaimed-facility gating, facility media fallbacks, directions after purchase intent, and QR/order panels. Unauthenticated product purchase actions now navigate to `/auth` with a return target to the selected facility instead of stopping at a toast.

## Navigation acceptance

The old global header was removed from `/a-propos`, `/admin`, `/api-docs`, and `/fiche/$id`. `/a-propos` now redirects to the map-first `/carte` experience. Facility detail retains a scoped return-to-map action. Admin and API documentation use their own focused content shells. The only remaining `TopNav` render sites are the buyer map and seller contextual map chrome; these render notifications/menu controls without the deprecated desktop Buyer/Seller strip.

## Seller acceptance

The seller route uses the minimal contextual map chrome and keeps mobile role switching available through the hamburger menu. The active facility remains the workspace anchor, with facility switching, online/offline status, operating controls, map position, emergency shutdown, buyer preview, catalogue/inventory, requests, local demand, QR checkout, advertising, coupons, wallet, subscription, and Agent surfaces preserved.

The seller workspace now adds mobile-priority quick actions for Today, Requests, Catalogue, and Scan QR. The full operations list remains available through a horizontally scrollable contextual tab bar. The Settings panel no longer presents a fake future feature; it routes users to the existing operational controls. Unsupported capabilities remain represented by real plan/feature gating or truthful empty states.

## Media and claims

Buyer result cards show stored `cover_url` media when available and otherwise display `Aucun média public disponible`; they no longer claim that media is coming later. The selected facility panel and facility detail retain real media rendering with neutral fallbacks. Unclaimed OSM facilities remain discoverable and claimable, but product purchase, cart, availability, itinerary, and contact actions remain gated according to facility status and purchase intent.

## Validation

The edited files were formatted successfully. Targeted ESLint completed with zero errors and four non-blocking warnings: three existing Fast Refresh export warnings and one existing seller hook dependency warning. The production build completed successfully, and `git diff --check` passed.

The browser evidence files are:

- `omni-navigation-browser-evidence.md`
- `omni-seller-browser-evidence.md`

Authenticated seller mutations, payment-provider callbacks, QR verification, and transaction completion require environment-backed acceptance with a valid test account and are not claimed as browser-verified by this unauthenticated smoke session. The code paths and server contracts remain wired and must be exercised in the deployment environment before enabling a final production release.

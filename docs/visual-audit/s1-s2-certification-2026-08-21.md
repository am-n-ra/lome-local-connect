# Omni V2 S1/S2 Certification — 2026-08-21

## Reproduced issue

The Playwright journey successfully reached the facility detail view, but the catalogue contained no product cards when the discovery query was `Marché`. The route reused the facility discovery query to filter catalogue products, so `Maïs en sac` and `Riz local` were hidden because neither product name nor category contained `Marché`.

## Fixes applied

- `src/routes/index.tsx`: public catalogue products are now rendered from the selected facility catalogue without inheriting the discovery query. An explicit product filter can be introduced in a later slice without coupling it to facility discovery.
- `scripts/omni-s1-s2-clickthrough.mjs`: waits for the MapLibre canvas and bounds callback before searching; uses a guaranteed deterministic fixture query; accepts `OMNI_BASE_URL` for local or deployed certification.

## Local certification result

The corrected local V2 preview passed at both required responsive widths:

| Viewport | Result facility | Catalogue product | MapLibre canvas | Horizontal overflow |
|---|---|---|---:|---:|
| 1280 × 900 | Marché central | Maïs en sac | 1 | No |
| 375 × 812 | Marché central | Maïs en sac | 1 | No |

The verified journey is: **search → result card → facility detail → public catalogue → product selection**.

## Production note

The deployed production URL was intentionally not treated as certified for this fix because it still serves the previous deployment bundle. The same script can be rerun after deployment with the default production URL; local certification confirms the source-level fix and the responsive flow independently.

## Next slice

Proceed to **S3 Availability**: selected catalogue product → availability request → three-step verification state machine, while preserving the rule that facility discovery queries and catalogue product selection remain separate concerns.

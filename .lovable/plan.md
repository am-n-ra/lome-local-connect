# OmniView v3 — Neon migration, FedaPay, and pre-listed facilities

## Two corrections before we start

1. **A map does not give us business listings.** The map (MapLibre) renders OpenStreetMap tiles — it draws streets and buildings, it does not hand us "all businesses in Google Maps". Pre-listing shops requires importing a business dataset. Two real options:
   - **OpenStreetMap / Overpass** — free, openly licensed (ODbL), we may store and display names, categories, coordinates, phone, opening hours. Coverage in Lomé is decent for markets, pharmacies, fuel, hardware, but thinner than Google.
   - **Google Places API** — better coverage, but paid and licence-restricted: Google forbids storing most Place data long-term or displaying it outside a Google map, so it cannot legally back a permanent "unclaimed listing" database.
   Recommendation: **OSM/Overpass import** as the acquisition seed, plus an admin screen so the team can add and edit listings by hand or by CSV.
2. **Credentials.** The Neon password was pasted in chat — rotate it in the Neon console once we are live; I will store the new one as a secret. The FedaPay application ID and secret key came through blank; I will request them through the secure secret form when we wire payments.

Note: I attempted to inspect the existing Neon database, but the connection timed out from the build sandbox. Verifying connectivity and reading the current schema is step 1 below — nothing in this plan assumes what those legacy tables contain, beyond your instruction to leave the Neon Auth tables untouched.

## Architecture after the migration

```text
Browser  ──►  TanStack server functions  ──►  Neon Postgres (pooled)
   │                    ▲
   └── Neon Auth JWT ───┘  verified server-side against the JWKS URL
```

- Lovable Cloud (database + auth) is retired. No RLS: every read and write goes through a server function that verifies the caller's Neon Auth token and enforces ownership in SQL. This is the biggest security change — the current app trusts the browser with direct table access.
- Sign-in, sign-up, and session handling move to Neon Auth. Existing Neon Auth users stay exactly as they are.
- All business tables are dropped and rebuilt to the v3 schema; the `neon_auth` schema is not touched.

## Phase 1 — Foundation

- Store `DATABASE_URL`, Neon Auth issuer and JWKS URL as secrets; add a pooled Postgres client for server functions.
- Rebuild the schema: `markets`, `profiles`, `facilities`, `products`, `offers`, `coupons`, `redemptions`, `transactions`, `carts`, `wishlists`, `user_interests`, `subscriptions`, `ad_campaigns`, `mobile_presence`, `certification_submissions`, `notifications`, `user_roles`, `audit_log`. Market-specific values (currency, payment provider, fee, certification rules) live in `markets`, never hardcoded.
- Facility lifecycle as four states, with who moves each one:
  - `non_reclame` — imported listing, nobody has claimed it. Created by the import job.
  - `non_confirme` — owner claimed it and filled the profile. Self-service.
  - `verifie` — admin/acquisition team checked identity or documents.
  - `confirme` — earned, never bought: proven by completed QR-authorised transactions from distinct buyers. Set by the system.
- Replace the auth layer: Neon Auth sign-in/sign-up pages, token attached to every server-function call, protected routes under `_authenticated`.
- Rewrite every existing screen's data access (map, facility sheet, cart, wishlist, vendor dashboard, panels) to call server functions instead of the browser database client.

## Phase 2 — Pre-listed facilities and acquisition

- Overpass import job: query Lomé by bounding box and category, upsert as `non_reclame` with source and source ID so re-runs do not duplicate.
- Map shows unclaimed listings in a muted style with a "Ce commerce n'est pas encore inscrit" badge and an "Est-ce votre commerce ?" claim CTA.
- Claim flow: signed-in user claims a listing, it becomes `non_confirme` and enters the admin review queue.
- Admin acquisition console: filter unclaimed listings by neighbourhood and category, mark contacted, record outcome, bulk CSV import and edit.

## Phase 3 — Payments (FedaPay)

- FedaPay card and mobile money checkout for ad-wallet top-ups and in-app purchases, via a server function that creates the transaction and a `/api/public/webhooks/fedapay` route that verifies the signature before crediting anything.
- Wallet, platform fee, and payout balances computed server-side from `transactions`; the "Mode démo" mock top-up is removed.
- QR-authorised transaction flow feeds the `confirme` promotion rule.

## Phase 4 — Admin, API, hardening

- Admin dashboard: overview metrics, facility moderation and state changes, certification submission review, wallet and payout adjustments with audit trail, demand insights.
- Public read-only endpoints under `/api/public/*` plus an OpenAPI document.
- Server-side validation on every write, rate limits on wishlist/cart, audit log, security review of the new no-RLS model.

## Not in this plan

The rest of PRD v3 — interest-based buyer onboarding, community channel per market, AI catalog import, self-service offers and mobile presence, seller payouts, self-service FAQ — depends on the foundation above. I will plan those as a second wave once Phase 1 lands, so we are not rewriting them mid-migration.

## Technical notes

- Postgres access uses `@neondatabase/serverless` over the pooled endpoint (the Cloudflare Worker runtime has no TCP pooling).
- Neon Auth tokens are verified with `jose` against the JWKS URL, cached in memory; `sub` becomes the app user ID and `profiles.id` references it.
- Seed data (market row, 12-15 Lomé facilities, demo vendor and buyer, transactions, coupons, mobile presence) ships as SQL in the rebuild migration.
- Money is stored in minor units as integers with the currency taken from the market row.

## Sequencing

Phase 1 is a single hard cutover and must land before anything else; then 2, 3, 4 in order.

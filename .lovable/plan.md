# OmniView — API, Admin, and Production Readiness

## Where the app stands today (verified)

- **Public API: none.** There is no `src/routes/api/` folder and no server functions anywhere in `src/`. All data access happens directly from the browser against the database (auto-generated REST via the backend Data API), protected only by row-level security.
- **API specification: none.** No OpenAPI/schema document exists in the repo.
- **Admin dashboard: none.** Routes are only `/`, `/auth`, `/carte`, `/fiche/$id`, `/vendeur`. There is no roles table either, so there is currently no way to designate an admin.
- **PRD coverage:** buyer map experience, vendor onboarding, products, ads, coupons, requests, demand signals, and wallet/Pro logic are implemented. Payments and push notifications are mocked as specified.
- **Production ready: not yet.** Missing pieces: no admin/moderation surface, no roles/permissions model, no server-side validation layer (all writes are client-issued), facility verification status can't be changed by anyone, no rate limiting on demand/wishlist writes, no API contract for third parties, and no monitoring of abusive listings.

## Proposed work

### 1. Roles and permissions
- Add an `app_role` enum (`admin`, `moderator`, `user`) and a separate `user_roles` table with a security-definer `has_role()` function.
- Add admin-scoped policies so admins can read/update facilities, products, coupons, and campaigns for moderation.

### 2. Admin dashboard (`/admin`, gated by role)
- Overview: counts of facilities, vendors, products, campaigns, redemptions, wishlist demand.
- Facilities table: search, filter by status, verify/unverify, suspend (force offline), delete.
- Products moderation: flag/remove stale or abusive listings.
- Campaigns & wallets: view spend, adjust/credit wallet balances with an audit trail.
- Demand insights: aggregated buyer search terms and unmet-demand heatmap by zone.

### 3. Server-side API layer
- Introduce `createServerFn` wrappers for sensitive operations (wallet debits, Pro tier changes, campaign creation, verification changes) so amounts and eligibility are computed on the server, not the client.
- Add public HTTP endpoints under `src/routes/api/public/` for external/partner consumption: facilities list, facility detail, products by facility, and a health check — read-only, no PII, Zod-validated query params.

### 4. API specification
- Publish an OpenAPI 3.1 document describing the public endpoints plus the row-level-security-backed data model, served at `/api/public/openapi.json` and documented in `docs/API.md`.

### 5. Production-readiness hardening
- Server-side validation on every write path (lengths, price ranges, coordinate bounds inside Togo).
- Rate limiting on wishlist/cart creation per user.
- Audit log table for admin actions.
- Security scan pass, backend linter pass, and confirmation that every public table has explicit grants.

## Technical notes

- Server logic uses `createServerFn` from `@tanstack/react-start`; external endpoints use file routes under `src/routes/api/public/*` with Zod validation.
- Admin routes live under `src/routes/_authenticated/admin/` and additionally check `has_role(auth.uid(), 'admin')` server-side — never client-only.
- Wallet mutations move behind an authenticated server function so the client can no longer set balances directly.
- The first admin is granted by a migration insert against a chosen account email.

## Sequencing

Roles + admin dashboard first (largest gap), then the server-side API layer for wallet/campaign safety, then the public API + OpenAPI spec, then hardening.

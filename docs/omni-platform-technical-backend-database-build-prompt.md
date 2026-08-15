# Omni Technical Backend & Database Build Prompt

## Mission

Implement the backend and database described in `docs/omni-platform-technical-backend-database-prd.md` in the existing Omni repository. Preserve React/TanStack Start server functions, Cloudflare Workers deployment, Neon PostgreSQL, Neon Auth/JWKS, MapLibre client integration, and the current migration runner.

This prompt governs schema, server contracts, migrations, background/import workflows, permissions, money/ledger safety, notifications, observability, and automated tests. The product/UI build prompt consumes these contracts and must not invent client-authoritative business rules.

## Hard constraints

- Neon PostgreSQL is the only database; Neon Auth is the only authentication system.
- Use the live Neon Auth JWKS JSON endpoint and preserve the authenticated subject/profile mapping.
- Do not introduce Supabase, another ORM/database, or an alternate auth flow.
- Do not let an LLM issue SQL or mutate production state directly.
- Never trust facility IDs, owner IDs, prices, balances, plan entitlements, inventory quantities, or transaction transitions from the client.
- Never commit `.env`, credentials, browser tokens, temporary test fixtures, or raw provider secrets.
- Seller wallet is platform balance only in this release. Do not expose seller withdrawals or in-app payout actions.
- Preserve unclaimed OSM discoverability while blocking seller control and purchase intent.
- Keep manual flows functional when AI flags are disabled.
- Use unique, deterministic migration numbers and inspect the live schema before applying each migration.

## Required pre-implementation audit

Before changing code:

1. Read both full-platform PRDs and the repository master/interface/build-plan documents.
2. Inspect `db/schema.sql`, all migrations, `src/lib/db.server.ts`, `auth-middleware.ts`, `neon-auth.server.ts`, `omni.config.ts`, search/index functions, OSM import code, vendor functions, demand/checkout/payment functions, and notification/audit helpers.
3. Build a table-by-table inventory of current columns, constraints, indexes, foreign keys, live row counts, duplicate/nullable risks, and consumers.
4. Build a server-function traceability matrix with function, caller, auth policy, ownership policy, plan gate, mutation tables, audit event, notification event, and test coverage.
5. Confirm no migration number conflict exists before writing new SQL.

## Implementation order

### Phase 1 — Runtime and contract foundations

Stabilize auth/session handling and error semantics. Ensure protected server functions obtain the correct Neon Auth subject and local profile ID, return explicit authorization errors, and include a correlation/request ID in logs. Establish domain error codes and shared validators for UUIDs, money amounts, UTC dates, statuses, and plan entitlements.

Add or standardize runtime configuration for:

- `aiAutomationEnabled` default false;
- `buyerAgentEnabled` default false;
- `sellerAgentEnabled` default false;
- `mediaUiEnabled` default false;
- `freeBuyerBulkLimit = 3`;
- `sellerFreeFacilityLimit = 1`;
- `sellerFreeProductLimit = 5`;
- configuration-driven plan price/renewal values;
- currency and market defaults.

### Phase 2 — Identity, companies, facilities, and claims

Add company and company-member tables if absent. Implement server functions for create company, invite/member role, switch active facility, claim facility, submit certification, review certification, and view facility provenance. Enforce owner/member/admin permissions.

Normalize facility state transitions. Keep OSM/public-source records unclaimed by default. Add source/provenance records and dedupe decision records. Ensure the purchase-intent server function rejects unclaimed facilities even if a malicious client submits the facility/product ID.

### Phase 3 — Catalogue and inventory foundation

Add the normalized company catalogue and facility override model while preserving compatibility with existing `products`. Decide the final table mapping after the audit; do not create two independent product truths.

Implement typed functions for:

- list company/facility catalogue;
- create/update/archive product or service;
- create/update/archive variant;
- attach/detach facility override;
- update price/status/category/description/SKU;
- compute effective buyer-visible product state;
- create inventory balance;
- receive stock;
- adjust stock with a reason;
- reserve stock;
- release reservation;
- fulfil/deduct stock;
- set low-stock threshold;
- confirm inventory freshness.

Every mutation verifies membership, plan capacity, status transition, allocation bounds, and concurrency. Inventory changes append an immutable movement record with actor, reason, source reference, and idempotency key. Effective Omni-visible quantity is calculated server-side from physical available quantity and allocation.

### Phase 4 — Offers and coupons

Extend offers/coupons with typed rule configuration. Implement rule validation and preview without consuming a coupon. Implement atomic redemption with row locking or a database transaction, including expiry, minimum order, scope, redemption cap, first-purchase, quantity, and discount calculation. Persist the exact price/offer/coupon snapshot on the order/transaction item.

### Phase 5 — Search, viewport, and OSM pipeline

Refactor search retrieval so the browser receives only relevant viewport/candidate records with stable pagination and result metadata. Backend clustering/deduplication is permitted for load reduction; do not require visual cluster bubbles.

Implement or harden OSM import jobs:

`queued → running → preview → approved → partially_applied/completed → failed`.

The job must extract/normalize/map categories, normalize geospatial fields, deduplicate, resolve facility/company identity, retain source attribution, and publish approved records to search. Import must be resumable, bounded, rate-limited, and auditable. Weaker source data cannot overwrite stronger verified data. A duplicate candidate must create a review decision instead of silently creating a second facility.

Expose boundary/geographic-stage metadata for the MapLibre staged reveal: continent/country/region/local-area identifiers, display names, highlight geometry references, and result framing coordinates. Keep geography data separate from facility search results.

### Phase 6 — Availability, demand, and notifications

Preserve the existing manual/bulk availability functions and make the server contract explicit. Validate manual facility target, bulk target set, quantity, product/service, mode, and quota. Keep budget in buyer-side ranking only. Record request/response events and create deep-linked notifications.

Implement seller manual response actions. Add semi-automatic preparation only when enabled; automatic response requires both seller rule and global AI flag. Ensure disabling AI does not affect manual request/response.

### Phase 7 — Commerce and transaction safety

Preserve the existing purchase-intent and transaction-event work. Audit all transitions and enforce:

`pending → qr_generated → qr_verified → payment_pending → paid → fulfillment → user_confirmed → completed`.

Seller QR redemption may only advance to `payment_pending`. Buyer confirmation is required for payment and receipt. Add idempotency keys, duplicate transition protection, expired/cancelled handling, and notifications. Preserve the unclaimed-facility check at the final server boundary.

### Phase 8 — Wallet, credits, and subscriptions

Keep `wallet_deposits` for FedaPay provider reconciliation. Add:

- `wallets` with owner/facility/company scope, currency, available/pending balances, and status;
- `wallet_transactions` as append-only typed ledger entries;
- `credits` and `credit_transactions` for subscription/AI/feature units;
- `ad_credits` for Pro promotional allocation;
- subscription renewal metadata and renewal-attempt records.

Implement typed functions for wallet summary, ledger pagination, create deposit, reconcile deposit, debit for campaign/feature/subscription, credit refund/adjustment, subscription renewal preview, toggle auto-renew, and forced downgrade/recovery. Deposits are idempotent by provider reference and webhook event. Pending deposits cannot be spent. Debits run atomically and reject insufficient available balance; no negative balances.

Do not implement seller withdrawals. If payout/commission data is required for transaction traceability, keep it informational and non-withdrawable.

### Phase 9 — Plans and feature gates

Implement a single entitlement resolver used by server functions and UI summaries. Enforce Free seller one-facility/five-product limits, Pro multiple facilities/expanded catalogue/bulk import, Buyer Free three bulk availability operations, and Agent/media flags. Return typed `PLAN_REQUIRED` details with the current limit and the capability unlocked by upgrade.

### Phase 10 — Notifications, analytics, and Agent contracts

Extend notifications with event type, structured payload, deep-link target, and essential/marketing classification. Add deterministic seller overview queries for sales, requests, revenue/payout informational totals, low stock, demand, campaigns, and ledger activity.

Add Agent tool definitions only after manual functions exist. Each tool must declare required role, plan, feature flag, input schema, preview/result schema, risk level, and confirmation requirement. Implement action records with proposed/awaiting_confirmation/approved/executing/completed/rejected/failed states. Enforce the global AI kill switch at both tool dispatch and UI-data response layers.

### Phase 11 — Tests and verification

Write server tests for every invariant. Use isolated/demo fixtures and clean them after tests. Never use real funds or production seller inventory in acceptance tests.

## Migration requirements

Every migration must:

1. Use a unique sequential filename.
2. Be additive or provide a safe compatibility path.
3. Define foreign keys, checks, unique/idempotency indexes, and query indexes.
4. Backfill existing rows with explicit defaults and a validation query.
5. Preserve old columns until all consumers migrate.
6. Be applied through `scripts/db-apply.ts` using the configured Neon database.
7. Record the resulting schema/version in the release notes.

Never silently rewrite existing transaction/identity history. If a data correction is required, write an explicit audited migration.

## Example contract requirements

### Catalogue mutation

Input must include a server-validated active company/facility context and product data. The server resolves membership, plan, current allocation, current state, and effective product. It returns the canonical row plus computed effective availability and an audit identifier. Errors must distinguish forbidden ownership from plan capacity and invalid state.

### Inventory adjustment

Input includes product/variant, signed quantity or target quantity, operation, reason, source reference, and idempotency key. The server locks the balance, verifies the resulting quantities, inserts the movement, updates the balance, and emits a low-stock event when appropriate. Replaying the same idempotency key returns the original result without a second movement.

### Wallet debit

Input includes wallet scope, amount, currency, reason, reference, and idempotency key. The server verifies available balance, locks the wallet, inserts the debit ledger entry, updates balance, and returns the resulting balance. A repeated key is a no-op/replay. A pending deposit is never included in spendable balance.

### Purchase intent

Input includes facility/product/quantity/offer/coupon context. The server verifies buyer authentication, facility ownership/status, product active state, effective allocation/stock, offer/coupon rules, and transaction eligibility. It creates the intent, transaction events, and notifications in one coherent transaction. Unclaimed facilities always fail.

## Security and operational controls

- Use strict ownership/company membership checks for every seller mutation.
- Use server-side plan and quota resolvers.
- Rate-limit imports, deposits, bulk availability, Agent tools, and claim attempts.
- Verify payment provider signatures/references and make webhook processing idempotent.
- Include request/correlation IDs in server logs and audit records.
- Avoid putting sensitive data in public search or marketing notifications.
- Store timestamps in UTC and display local time only at the UI edge.
- Add query indexes for facility ownership, viewport/geospatial retrieval, product publication, inventory movement, wallet ledger, transaction events, notifications, and import job state.
- Add safe timeout/retry/dead-letter behavior for OSM/import/background workflows.
- Keep error responses typed and observable; never convert authorization or SQL failures into empty result arrays.

## Verification commands and acceptance

At every bounded pull request run:

```bash
npx tsc --noEmit
npm run build
git diff --check
```

Run migration introspection and domain tests. Browser acceptance must cover unauthenticated/authenticated buyer search, MapLibre globe/reveal, OSM unclaimed facility, claimed facility, manual/bulk availability, purchase intent/QR/timeline, seller onboarding, Free/Pro gates, catalogue/inventory, wallet/deposit/ledger, subscription renewal/downgrade, notifications, and AI/media flag behavior.

Do not merge a slice if manual flows regress when AI is off, if a wallet can become negative, if a buyer can purchase from an unclaimed facility, if an import bypasses plan limits, or if a server authorization error appears as an empty success state.

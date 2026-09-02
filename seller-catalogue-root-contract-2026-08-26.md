# Omni V2 — Seller Catalogue Root Contract

**Structural path:** `product > Seller workspace > catalogue > offer CRUD`

## Scope

This branch manages products owned by facilities owned by the authenticated account. It does not manage public OSM discovery records, transaction QR tokens, Buyer-to-Seller payment, Seller payout or trust certification.

## Resource

A product contains `facilityId`, `name`, `description`, `category`, `unit`, `priceMinor`, `currency`, optional stock allocation, `discountKind`, `discountValueMinor`, `offerValidFrom` and `offerValidUntil`. `discountKind` is `percentage` or `fixed`. Every new draft must include a positive discount. The server derives the net price; the client never submits an authoritative net amount.

## Operations

| Operation | Route | Server gate |
|---|---|---|
| List owned products | `GET /api/v2/seller/catalogue` | Authenticated, non-suspended Seller-ready account; facility ownership enforced |
| Create draft | `POST /api/v2/seller/catalogue` | Authenticated owner, available/assigned Facility Slot, valid product and discount |
| Update draft/offer | `PATCH /api/v2/seller/catalogue/:id` | Product facility belongs to account; immutable transaction snapshots remain unchanged |
| Publish | `POST /api/v2/seller/catalogue/:id/publish` | Facility trust/publication gate, Free limit or active facility Pro entitlement, active discount |
| Archive | `POST /api/v2/seller/catalogue/:id/archive` | Facility ownership; historical transaction snapshots remain readable |

## Commercial rules

Free allows five published offers per facility after the applicable trust/publication gates. Active Seller Pro costs 10 USD per facility for 30 days or 100 USD for 12 months and removes the product-count limit for that facility. Facility Slots are account-scoped capacity; one account may manage several companies and facilities, while Pro is never inherited by another facility.

The user-facing price should be formatted from confirmed location context: XOF for Togo/Benin, GHS for Ghana and EUR for France where supported, with an explicit fallback. Stored price currency and display conversion must not be silently conflated. Until an FX source and policy are implemented, a product is published in its authoritative pricing currency and any alternate display must be labelled as a conversion.

## Idempotency and errors

Create, update, publish and archive require an idempotency key. A retry with the same key and identical payload returns the original result. Reuse with a different payload returns `CONFLICT`. Missing ownership returns `FORBIDDEN`; missing slot or Pro returns `ENTITLEMENT_REQUIRED`; missing/invalid discount returns `INVALID_INPUT`; stale publication state returns `STALE_STATE`.

## Acceptance

A Seller can list only owned products, create a draft with a mandatory reduction, edit it, publish within Free/Pro entitlement, archive it and recover after refresh. An account managing two facilities cannot use Facility A’s Pro entitlement to publish unlimited products on Facility B. A Buyer sees only published products with an active offer, while a transaction snapshot retains the original product name, price, discount and currency after later edits.

**Status:** `Root contract accepted; implementation next.`

# Omni V2 — Feature Inventory

**Document ID:** `OMNI-V2-FEATURES-002`
**Status:** Derived inventory from the rewritten Nature Way architecture
**Authority chain:** [`v2-seed.md`](./v2-seed.md) → [`v2-species.md`](./v2-species.md) → [`v2-roots.md`](./v2-roots.md) → [`v2-flow.md`](./v2-flow.md) → [`v2-plan.md`](./v2-plan.md)

> This is a feature inventory, not a second product master. If a feature conflicts with the Seed, Species, Root System or Flow, stop and reconcile the authority before implementation.

## 1. Feature rules

Every feature is a complete vertical slice at the depth its structure requires. Its implementation includes contract, data, server authority, UI, integration, hardening, proof and operations where applicable. A route, component, endpoint or database table alone is not a complete feature.

Statuses are `todo`, `ready`, `in_progress`, `blocked`, `review`, `verified`, `done`, `partial`, `deferred` and `manual`.

## 2. Species maquette and product foundation

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| SPEC-001 | Reference-faithful Canva buyer arrival frame | Species | `review` |
| SPEC-002 | Locked visual DNA: type, color, spacing, material and motion | Species | `review` |
| SPEC-003 | Complete S01–S17 screen/state maquette | Species | `review` |
| SPEC-004 | Responsive and accessibility inheritance matrix | Species | `review` |
| SPEC-005 | Nested mini-species decision register | Species | `todo` |

### Product foundation

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| FND-001 | Clean V2 application and repository boundary | Root System | `ready` |
| FND-002 | Environment, secrets and deployment contract | Root System | `ready` |
| FND-003 | Neon Auth identity linking and actor context | Root System | `ready` |
| FND-004 | Persistent map-first shell and surface state registry | Root System | `ready` |
| FND-005 | Typed browser/server boundary and result/error envelope | Root System | `ready` |
| FND-006 | Shared contextual sheet primitive | Species/Root System | `ready` |
| FND-007 | Correlation IDs, idempotency and audit foundation | Root System | `ready` |
| FND-008 | Fixture factory with real/bounded labels | Root System | `ready` |
| FND-009 | Responsive/accessibility proof harness | Species/Root System | `ready` |
| FND-010 | Migration preservation and recovery checks | Root System | `ready` |

## 3. Buyer Trunk

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| MAP-001 | MapLibre globe/map arrival surface | Trunk | `todo` |
| MAP-002 | Camera ownership and idle motion | Trunk | `todo` |
| MAP-003 | Public pins, stable identities and clustering | Trunk | `todo` |
| MAP-004 | Selected facility highlight and restoration | Trunk | `todo` |
| MAP-005 | Explicit location state machine | Trunk | `todo` |
| MAP-006 | Bounded public-source discovery adapter | Trunk | `todo` |
| MAP-007 | Bounds, timeout, antimeridian and fallback handling | Trunk | `todo` |
| SEARCH-001 | One search pill/dock | Trunk | `todo` |
| SEARCH-002 | One Options disclosure | Trunk | `todo` |
| SEARCH-003 | Category, radius, open, discount and sort options | Trunk | `todo` |
| SEARCH-004 | Quantity and unlimited/manual budget options | Trunk | `todo` |
| SEARCH-005 | Guarded Enter/button submission | Trunk | `todo` |
| SEARCH-006 | Search Auth gate with context restoration | Trunk | `todo` |
| SEARCH-007 | Search loading, reveal, empty, error, retry and cancel | Trunk/Heartwood | `todo` |
| FAC-001 | Product-first discovery card | Trunk | `todo` |
| FAC-002 | Public facility sheet | Trunk | `todo` |
| FAC-003 | Facility status/source/trust semantics | Trunk | `todo` |
| FAC-004 | Facility result restoration and back/close behavior | Trunk | `todo` |
| CAT-001 | Facility-scoped catalogue | Trunk | `todo` |
| CAT-002 | Matched product prioritization | Trunk | `todo` |
| CAT-003 | Product media, price, offer and quantity eligibility | Trunk | `todo` |
| CAT-004 | Catalogue empty, sold-out, closed and error states | Trunk/Heartwood | `todo` |
| CAT-005 | Typed ProductSelection without reservation | Trunk | `todo` |
| AVAIL-001 | Product → Scope → Constraints → Responses flow | Trunk | `todo` |
| AVAIL-002 | Authenticated availability request | Trunk | `todo` |
| AVAIL-003 | Free and Pro scope rules | Trunk | `todo` |
| AVAIL-004 | Availability freshness and non-reservation | Trunk | `todo` |
| AVAIL-005 | Available, partial, unavailable, stale, expired and corrected responses | Trunk | `todo` |
| AVAIL-006 | Availability timeout, empty, error, retry and cancel | Heartwood | `todo` |
| COMP-001 | Response comparison surface | Trunk | `todo` |
| COMP-002 | Eligible-response highlighting and intent lock | Trunk | `todo` |
| COMP-003 | Comparison stale/unavailable recovery | Heartwood | `todo` |

## 4. Facility trust and verification — Branch A

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| TRUST-001 | Seller verification education | Branch A | `todo` |
| TRUST-002 | Select unclaimed facility without changing status | Branch A | `todo` |
| TRUST-003 | Create new facility verification request | Branch A | `todo` |
| TRUST-004 | Verification draft/edit/cancel/resume | Branch A | `todo` |
| TRUST-005 | Identity, company/facility, product and location evidence | Branch A | `todo` |
| TRUST-006 | Idempotent evidence submission | Branch A | `todo` |
| TRUST-007 | Admin review queue | Branch A | `manual` |
| TRUST-008 | Audited certified/unconfirmed/rejected outcomes | Branch A | `manual` |
| TRUST-009 | Optional post-certification channel invitation | Branch A | `todo` |
| TRUST-010 | Exactly-once three-sale confirmation | Branch A | `todo` |
| TRUST-011 | Locked $20 facility bonus and three-sale unlock | Branch A | `todo` |
| TRUST-012 | Rejection reason and resubmission | Branch A | `todo` |
| TRUST-013 | Pro/trust separation and negative bypass tests | Branch A | `todo` |

## 5. Seller map-first operations — Branch B

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| SELL-001 | Seller map-first workspace | Branch B | `todo` |
| SELL-002 | Owned facility selection and context | Branch B | `todo` |
| SELL-003 | Facility open/closed, hours and discovery mode | Branch B | `todo` |
| SELL-004 | Demand/request queue | Branch B | `todo` |
| SELL-005 | Manual availability response | Branch B | `todo` |
| SELL-006 | Automatic response correction and buyer notification | Branch B | `todo` |
| SELL-007 | Product draft/create/edit/publish lifecycle | Branch B | `todo` |
| SELL-008 | Omni stock allocation validation | Branch B | `todo` |
| SELL-009 | Product empty/error/validation states | Branch B | `todo` |
| SELL-010 | Guided coupon creation form | Branch B | `todo` |
| SELL-011 | Coupon eligibility, dates, limits and server calculation | Branch B | `todo` |
| SELL-012 | Published active/no-discount offer state | Branch B | `todo` |
| SELL-013 | Facility-scoped Pro and catalogue limit display | Branch B | `todo` |
| SELL-014 | Real scanner entry surface | Branch B | `todo` |
| SELL-015 | Seller account surface with only real actions | Branch B | `todo` |

## 6. Omni Wallet and entitlements — Branch C

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| WAL-001 | Single Omni Wallet surface and copy | Branch C | `todo` |
| WAL-002 | FedaPay recharge-only boundary | Branch C | `todo` |
| WAL-003 | Pending/confirmed/failed/cancelled/expired recharge states | Branch C | `todo` |
| WAL-004 | Append-only wallet ledger and balance derivation | Branch C | `todo` |
| WAL-005 | Ledger reconciliation and anomaly handling | Branch C | `todo` |
| WAL-006 | Facility Slot purchase/spend | Branch C | `todo` |
| WAL-007 | Facility Pro activation/expiry | Branch C | `todo` |
| WAL-008 | Platform spend for Pro, slots, ads and coupon credits | Branch C | `todo` |
| WAL-009 | Insufficient/restricted spend recovery | Branch C | `todo` |
| WAL-010 | Facility bonus platform-credit unlock | Branch C | `todo` |
| WAL-011 | No withdrawal, payout or buyer-seller transfer surface | Branch C | `todo` |

## 7. Intent and transaction room — Branch D

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| TXN-001 | Eligibility-gated intent CTA | Branch D | `todo` |
| TXN-002 | Idempotent and concurrency-safe intent creation | Branch D | `todo` |
| TXN-003 | Immutable product/facility/price/coupon snapshot | Branch D | `todo` |
| TXN-004 | Private contact and itinerary unlock | Branch D | `todo` |
| TXN-005 | One authorized transaction room | Branch D | `todo` |
| TXN-006 | Canonical named transaction timeline | Branch D | `todo` |
| TXN-007 | Actor-specific next action | Branch D | `todo` |
| TXN-008 | Transaction-scoped chat | Branch D | `todo` |
| TXN-009 | Server-generated system events and messages | Branch D | `todo` |
| TXN-010 | Transaction resume and deep link | Branch D | `todo` |
| TXN-011 | Resume bar for incomplete transactions | Branch D | `todo` |
| TXN-012 | Intent expiry, unavailable-offer and error recovery | Branch D | `todo` |

## 8. QR, external handoff and fulfilment — Branch E

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| QR-001 | Transaction-bound buyer QR | Branch E | `todo` |
| QR-002 | Visible QR expiry and regeneration | Branch E | `todo` |
| QR-003 | Replay-safe server verification | Branch E | `todo` |
| QR-004 | Seller scanner-ready state | Branch E | `todo` |
| QR-005 | Explicit secure-origin camera permission | Branch E | `todo` |
| QR-006 | Mounted live preview and stream lifecycle | Branch E | `todo` |
| QR-007 | QR detection and single-stop lifecycle | Branch E | `todo` |
| QR-008 | Manual code fallback | Branch E | `todo` |
| QR-009 | Expired, replayed, mismatch and malformed states | Branch E | `todo` |
| PAY-001 | External payment method selection | Branch E | `todo` |
| PAY-002 | Buyer payment declaration | Branch E | `todo` |
| PAY-003 | Seller payment acknowledgement/dispute | Branch E | `todo` |
| FUL-001 | Pickup and delivery fulfilment states | Branch E | `todo` |
| FUL-002 | Buyer receipt confirmation | Branch E | `todo` |
| FUL-003 | Rating after receipt | Branch E | `todo` |
| FUL-004 | Transaction close after rating or approved skip | Branch E | `todo` |

## 9. Resume, notifications and PWA — Branch F

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| SYS-001 | PWA manifest, icons and install metadata | Branch F | `todo` |
| SYS-002 | Service-worker and offline policy | Branch F | `todo` |
| SYS-003 | Auth restoration and safe sign-out | Branch F | `todo` |
| SYS-004 | Transactional notifications and deep links | Branch F | `todo` |
| SYS-005 | Mobile viewport, safe-area and focus behavior | Branch F | `todo` |
| SYS-006 | Public context restoration after relaunch | Branch F | `todo` |

## 10. Admin, analytics and operations — Branch G

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| OPS-001 | Admin evidence queue and audit history | Branch G | `manual` |
| OPS-002 | Controlled trust outcome operations | Branch G | `manual` |
| OPS-003 | Bounded public-source import and recovery | Branch G | `manual` |
| OPS-004 | Consent-aware analytics schema | Branch G | `todo` |
| OPS-005 | Discovery/search funnel metrics | Branch G | `todo` |
| OPS-006 | Availability and comparison metrics | Branch G | `todo` |
| OPS-007 | Transaction, QR, fulfilment and rating metrics | Branch G | `todo` |
| OPS-008 | Seller activation and three-sale metrics | Branch G | `todo` |
| OPS-009 | Wallet and entitlement integrity metrics | Branch G | `todo` |
| OPS-010 | Recovery, permission, expiry and duplicate metrics | Branch G | `todo` |
| OPS-011 | Error, latency and availability observability | Branch G | `todo` |
| OPS-012 | Manual runbooks and support context | Branch G | `manual` |

## 11. Canopy and release certification

| ID | Feature | Parent phase | Initial status |
|---|---|---|---|
| QUAL-001 | Species consistency audit across every surface | Canopy | `todo` |
| QUAL-002 | Four-width responsive certification | Canopy | `todo` |
| QUAL-003 | Accessibility and reduced-motion certification | Canopy | `todo` |
| QUAL-004 | Performance, map and bundle audit | Canopy | `todo` |
| QUAL-005 | Dead-action and false-state audit | Canopy | `todo` |
| QUAL-006 | Security, secret and browser-boundary audit | Canopy | `todo` |
| REL-001 | Buyer release gate | Rings | `todo` |
| REL-002 | Seller release gate | Rings | `todo` |
| REL-003 | Trust release gate | Rings | `todo` |
| REL-004 | Wallet and money release gate | Rings | `todo` |
| REL-005 | Transaction and QR release gate | Rings | `todo` |
| REL-006 | Recovery and observability release gate | Rings | `todo` |
| REL-007 | Rollback and acceptance record | Rings | `todo` |

## 12. Deferred and manual boundaries

| ID | Capability | Status | Boundary |
|---|---|---|---|
| DFR-001 | AI orchestration that mutates business state | `deferred` | Manual loops must be proven and measured before AI-driven mutations or assistants. |
| DFR-002 | Native mobile applications | `deferred` | Revisit after PWA production verification. |
| DFR-003 | Buyer-seller in-app payments | `deferred` | Omni records external payment declarations only. |
| DFR-004 | Seller withdrawal and payout | `deferred` | No payout rail or withdrawal UI/API. |
| DFR-005 | Instant unrestricted global prepopulation | `deferred` | No unrestricted global coverage promise. |
| MAN-001 | Bounded public-source backfill | `manual` | Requires operator, source evidence, dedupe, observability and recovery. |
| MAN-002 | Admin evidence review | `manual` | Human review remains the authority until automation is separately proven. |

## 13. Completion rule

Every feature must map to one or more states in `v2-flow.md`, one or more requirements in `v2-seed.md`, an authority boundary, a Species treatment, a failure/recovery path and a testable acceptance criterion. No implementation task may introduce a product decision only in a downstream prompt.

A feature may move to `verified` only when its stated proof exists. It may move to `done` only when the parent branch gate is accepted. A `manual` feature must name its operator and runbook. A `partial` feature must state its missing evidence or implementation. A `deferred` feature must not appear as an active user-facing action.

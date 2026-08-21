# Omni V2 — Feature List

**Document ID:** `OMNI-V2-FEATURES-001`
**Version:** 1.0.0
**Status:** Derived baseline for implementation planning
**Canonical sources:** [`v2-flow.md`](./v2-flow.md) and [`omni-v2-prd.md`](./omni-v2-prd.md)

> This is the third canonical V2 document. It translates the approved product requirements and flow states into a complete feature inventory. It does not introduce new product decisions, implementation architecture or UI styling. Any conflict must be resolved in `v2-flow.md` or `omni-v2-prd.md` first.

## 1. Product and platform foundation

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| FND-001 | Clean-slate V2 product boundary | Build now | V2 is implemented independently from V1 code, migrations, data and production runtime. |
| FND-002 | Map-first application shell | Build now | Map remains mounted while dock, result, facility, catalogue, availability, comparison and transaction surfaces change state. |
| FND-003 | Shared Omni sheet primitive | Build now | Mobile bottom sheet and desktop bounded sheet share loading, ready, empty, error, retry, close, back, scroll and footer behavior. |
| FND-004 | Typed surface/state registry | Build now | Every visible route, menu action and sheet action resolves to a valid state or an explicitly manual operation. |
| FND-005 | Server-authoritative transition boundary | Build now | Client text, prices, statuses, QR values and availability cannot mutate or advance protected business state. |
| FND-006 | Idempotency and audit foundation | Build now | Mutating actions accept idempotency keys where required and produce authoritative audit events. |

## 2. Public map and geographic discovery

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| MAP-001 | Live MapLibre globe/map | Build now | Real MapLibre globe is the primary surface, not a decorative substitute or ecommerce grid. |
| MAP-002 | Idle globe rotation | Build now | Resting globe rotates slowly; search focus and manual interaction pause rotation. |
| MAP-003 | Camera priority rules | Build now | Manual interaction outranks selected facility focus, search reveal, result framing and idle rotation. |
| MAP-004 | Visible-bounds discovery | Build now | Client sends the visible map bounding box; server returns only source-backed facilities within authoritative scope. |
| MAP-005 | Geographic source adapter | Build-manual | OSM/Overpass or another approved public source can backfill bounded empty areas with owner, evidence and recovery procedure. |
| MAP-006 | Source-backed facility pins | Build now | Only facilities with public source evidence appear as pins; public presence never implies inventory or certification. |
| MAP-007 | Low-zoom clustering | Build now | Global/regional scale groups facilities into clusters; local zoom reveals individual pins. |
| MAP-008 | Selected facility focus | Build now | Selecting a pin or card highlights the facility without destroying the result set or map context. |
| MAP-009 | Location permission flow | Build now | Exact, approximate, denied, timeout and fallback-market states are distinct and non-blocking. |
| MAP-010 | Location marker truth | Build now | Blue exact marker appears only for a fresh acceptable browser fix; approximate location is never labelled exact. |
| MAP-011 | Recenter control | Build now | User can explicitly recenter without forced search or silent camera takeover. |
| MAP-012 | Map controls and rotation toggle | Build now | Zoom, recenter and rotation controls remain reachable and do not overlap dock or sheets. |
| MAP-013 | Geographic highlight discipline | Build now | Boundary highlight appears only when a matching geographic asset exists; no false boundary is invented. |
| MAP-014 | Public map attribution | Build now | Any external geographic data provider is visibly attributed without being hidden by Omni surfaces. |

## 3. Buyer search and discovery

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| BUY-001 | Visitor public entry | Build now | Visitor can understand the globe, search and public discovery without creating an account first. |
| BUY-002 | Single search dock | Build now | One search row and one Options chevron are the primary discovery controls. |
| BUY-003 | Catalogue-aware search intent | Build now | Existing catalogue products are selectable; buyers are not forced to invent a product name. |
| BUY-004 | Search options surface | Build now | Categories, open-now, radius, discounts, sorting, quantity, budget, location mode and retry actions live behind the Options surface. |
| BUY-005 | Editable quantity | Build now | Quantity is hidden until relevant, manually editable and never silently changed by typing. |
| BUY-006 | Unlimited/manual budget | Build now | Budget may be unlimited and is manually editable; it does not create a separate search view. |
| BUY-007 | Guarded submit parity | Build now | Enter and the search button use the same guarded submission path. |
| BUY-008 | Search loading/reveal | Build now | Search shows bounded progress, preserves the map and supports cancellation/manual interruption. |
| BUY-009 | Search empty state | Build now | Empty results explain scope and offer retry, scope adjustment or return without fabricated pins. |
| BUY-010 | Search error recovery | Build now | Timeout/network/server error preserves query and options and exposes a retry. |
| BUY-011 | Responsive result rail/cards | Build now | Result cards are fully visible at 320, 375, 768 and 1280 px without inaccessible horizontal overflow. |
| BUY-012 | Product-first result card | Build now | Card shows matched product first, media, facility identity, status/trust, distance, price/offer, product count and one next action. |
| BUY-013 | Facility-only selection | Build now | Clicking a result selects a facility only; it cannot claim, request availability or create intent. |
| BUY-014 | Facility result restoration | Build now | Closing/reopening a card or facility sheet preserves result set, selected state and map context. |

## 4. Facility, catalogue and availability

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| CAT-001 | Public facility detail | Build now | Sheet shows identity, media, search context, status/trust, address, public hours/open state and product count. |
| CAT-002 | Facility status-specific actions | Build now | Unclaimed, certified, unconfirmed, confirmed and unavailable states expose only permitted actions. |
| CAT-003 | Public catalogue loading | Build now | Active products load for the selected facility with explicit loading, retry and error states. |
| CAT-004 | Matched-product prioritization | Build now | Product matching the search intent appears first when available. |
| CAT-005 | Product media and offer display | Build now | Product shows photo/media, name, price, offer/discount state and quantity eligibility. |
| CAT-006 | Catalogue empty/sold-out/closed states | Build now | Empty, sold-out, closed and unavailable states are explicit and recoverable. |
| CAT-007 | Typed product selection | Build now | Selection returns a typed product identity to availability; selection alone never creates demand. |
| CAT-008 | Four-stage availability flow | Build now | Flow is visibly named `Produit → Portée → Contraintes → Réponses`. |
| CAT-009 | Free single-facility scope | Build now | Free availability targets one eligible facility under server enforcement. |
| CAT-010 | Pro bounded bulk scope | Build now | Pro bulk availability is bounded by visible facilities and server entitlement. |
| CAT-011 | Availability constraints | Build now | Quantity and private budget remain editable; budget may be unlimited and editing does not move the map. |
| CAT-012 | Availability response ordering | Build now | Responses are ordered `available → partial → unavailable`, then price. |
| CAT-013 | Availability response detail | Build now | Response shows facility, product, freshness, quantity, price, offer and seller message. |
| CAT-014 | Comparison surface | Build now | Real responses can be compared; best eligible response may be highlighted; comparison does not unlock contact. |
| CAT-015 | Availability recovery | Build now | No responses, timeout, entitlement failure and server error have explicit recovery and preserved inputs. |

## 5. Seller onboarding and facility trust

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| TRUST-001 | Seller entry and education | Build now | Seller understands the map-first workspace, verification, catalogue and operational next steps. |
| TRUST-002 | Unclaimed facility selection | Build now | Seller may select a public unclaimed facility without changing its status. |
| TRUST-003 | New facility creation request | Build now | Seller may create a facility verification request; creation is not automatic certification. |
| TRUST-004 | Verification request lifecycle | Build now | `unclaimed → verification_requested → evidence_draft → evidence_submitted → admin_review`. |
| TRUST-005 | Evidence collection | Build now | Evidence supports identity, company/facility, product/article and location/facility proof. |
| TRUST-006 | Evidence draft persistence | Build now | Draft evidence persists, can be edited/cancelled and submission is idempotent. |
| TRUST-007 | Admin evidence queue | Build-manual | Admin sees claimant, facility, evidence stages and audit context in a review queue. |
| TRUST-008 | Audited review outcomes | Build-manual | Admin can produce explicit `certified`, `unconfirmed` or `rejected` outcomes with actor, reason, timestamp and evidence reference. |
| TRUST-009 | Certification-to-unconfirmed onboarding | Build now | Certified facilities can enter operational unconfirmed onboarding; optional channel membership is clearly optional. |
| TRUST-010 | Three-sale confirmation | Build now | Three eligible completed Omni sales transition an unconfirmed facility to confirmed. |
| TRUST-011 | Locked $20 seller bonus | Build now | $20 non-cash platform credit is communicated early but unlocks only after three qualifying completed sales. |
| TRUST-012 | Trust/entitlement separation | Build now | Pro access or payment cannot silently bypass evidence review or fabricate certification. |
| TRUST-013 | Rejection and resubmission | Build now | Rejected evidence shows reason and supports a new request or draft according to audit policy. |

## 6. Seller map-first workspace

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| SELL-001 | Seller map workspace | Build now | Authenticated seller lands on owned facilities and operational map context, not a generic dashboard. |
| SELL-002 | Facility operations surface | Build now | Seller can inspect eligible owned facility, open/closed state, hours and operational discovery state. |
| SELL-003 | Demand/request queue | Build now | Seller receives availability requests, sees response status and can answer or correct within authority. |
| SELL-004 | Automatic-response correction | Build now | Seller can correct a server-generated response with explicit auditability and buyer notification. |
| SELL-005 | Product catalogue management | Build now | Seller creates, edits, validates, publishes and marks products sold out with server checks. |
| SELL-006 | Omni stock allocation | Build now | Quantity allocated to Omni cannot exceed real stock. |
| SELL-007 | Product draft lifecycle | Build now | `draft → pending_validation → published` with field-level error recovery. |
| SELL-008 | Coupon creation | Build now | Seller can create a coupon through a clear guided form; eligibility and redemption are server-authoritative. |
| SELL-009 | Product offer state | Build now | Published product shows active offer/coupon or honest `Aucune remise active`. |
| SELL-010 | Coupon transaction snapshot | Build now | Completed transaction retains the coupon outcome and client cannot rewrite it. |
| SELL-011 | QR scanner entry | Build now | Seller can enter scanner flow from the map-first workspace. |
| SELL-012 | Seller account surface | Build now | Wallet, subscription and settings appear only when their callbacks and permissions are real. |
| SELL-013 | Seller operational discovery mode | Build now | Seller can expose valid open/closed and discovery state under server policy. |
| SELL-014 | Seller advertisements | Build now | Advertising controls appear only when implemented, authorized and funded. |

## 7. Purchase intent and transaction room

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| TXN-001 | Eligibility-gated intent CTA | Build now | Only an eligible comparison response exposes `Je veux acheter`. |
| TXN-002 | Idempotent purchase intent | Build now | Repeated submit returns one existing transaction context, never duplicate transactions. |
| TXN-003 | Immutable transaction snapshot | Build now | Product, facility, quantity, price, coupon and net amount are server-snapshotted. |
| TXN-004 | Protected data unlock boundary | Build now | Contact, itinerary, private chat, QR and sensitive seller data remain locked until intent transition. |
| TXN-005 | Single authorized transaction room | Build now | One scoped room owns product, facility, amount, QR, next action, timeline and messages. |
| TXN-006 | Canonical transaction timeline | Build now | Timeline names intention, offer, coupon, QR, verification, payment method, payment, fulfilment, receipt, rating and completion. |
| TXN-007 | Actor-specific next action | Build now | Buyer and seller see only the valid action for current persisted state. |
| TXN-008 | Transaction chat authorization | Build now | Messages are allowed only for authorized participants in that transaction. |
| TXN-009 | System event messages | Build now | State-changing system messages originate from server events, not client text. |
| TXN-010 | Transaction resume | Build now | Closing and reopening from menu, notifications or orders restores exact incomplete transaction context. |
| TXN-011 | Resume bar | Build now | Incomplete transaction creates a visible bar that deep-links to the exact room. |
| TXN-012 | Intent expiry/error recovery | Build now | Expired response, server error and unavailable offer preserve safe context and offer refresh/retry. |

## 8. QR, external payment and fulfilment

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| QR-001 | Buyer QR generation | Build now | QR is generated only at the approved intent/transaction point. |
| QR-002 | QR expiry | Build now | QR expires visibly and cannot be used after expiry. |
| QR-003 | QR replay protection | Build now | Replayed QR is rejected or idempotently recognized according to server state. |
| QR-004 | Seller scanner-ready state | Build now | Seller sees a pre-scan interface before requesting camera permission. |
| QR-005 | Camera permission CTA | Build now | Permission is requested only from an explicit CTA on a secure top-level origin. |
| QR-006 | Live camera preview | Build now | Granted permission produces a mounted video preview with live tracks and non-zero dimensions. |
| QR-007 | BarcodeDetector decode | Build now | Supported browsers decode valid QR and stop/submit safely. |
| QR-008 | Manual QR fallback | Build now | Denied, unsupported, malformed or failed camera states provide manual code entry. |
| QR-009 | QR mismatch states | Build now | Expired, replayed, wrong transaction and malformed codes show distinct recovery. |
| PAY-001 | External payment method selection | Build now | Buyer selects cash on delivery, TMoney, Flooz or another supported external method. |
| PAY-002 | Buyer payment declaration | Build now | Buyer declares payment without Omni processing the buyer-seller payment. |
| PAY-003 | Seller payment confirmation | Build now | Seller confirms, rejects or leaves payment pending with visible next action. |
| PAY-004 | Fulfilment workflow | Build now | Seller marks delivered/ready and fulfilled; pickup/delivery context remains explicit. |
| PAY-005 | Buyer receipt confirmation | Build now | Buyer confirms receipt only after fulfilment state. |
| PAY-006 | Rating and completion | Build now | Buyer rates after receipt; server then closes the transaction. |
| PAY-007 | No payout/withdrawal | Build now | Seller withdrawal and buyer-seller in-app payment are absent from UI and API. |

## 9. Omni Wallet and monetization

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| WAL-001 | Single Omni Wallet | Build now | Product consistently explains one rechargeable wallet for platform consumption. |
| WAL-002 | FedaPay recharge | Build now | FedaPay is used only to recharge Omni Wallet. |
| WAL-003 | Recharge pending/confirmed/failed | Build now | Server callback determines spendable balance; pending funds are not spendable. |
| WAL-004 | Wallet ledger | Build now | Recharge and spend events are server-confirmed, auditable and balanced. |
| WAL-005 | Platform spending | Build now | Wallet can fund subscription, Pro, advertising, coupon/ad credit and eligible platform features. |
| WAL-006 | Spend blocking | Build now | Insufficient, restricted or unconfirmed balance shows explanation and retry path. |
| WAL-007 | Free/Pro entitlements | Build now | Free/Pro limits and bulk availability are server-enforced and separate from trust status. |
| WAL-008 | Seller bonus credit | Build now | Locked/unlocked $20 credit is non-cash, non-withdrawable and usable only for eligible platform consumption. |
| WAL-009 | No payout surface | Build now | No seller payout, withdrawal or buyer-seller wallet transfer is exposed. |

## 10. Authentication, notifications, PWA and accessibility

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| SYS-001 | Protected-action authentication | Build now | Visitor is asked to create/access an account only when a protected action requires it. |
| SYS-002 | Auth context restoration | Build now | Query, filters, quantity, budget, location, facility, product, request and return route survive auth redirect. |
| SYS-003 | Sign-out privacy reset | Build now | Sign-out clears private context while preserving safe public state where allowed. |
| SYS-004 | Transactional notifications | Build now | Availability, response, intent, QR, payment, fulfilment, certification and account notifications deep-link to valid context. |
| SYS-005 | Notification recovery | Build now | Missing/expired notification context opens safe recovery instead of a dead route. |
| SYS-006 | PWA installability | Build now | Manifest, service worker, icons, install prompt and relaunch behavior work on supported mobile browsers. |
| SYS-007 | PWA network policy | Build now | Public context may cache; availability, wallet, QR, payment and transaction completion require visible connectivity. |
| SYS-008 | Responsive safe-area layout | Build now | Dynamic viewport and safe-area handling work at 320, 375, 768 and desktop widths. |
| SYS-009 | Focus and keyboard preservation | Build now | Search focus, keyboard entry, Escape/back and sheet transitions do not unexpectedly move or lose context. |
| SYS-010 | Accessible state communication | Build now | Loading, error, permission, empty, locked and next-action states are announced and keyboard reachable. |

## 11. Admin, analytics and operations

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| ADM-001 | Evidence review queue | Build-manual | Admin can inspect pending verification requests and evidence context. |
| ADM-002 | Audited outcome record | Build-manual | Every outcome records actor, reason, timestamp, evidence reference and previous state. |
| ADM-003 | Controlled trust data | Build-manual | Admin cannot bypass the review contract through an uncontrolled generic status mutation. |
| ADM-004 | Discovery observability | Build-manual | OSM/Overpass backfill has import status, dedupe metrics, failure visibility and operator recovery. |
| ADM-005 | Privacy-safe analytics | Build now | Events are consent-aware, minimized and pseudonymous; raw secrets are never collected. |
| ADM-006 | Search funnel events | Build now | Instrument arrival, search submit, result, facility, catalogue, product and availability transitions. |
| ADM-007 | Availability events | Build now | Instrument scope, constraints, responses, freshness and comparison outcomes. |
| ADM-008 | Transaction events | Build now | Instrument intent, QR, payment declaration, fulfilment, receipt, rating and completion. |
| ADM-009 | Seller activation metrics | Build now | Instrument verification, product publication, first request and completed sales. |
| ADM-010 | Wallet integrity metrics | Build now | Instrument recharge callback, spend ledger and available/pending/restricted balances. |
| ADM-011 | Recovery and error metrics | Build now | Instrument retries, empty states, permission denial, expiry, replay and duplicate prevention. |
| ADM-012 | Release observability | Build now | Production errors, latency, availability and critical flow completion are inspectable without exposing private data. |

## 12. Cross-cutting failure and security features

| ID | Feature | Status | Definition of done |
|---|---|---|---|
| SEC-001 | Honest loading states | Build now | Every asynchronous surface preserves context and exposes bounded progress. |
| SEC-002 | Honest empty/unavailable states | Build now | No source-backed result, product or response is fabricated. |
| SEC-003 | Retry and cancellation | Build now | Each critical async state has a safe retry, back or cancellation path. |
| SEC-004 | Duplicate mutation handling | Build now | Duplicate submit returns authoritative existing result or explicit rejection. |
| SEC-005 | Expiry handling | Build now | Expired responses, intents and QR codes block sensitive continuation and offer refresh. |
| SEC-006 | Unauthorized-route handling | Build now | Private routes require auth/role and preserve safe context. |
| SEC-007 | Offline mutation blocking | Build now | Wallet, QR, payment and transaction mutations never appear complete offline. |
| SEC-008 | Server-side business enforcement | Build now | Database constraints and server checks enforce stock, entitlement, money, status, role, QR and transaction rules. |
| SEC-009 | Client/server boundary | Build now | Client code cannot import server-only modules, secrets, database drivers or private credentials. |
| SEC-010 | No deferred/fake controls | Build now | Deferred features do not appear as disabled, fake or dead buttons. |

## 13. Deferred and manual boundaries

| ID | Capability | Status | Boundary |
|---|---|---|---|
| DFR-001 | AI orchestration | Deferred | Manual loops must be proven and measured before AI-driven mutations or assistants. |
| DFR-002 | Native mobile apps | Deferred | Revisit after PWA production verification. |
| DFR-003 | Buyer-seller in-app payments | Deferred/not in V1 | Omni records external payment declarations only. |
| DFR-004 | Seller withdrawal/payout | Deferred/not in V1 | No payout rail or withdrawal UI/API. |
| DFR-005 | Instant global prepopulation | Deferred | No unrestricted global coverage promise. |
| MAN-001 | OSM/Overpass backfill | Build-manual | Bounded import requires an operator, evidence, dedupe, observability and recovery. |
| MAN-002 | Admin evidence review | Build-manual | Human review remains the authority until automation is separately proven. |

## 14. Feature inventory rules

Every feature must map to one or more states in `v2-flow.md`, one or more requirements in `omni-v2-prd.md`, an authority boundary, a failure/recovery path and a testable acceptance criterion. No implementation task may introduce a feature decision only in a downstream build prompt. The two source documents remain authoritative; this document is the complete derived inventory for backlog and vertical-slice planning.

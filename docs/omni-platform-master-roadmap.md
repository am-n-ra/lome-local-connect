# Omni Full-Platform Master Roadmap

**Baseline:** Current merged `main` branch and the evidence-backed partial implementation.

**Purpose:** Coordinate product/UX and backend/database delivery into a coherent Omni platform rather than a collection of disconnected feature projects.

## 1. North-star architecture

Omni is delivered as one stateful spatial system:

`World → Map/Globe → Search → Facilities → Products/Services/Content → Demand → Availability → Compare/Recommend → Purchase Intent → QR → Transaction → Fulfilment → Data.`

The product/UI workstream defines how the user experiences each state. The backend/database workstream defines the authoritative data, permissions, transitions, and auditability behind each state. Neither workstream may bypass the other.

## 2. Delivery principles

1. **Map first.** The buyer opens directly into the MapLibre globe/map. Seller operations are also anchored on the seller’s map and facilities.
2. **Manual before Agent.** All Agent capabilities must call already-working manual business actions.
3. **Server authoritative.** Plans, ownership, facilities, inventory, wallet, coupons, and transactions are enforced server-side.
4. **Unclaimed remains discoverable.** OSM facilities are visible and attributable but non-purchasable until claimed/authorized.
5. **No hidden limits.** Free/Pro boundaries are visible before blocked actions and explained in user language.
6. **No seller withdrawals initially.** Wallet supports platform deposits, subscriptions, credits, advertising, and paid Omni services; withdrawals are deferred.
7. **No visual cluster bubbles by default.** Backend viewport limiting/deduplication protects performance while the visual result remains individual pins/cards.
8. **AI is feature-flagged and kill-switchable.** Production default is manual-first with AI disabled until safety and parity gates pass.
9. **Release in vertical slices.** Each slice includes schema/server/UI/tests/browser acceptance and can be merged independently.

## 3. Workstreams

| Workstream | Primary artifact | Owns |
|---|---|---|
| Product/UI | `omni-platform-product-ux-prd.md` and build prompt | Personas, journeys, map/globe, panels, design system, responsive behavior, copy, user-visible states, UI acceptance |
| Technical | `omni-platform-technical-backend-database-prd.md` and build prompt | Schema, migrations, server functions, state machines, permissions, OSM jobs, search, wallet, plans, notifications, security, tests |
| Integrated governance | This roadmap | Dependencies, release order, decision gates, regression requirements, pull-request boundaries |

## 4. Phase plan

### Phase 0 — Source of truth and documentation

**Objective:** Establish the complete implementation contract.

**Deliverables:** Five platform documents, traceability matrix, shared glossary/state machines, current-state gap map, open decisions.

**Inputs:** Master specification, interface specification, existing build plan, internal lot plan, current code/schema, acceptance records, merged Git history.

**Exit criteria:** Product/UI PRD and technical PRD agree on entity names, state transitions, Free/Pro gates, MapLibre behavior, OSM unclaimed semantics, wallet scope, Agent defaults, and acceptance scenarios.

### Phase 1 — Platform foundations

**Objective:** Make the application shell, auth, configuration, design tokens, and tests reliable.

**Product/UI work:** Consolidate stateful buyer/seller shells, shared glass components, map overlay behavior, loading/error/empty states, responsive foundations, and feature-flag visibility.

**Technical work:** Stabilize Neon Auth/JWKS session propagation, domain errors, runtime config, audit conventions, notification event vocabulary, migration validation, correlation IDs, and test fixture utilities.

**Dependencies:** None beyond current repository baseline.

**Exit criteria:** Protected calls no longer mask authorization errors; map and panels remain mounted coherently; feature flags can disable AI/media without disabling manual operations.

### Phase 2 — Map, location, discovery, and facilities

**Objective:** Correct the first-arrival experience and deliver trustworthy, populated global discovery before expanding seller operations.

**Immediate correction gate:** Explicit non-blocking location permission, truthful market fallback, real user marker only after browser success, human-like horizontal center/longitude rotation, sparse real facility discovery at rest, no default country/city label wall, search-only staged reveal, black/near-black active boundaries, a warm cream/white spatial field with soft desaturated water, and a stable named-row dock layout with mutually exclusive request/result surfaces and measured responsive clearance.

**Product/UI work:** Real MapLibre globe, horizontal resting rotation, location states, resting discovery points, manual navigation, search-only geographic reveal with pauses/highlights, user location, search framing, bottom dock, result cards, native pins, OSM provenance, unclaimed status, claim CTA, claimed/certified detail states, buyer preview.

**Technical work:** Boundary/stage metadata, explicit location source in search context, viewport candidate retrieval, public resting discovery feed, facility/source/claim/certification model, OSM import jobs, normalization, deduplication, provenance, search-index publication, and unclaimed purchase-intent rejection. OSM population must support bounded multi-region/global batches rather than only a fixed Lomé box.

**Dependencies:** Phase 1 auth/config/test foundations; live Neon read-only schema inventory before new import/provenance migrations.

**Exit criteria:** The arrival globe is spinning horizontally in a coherent warm cream/soft-water MapLibre style and is not a naked map; location permission/fallback is truthful; manual navigation does not trigger reveal; explicit search triggers black-highlight staged reveal; the first-page dock’s primary, discovery, structured, context, and action/request rows never overlap; no-results request replaces the action row; result/card overlays clear the measured dock; real unclaimed/claimed facilities are discoverable and source-attributed; unclaimed facilities cannot be purchased; search results are framed after staged reveal; exact-query auth restoration is verified across responsive widths.

### Phase 3 — Manual commerce loop

**Objective:** Make discovery lead reliably to a human-controlled transaction.

**Product/UI work:** Contextual product cards, manual/bulk availability panels, seller request inbox, response comparison, offer/coupon application, purchase intent, QR, transaction timeline, buyer payment and receipt confirmation, notifications.

**Technical work:** Product/service baseline, allocation-safe quantity, availability request/response contracts, response ranking data, offer/coupon rules and atomic redemptions, transaction events, QR authorization, state transitions, and deep-linked notifications.

**Dependencies:** Phase 2 facility/search identity; Phase 1 auth/config.

**Exit criteria:** Manual flows work with AI disabled; buyer Free quota is correct; unclaimed restrictions hold at server boundary; buyer controls payment/receipt confirmation; transaction is fully traceable.

### Phase 4 — Seller onboarding, company catalogue, inventory, wallet, and plans

**Objective:** Turn the seller side into a credible operational system.

**Product/UI work:** Progressive seller onboarding, seller map workspace, company/facility switching, buyer preview, catalogue/product/variant surfaces, inventory movements and low-stock alerts, wallet ledger, subscription/renewal UI, plan explanations, promotions, seller notifications.

**Technical work:** Companies/memberships, canonical catalogue and facility overrides, inventory balances/movements/reservations, wallet and credit ledgers, deposit idempotency, renewal attempts/downgrade, plan resolver, ad credits, promotion rules, and seller overview queries.

**Dependencies:** Phase 1 plan/config/audit; Phase 2 facilities; Phase 3 products/transactions and notification vocabulary.

**Exit criteria:** Free seller cannot exceed one facility/five products; Pro can use approved expanded capabilities; inventory is auditable and allocation-safe; wallet never goes negative; pending deposits are non-spendable; seller withdrawals are absent; renewal/downgrade is deterministic.

### Phase 5 — Scale, content readiness, and intelligence

**Objective:** Add Pro scale and optional intelligence without weakening manual controls.

**Product/UI work:** Pro import preview/approval, deterministic analytics, demand insights, structured Agent action cards, Buyer Agent mode, Seller Agent mode, automation settings, kill-switch states, and media-ready disabled states.

**Technical work:** Async bulk import and row validation, duplicate detection, analytics queries/aggregates, Agent tools/actions/approvals/usage, feature flags, safe automation rules, and optional media metadata/index support.

**Dependencies:** Phase 4 catalogue/inventory/wallet foundations; Phase 3 manual actions; Phase 1 flags/audit.

**Exit criteria:** Imports cannot bypass plan/allocation rules; Agent calls typed tools only; high-risk actions require confirmation unless explicitly allowed; AI off leaves manual flows unchanged; media UI is hidden when disabled.

### Phase 6 — Hardening, visual convergence, and release

**Objective:** Prove the platform is coherent and safe to evolve.

**Product/UI work:** Visual regression against Omni glass language, responsive/mobile acceptance, copy and accessibility audit, buyer/seller state coverage, notification deep-link review, and map performance review.

**Technical work:** Migration audit, data backfill verification, concurrency tests, wallet/payment idempotency, OSM fixture validation, security review, observability dashboards, retry/dead-letter review, and production runbook.

**Dependencies:** Phases 1–5 as applicable.

**Exit criteria:** All required acceptance matrix scenarios pass; no critical credential, authorization, money, or state-machine issues remain; each release slice is documented and reversible.

## 5. Pull-request strategy

| PR family | Scope | Must not include |
|---|---|---|
| Foundation | Auth/config/errors/design primitives/state contracts | New commercial behavior without contracts |
| Globe/discovery | MapLibre, staged reveal, viewport/search, OSM/facility UI | Wallet or transaction changes |
| Commerce | Availability, catalogue baseline, offers, purchase intent, QR/timeline | Agent automation |
| Seller operations | Company catalogue, inventory, wallet, subscription, plan gates | Seller withdrawals |
| Intelligence | Imports, analytics, Agent tools, kill switch, media flags | Direct LLM database access |
| Hardening | Tests, accessibility, performance, observability, migration cleanup | Unreviewed feature expansion |

Every PR must include a traceability summary, migration list, server-function list, test results, browser acceptance notes, and explicit known limitations.

## 6. Cross-workstream dependency rules

- UI product state cannot be marked complete until a server contract and error semantics exist.
- A server contract cannot be marked complete until at least one intended UI flow consumes it or an explicit infrastructure test covers it.
- Schema changes must include backfill/compatibility notes and a verification query.
- Plan/ownership/security rules must be tested independently of UI visibility.
- Map pins/cards must consume authoritative facility/product eligibility; they may not infer purchase eligibility from styling.
- Agent work cannot start until the manual action has passed browser acceptance.
- Wallet/subscription work cannot start without idempotency, transaction boundaries, and a no-withdrawal policy in the contract.

## 7. Decision register

The approved baseline decisions are:

| Decision | Baseline |
|---|---|
| Company-level shared catalogue | Included in Phase 4/P2 foundation. |
| Seller withdrawals | Not available in the initial release; wallet is platform balance only. |
| Visual clustering | Not required as a visual result. Backend viewport limiting/deduplication is allowed for load. |
| AI default | Disabled by default until manual parity, safety, and observability gates pass; Pro cohort enablement later. |
| Media default | Schema/media-ready but UI disabled behind `mediaUiEnabled`. |
| Buyer bulk limit | Free Buyer receives 3 bulk availability operations/month; configuration-driven Pro expansion. |
| Seller Free baseline | One facility and five products, enforced server-side. |
| Map implementation | Real MapLibre globe projection only; no substitutes. |
| Auth/database | Neon Auth/JWKS and Neon PostgreSQL only. |

Open decisions requiring later product review include exact Pro pricing, renewal cadence, seller campaign/ad-credit allocation, commission accounting for future payouts, and the first enabled Agent cohort.

## 8. Shared acceptance matrix

| Capability | Product/UI gate | Technical gate |
|---|---|---|
| Globe/resting rotation | Real globe, approved horizontal center/longitude direction, no clock-like roll, reduced-motion path | Map state receives valid geometry/stage/framing metadata and does not overload viewport |
| Location/resting discovery | Explicit permission, truthful fallback, real marker only after success, sparse source-backed facility points, no label wall | Location source, discovery center, viewport feed, and facility eligibility are authoritative |
| Manual navigation/reveal | Zoom/pan/recenter before search never triggers choreography; explicit/restored search does | Reveal trigger is explicit and boundary metadata is deterministic |
| Staged reveal/highlight | Visible pauses/highlights through exact position using black/near-black emphasis without unnecessary country labels | Boundary data is deterministic and result framing is reproducible |
| Search dock | Quantity/budget hierarchy is clear on desktop/mobile and does not overlap result count or availability action | Structured values persist through auth/search/availability transitions |
| OSM/unclaimed | Discoverable, attributed, claimable, not purchasable, populated by bounded multi-region imports | Source/provenance/claim state and final purchase-intent rejection |
| Transaction | QR/timeline/payment/receipt sequence | Server transition invariants and buyer confirmation control |
| Wallet/subscription | Available/pending/ledger/renewal/downgrade clarity | Atomic idempotent ledger, no negative balance, deterministic renewal |
| Agent/flags | Hidden/off/confirmation/action states | Tool permissions, plan/flag checks, kill switch, audit |
| Notifications | Correct deep links and preference classes | Typed event generation and authorized payloads |

## 9. Definition of done for the full package

The full-platform package is considered implementation-ready when:

1. The five documentation artifacts exist in `docs/` and agree on vocabulary, state machines, plan decisions, and non-goals.
2. The traceability matrix maps master/spec requirements to current state, target behavior, implementation slice, and test.
3. Product/UI and technical prompts can be executed independently by different contributors without contradictory assumptions.
4. All money, permission, OSM, MapLibre, and AI safety constraints are explicit.
5. The roadmap defines bounded pull requests and phase exit criteria.
6. Product decisions affecting pricing, payouts, withdrawals, Agent activation, and media are either decided or clearly marked as gated decisions.
7. The first implementation PR can begin from Phase 1 without re-discovering the product contract.

## 10. Source references

[1] `docs/OMNI_MASTER.md`.

[2] `docs/omni-product-interface-spec.md`.

[3] `docs/omni-build-plan-after-build-prompt.md`.

[4] `.lovable/plan/omni-interface-produit-map-first-mise-en-conformité-2026-08-15.md`.

[5] `docs/acceptance-category-validation.md`, `docs/globe-reveal-live-validation.md`, and `docs/globe-v2-diagnostics.md`.

[6] Current implementation and schema under `src/` and `db/` on merged `main`.

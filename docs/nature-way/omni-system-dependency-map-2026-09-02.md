# System Dependency Map — Omni V1

> **Map ID:** `SDM-OMNI-2026-09-02`  
> **As of:** 2026-09-02 (UTC), repo `omni-v2-rebuild` @ `3c4bea1`  
> **Maturity target:** pilot-ready (Lomé field pilot), then production-candidate  
> **Map owner:** Nature Way (built in Gate 1; slice selection revised at Gate 1 close, 2026-09-02)  
> **Evidence basis:** static inspection of `db/migrations/001–012`, `src/server/http.ts`, `trunk-repository.ts`, `roots-operations.ts`, `ledger.ts`, `src/trunk/*`; `npm test` re-run this session (**29 files / 184 tests pass**), `npm run lint` (tsc) clean. Production behaviour at `omni.sparkafrika.online` and Neon data were **not** inspected; all `real` statuses below mean "code + tests exist", not "proven in production".

Status vocabulary: `missing` (no code), `bounded` (exists with a manual/fixture/limited path), `real` (code + unit tests exist), `verified` (proven end-to-end with real actors and recorded evidence). No edge is `verified` yet.

## Causal graph

| Edge ID | Parent capability | Child capability | Actor/owner | Source of truth | Command / state transition | Authorization boundary | Freshness | Edge status | Proof today | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|---|
| E-01 | Operator authority (admin role) | Assign operator/admin roles; review claims | Admin | `v2_account_roles`, `v2_accounts.role_admin` (mig. 006/007) | `POST /api/v2/admin/role-management` | admin only | n/a | `real` | `auth-context.test.ts`, `docs/admin-role-production-check-2026-08-27.md` | Role model changes with D-06 |
| E-02 | Identity (Neon Auth session) | Any authenticated action (search with constraints, availability, intent, seller mode) | Buyer/Seller | `v2_accounts` | `GET /api/v2/account/context` | authenticated | session | `real` | `auth-session.test.ts`, `auth-context.test.ts` | D-05 decision |
| E-03 | Public supply seed (OSM `public_import`, `source_kind`) | Non-empty map before sellers exist | Operator/system | `v2_facilities` (`source_kind='public_import'`), `v2_discovery_runs`, `v2_public_sources` | import upsert (`trunk-repository.ts:583`) | operator | import run timestamp | `bounded` — import path exists, no scheduled/ongoing discovery, Lomé demo seed only (`scripts/seed-demo-lome.mjs`) | tests + demo seed | Scale beyond Lomé |
| E-04 | E-02, E-03 | Seller creates company + facility, or claims a `public_import` facility | Seller | `v2_companies`, `v2_facilities`, `v2_facility_slots`, claims (mig. 007) | `POST /api/v2/seller/facilities`; claim (`trunk-repository.ts:781`) | authenticated; slot entitlement | n/a | `real` | `CompanyFacilityOnboardingModal.test.ts`, `trunk-repository.test.ts` | D-01/D-06 |
| E-05 | E-04, E-01 | Trust lifecycle: verification request → evidence → admin review → certified/unconfirmed → confirmed after 3 qualifying sales | Seller + Admin + system | `v2_verification_*`, `v2_facilities.trust_state` (9 states), `qualifying_sales` | reviewer actions; `qualifying_sales` increment at transaction completion (`trunk-repository.ts:1960`) | admin for review; system for sales counter | n/a | `real` but **contested**: 9 DB states vs 3 (MP) vs 4 (MV1 §43) vs 6 (MS §25); no operational open/closed state | tests; `omni-facility-lifecycle-root-2026-08-27.md` | **D-01** |
| E-06 | E-04 | Canonical offer: name, price, mandatory % discount (1–90), `quantity_allocated_omni`, publication state | Seller | `v2_products` (+ mig. 012 constraints) | `POST /api/v2/seller/catalogue` | facility owner; catalogue limit entitlement | updated_at | `real` | mig. 012 checks; `catalogue` tests | **D-02** (Offer/StockEvent/SupplyLocation) |
| E-07 | E-06 | Omni allocated stock decrements on completed transaction (stock event) | System | `v2_products.quantity_allocated_omni` | transition to completed | system | per transaction | `bounded` — column exists, decrement on completion **not located** in server code; no `StockEvent` ledger | none found | D-02; verify in Root |
| E-08 | E-06 (published offers) | Buyer discovery: map bounds, text query, category, `budget_max`, `quantite_min`, `rayon_km` | Buyer | `listPublicFacilities` (`trunk-repository.ts:1158`) | `GET /api/v2/public/facilities` | public for browse; constraints per D-05 | live query | `real` (PR #58 landed; MP §5 gap D/E/F is stale) | `trunk-repository.test.ts`, `map-pins.test.ts` | D-05 |
| E-09 | E-08, E-02 | Availability request → seller manual response (available/partial/unavailable) | Buyer → Seller | `v2_availability_requests/responses` (mig. 005 idempotency) | `POST /api/v2/availability`, `/seller/availability-requests`, `/availability-responses` | buyer authenticated; seller owns facility | read-side freshness `fresh/stale/expired` computed at query time (`stale` after 10 min, `trunk-repository.ts:1546`) | `real` for manual path; the 10-minute window is hard-coded and not a founder decision (F1 spoke of "a few hours") | tests | A-2; freshness window decision |
| E-10 | E-06, E-09, Pro entitlement | Deterministic automatic availability reply from allocated stock within freshness window | System | none | none | `facility_pro` entitlement exists (`v2_facility_entitlements`) | must define window | `missing` | — | **D-03** |
| E-11 | E-09 | Bulk availability (many facilities, one request) with credits | Buyer Pro | none for buyer credits | none | buyer pro plan (`BuyerProPlansModal` UI exists) | n/a | `missing` server-side; UI shell only | `BuyerProPlansModal.test.ts` | **D-04** |
| E-12 | E-09 (eligible response) | Purchase intent → transaction snapshot + members + events | Buyer | `v2_purchase_intents`, `v2_transaction_*` | `POST /api/v2/purchase-intents`; `roots-operations.ts:167` eligibility check | buyer of the response | intent expiry | `real` | `roots-operations.test.ts` | — |
| E-13 | E-12 | Transaction QR issuance and seller verification; discounted price applied on verification | Buyer/Seller | `v2_qr_tokens` (expiry) | `/qr-issuances`, `/buyer-qr-issuances`, `/qr-verifications` (`roots-operations.ts:233`) | transaction members | token `expires_at` | `real` | tests, `TransactionQrCard`, `SellerScannerModal.test.ts` | — |
| E-14 | E-13 | Contact + itinerary (MapLibre) revealed only after intent | Buyer | transaction snapshot | reveal on intent | transaction members | n/a | `bounded` — reveal logic exists in trunk (`map-reveal.ts`); itinerary rendering not confirmed | `map-reveal.test.ts` | Species |
| E-15 | E-13 | External payment: seller methods (cash, mobile money) → buyer declaration → seller confirmation | Buyer/Seller | `v2_external_payment_declarations` | `/external-payment-declarations`, `/external-payment-confirmations` | members | n/a | `real`; `pay_on_delivery` already removed (MP gap I is stale) | tests | MV1 §46 |
| E-16 | E-15 | Fulfilment sent/received, completion, rating; feeds E-05 counter and E-07 stock | Both | `v2_fulfilments`, `v2_ratings`, `v2_transaction_events` | `/transaction-transitions`, `/transaction-ratings` (state machine `ledger.ts`) | members by role | n/a | `real` (stepper + rating UI merged #72) | `transaction-steps.test.ts` | State names vs MV1 §42 |
| E-17 | E-12 | Contextual transaction chat bound to transaction lifecycle | Both | `v2_transaction_messages` (mig. 011) | `/transaction-messages` | members | lifecycle-bound | `real` | `TransactionChat.tsx`, tests | — |
| E-18 | E-02 | Omni Wallet: FedaPay recharge, Pro purchase, $20 locked bonus until confirmed | Seller | `v2_wallets`, ledger, `v2_wallet_recharge_intents`, `bonus_unlocked_at` | `/wallet`, `/wallet/recharges`, `/wallet/pro`, `/fedapay/webhook` | owner | webhook | `real` in sandbox (`fedapay-environment-separation-2026-08-27.md`); production money path not re-verified | `fedapay-adapter.test.ts` | Any wallet change → qualified review |
| E-19 | E-01 | Operator field runs, facility status history, notifications/push | Operator/system | mig. 006, 008 | `/notifications/push` | operator/admin | n/a | `bounded` | `push-operations.md` | Pilot ops |
| E-20 | All above | Measurement: audit + analytics events; proof scripts | Team | `v2_audit_events`, `v2_analytics_events`, `scripts/prove-*.mjs` | — | admin | n/a | `bounded` — tables exist; no success-signal dashboard/query for the V1 loop | — | Success signal defined in Intent Brief |

## Actor and parent inventory

| Layer | Capability that must exist | Why it is a parent | Children unlocked | Owner | Status | Smallest proof |
|---|---|---|---|---|---|---|
| Governance/operations | Admin/operator roles; claim review; operator runs | Nothing is "verified"/"confirmed" truthfully without a reviewer and an audited counter | E-05, E-19 | Founder (admin) | `real`, not proven in prod for this restart | One real claim reviewed in prod by the founder with audit row |
| Supply/provider | Seller onboarding or claim of OSM facility | Without a real facility there is no honest pin | E-05, E-06 | Seller + Nature Way | `real` | One real Lomé seller creates/claims and publishes ≥1 offer |
| Canonical data | Offer with price, mandatory discount, allocated stock; stock events | Availability and discount promises depend on it | E-08, E-09, E-10, E-13 | Nature Way | `real` for offer; `bounded/missing` for stock event | Completed transaction decrements allocation with an event row |
| Demand/discovery | Map + constraint search over published offers | The buyer's entry point; already landed | E-09, E-11 | Nature Way | `real` | Constraint search returns only facilities with matching published offers (test + prod) |
| Transaction/fulfilment | Availability → intent → QR → payment → fulfilment → rating | The loop that produces truth (stock, confirmation, revenue) | E-05 counter, E-07 | Nature Way | `real`, no auto-availability | One real buyer/seller pair completes the loop |
| Support/measurement | Success-signal query over audit/analytics | Otherwise we cannot tell if the loop works | Founder decisions | Nature Way | `bounded` | One SQL/report answering "loops completed this week" |

## Existing-surface rescue (orphaned leaves and stale plans)

| Existing screen / artifact | Parent edges missing or unaccepted | Honest today | Claim to remove / correct | Rebased slice | Status |
|---|---|---|---|---|---|
| `OMNI-V3-MASTER-PLAN.md §5–6` PR roadmap | Seed (not reconciled with MV1); its gap table is stale — PR 3 (#58) and screens 12–13 (#72) landed | Rules §7 (branch, install, prod) | "Backend near feature-complete for v1", "Reduce to exactly 3 statuses", gap rows D/E/F/H | Fold into Root decision D-01/D-02 | `paused`; superseded for product framing |
| `docs/omni-species-*` (2026-08-27, ~20 files) + `docs/maquette` | Seed acceptance; MV1 §75–77 screen architecture (map + search/scan/menu, floating Buyer/Seller switch) | Visual exploration | None claimed accepted; treat as candidates | Species audit (Gate 2) | `orphaned leaf` |
| `BuyerProPlansModal` (buyer credits UI) | E-11 server path, D-04 | Plan display | Any implication that bulk checks work | Root: buyer credit ledger | `orphaned leaf` |
| `src/components/v2` / `MaquetteApp` | Everything | Nothing | Owner already flagged as error | Delete in a later hygiene PR | `orphaned leaf` |
| `v2-founder-hq.md` board (2026-08-25) | Superseded plan | History of prior proof | "Production READY" framing | `docs/founder-hq/*` | history |
| Facility trust `PublicTrust` with `certified` removed from public list (`97b4eff`) but DB retains it | D-01 | UI shows fewer states | Inconsistent public/DB vocabulary | Root D-01 | `contested` |

## Phase diagnosis

- **Actual phase:** **Seed closed by founder confirmation (2026-09-02); Species open** over an existing Root/Trunk. This is an existing-project rescue, not a greenfield. Species was never founder-accepted (2026-08-28 dispatch says so; nothing since records acceptance). Root/Trunk/Heartwood code exists and is tested (184 tests) but was built against MP's framing, which the founder has replaced with MV1 + the D-01…D-07 decisions.
- **Not the phase:** Canopy polish or PR 2 design-system work — visible-first work is exactly the rushed pattern.
- **Highest-leverage missing parents:** (1) one agreed trust-state + operational-state model (D-01) — it gates claim UX, admin, badges and confirmation; (2) stock event on completion (E-07) — without it the founder's central promise ("transactions make availability better") is false; (3) deterministic auto-availability (E-10, D-03) — the founder's stated reason for allocated stock; (4) a founder-decided freshness window for availability (E-09 currently hard-codes 10 minutes).

## Slice selection

> **Founder decision (2026-09-02):** the earlier proposal to start from the buyer transaction chain is **superseded**. Omni is rebuilt in parent-before-child order; the buyer surface is not built before the seller surface, and the seller surface not before team ops/admin.
>
> **Rebuild order (Species, Root and Trunk all follow it):**
> 1. **Admin / team ops** — E-01 authority + roles, E-04 claim review, E-05 trust lifecycle transitions + operational state, E-19 operator field runs, E-20 audit/measurement views.
> 2. **Seller** — E-02 identity (seller capability), E-04 company/facility onboarding + claim, E-06 Offer with mandatory discount + Omni allocation, E-07 `StockEvent` ledger, E-09 manual availability inbox, E-10 deterministic auto-reply (`facility_pro`), E-18 wallet / per-facility entitlements, E-13 QR verification, E-15/E-16 seller side of payment + fulfilment, E-17 chat.
> 3. **Buyer** — E-03 seeded public supply on the map, E-08 constraint search, E-09/E-10 availability request (per-account credits, E-11), E-12 intent, E-13 QR issuance, E-14 delayed contact/itinerary, E-15/E-16 buyer side, E-17 chat, ratings.
> 4. **Integrated proof** — one real seller, one non-team buyer and one team operator complete `offer → availability → intent → QR → payment → fulfilment → StockEvent → qualifying_sales` flawlessly, with no manual intervention.
>
> **Why this order:** every buyer-facing edge has a seller or operator parent; every seller edge has an operator parent (roles, claim review, trust transitions). Building children first is how the existing code ended up with truthful-looking screens over unverified parents (E-07 missing, E-10 absent, E-09 hard-coded 10 min).  
> **Distinction:** the *rebuild order* is the construction sequence; the *V1 transaction chain* above remains the runtime journey the final proof exercises.  
> **Not active yet:** v3 re-skin as its own PR, OSM discovery scale, agents, in-app payment, global cart.  
> **Gate to unlock next:** Species audit of existing maquettes (G-02a) → founder accepts Admin/operator maquette set (G-02b).

## Readiness rule

A child moves to implementation only when its parent edges are `verified`, or explicitly bounded with owner, expiry, safe failure and proof plan. Rendered screens, passing unit tests and demo seeds are not evidence that a parent exists in production.

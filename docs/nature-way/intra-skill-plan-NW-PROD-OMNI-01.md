# Intra-Skill Plan — `/nature-way` — Omni Gate 1 (Seed reconciliation + SDM) → Gate 2 (Species)

> **Plan ID:** `NW-PROD-OMNI-01`  
> **Handoff ID:** `HO-OMNI-01` (from `docs/founder-hq/handoff-receipt-HO-OMNI-01.md`)  
> **As of:** 2026-09-02 (UTC)  
> **Gate owned:** Seed reconciliation + System Dependency Map (closed 2026-09-02) → Species (active, handoff `HO-OMNI-02`)  
> **Return to:** Founder HQ (`docs/founder-hq/founder-hq-master-plan.md`)

## Resource Receipt

| Status | Exact path |
|---|---|
| Loaded | `.agents/skills/nature-way/SKILL.md` |
| Loaded | `.agents/skills/nature-way/references/founder-intent-discovery.md` |
| Loaded | `.agents/skills/nature-way/references/prerequisite-architecture.md` |
| Loaded | `.agents/skills/nature-way-founder-hq/references/intra-skill-execution-controller.md` |
| Template instantiated | `.agents/skills/nature-way/templates/intent-brief.md` → `docs/nature-way/omni-intent-brief-2026-09-02.md` |
| Template instantiated | `.agents/skills/nature-way/templates/system-dependency-map.md` → `docs/nature-way/omni-system-dependency-map-2026-09-02.md` |
| Template instantiated | `.agents/skills/nature-way-founder-hq/templates/intra-skill-plan.md` → this file |
| Read (founder inputs) | Problem statement transcript; `OMNI — MASTER SYSTEM` (§1–202); `OMNI — MASTER V1` (§1–82) |
| Read (repo) | `README.md`; `OMNI-V3-MASTER-PLAN.md`; `docs/omni-founder-hq-dispatch-2026-08-28.md`; `v2-founder-hq.md`; `db/migrations/001–012`; `src/server/http.ts`, `trunk-repository.ts`, `roots-operations.ts`; `src/trunk/` file inventory; `vercel.json`; `git log` (last 12) |
| Executed | `npm install`, `npm test` → 29 files / 184 tests pass; `npm run lint` (tsc) → clean |
| Not loaded / reason | `nature-way/references/species-*`, `root-*`, `technical-lead-production-review.md`, `autonomous-delivery-gates.md`, `proof-and-decision-ledger.md`, `templates/founder-mission-contract.md` — not needed until Species/Root open. `docs/omni-species-*` bodies — deferred to the Species audit. Production site and Neon data — not inspected (no founder request; treat as unverified). |

## Local gate plan

| Order | Local gate | Decision condition | Evidence | Status |
|---|---|---|---|---|
| 1 | Reconstruct Intent Brief from the three founder inputs; label inferences | Brief covers all 13 fields; every inference labelled | `omni-intent-brief-2026-09-02.md` | `done` |
| 2 | Build SDM from repository evidence | Every V1 loop capability has an edge with status and proof | `omni-system-dependency-map-2026-09-02.md` | `done` |
| 3 | Diagnose phase and orphaned leaves | Phase named; stale plan rows identified | SDM "Phase diagnosis" + "Existing-surface rescue" | `done` |
| 4 | Founder confirmation of Seed | Founder confirms brief and decides D-01…D-07 | Founder reply recorded in Intent Brief "Founder confirmation" | `done` (2026-09-02) |
| 5 | **Species — Gate 2** | Founder accepts maquette sets in order Admin/operator → Seller → Buyer; design system locked | Audit table + accepted sets | `active` |

## Task tree

| ID | Parent | Objective | Depends on | Status | Proof |
|---|---|---|---|---|---|
| T-01 | Gate 1 | Read founder inputs, extract need / solution / feature ideas / assumptions separately | — | `done` | Intent Brief |
| T-02 | Gate 1 | Inspect repo schema, API, server, trunk; re-run tests | — | `done` | SDM evidence basis |
| T-03 | Gate 1 | Cross-source contradiction table D-01…D-07 | T-01, T-02 | `done` | Intent Brief table |
| T-04 | Gate 1 | Founder decisions | T-03 | `done` | Intent Brief § Founder confirmation |
| T-05 | Gate 2 | Audit existing `docs/omni-species-*` + `docs/maquette` vs MV1 §75–77 and D-01…D-06: keep / revise / reject per screen; list missing admin screens | T-04 | `done` | `docs/nature-way/omni-species-audit-G02a-2026-09-02.md` — buyer/seller keep-with-revisions; admin stubs rejected; missing admin set is the gap |
| T-05a | Gate 2 | Admin/operator maquette set: role management, claim/verification review, trust + operational state transitions, operator field runs, audit views; obeys R-01 (bottom simple control panel), R-02 (simple/direct first visit), R-03 (map-contextual actions) | T-05 | `ready` (pending founder acceptance) | `docs/nature-way/omni-admin-operator-maquette-set-G02b-2026-09-02.md` + `docs/maquette/omni-admin-operator-maquette.html` |
| T-05b | Gate 2 | Seller maquette set: company/facility onboarding + claim, Offer editor (discount, allocation), StockEvent history, availability inbox + auto-reply setting, QR verification, payment/fulfilment, wallet + per-facility Pro | T-05a | `planned` | Founder acceptance |
| T-05c | Gate 2 | Buyer maquette set: map, constraint search, facility sheet with trust label + open/closed, availability request (credits), intent, QR, delayed contact/itinerary, payment declaration, fulfilment, rating | T-05b | `planned` | Founder acceptance |
| T-06 | Gate 3 (planned) | Root contracts: trust label derivation + operational state, Offer naming, StockEvent ledger, auto-availability rule, 4 h/24 h freshness, per-facility entitlements, per-account credits; non-destructive migration plan | T-05c | `planned` | — |
| T-07 | Gate 4 (planned) | Trunk in order Admin → Seller → Buyer; each slice proven before the next | T-06 | `planned` | — |
| T-08 | Gate 4 (planned) | Integrated proof: one real seller + one non-team buyer + one team operator complete the loop flawlessly | T-07 | `planned` | Proof record |

## Reconciliation log

| Date | Fact | Change | Decision |
|---|---|---|---|
| 2026-09-02 | `OMNI-V3-MASTER-PLAN.md §5` gap rows D/E/F (product model, constraints, grid), H (stepper/rating) and I (`pay_on_delivery`) are already landed (#58, #72, `97b4eff`). | Marked MP gap inventory stale in SDM. | MP is no longer the product source of truth; its §7 workflow rules remain valid. |
| 2026-09-02 | No stock-decrement-on-completion or StockEvent found in server code although `quantity_allocated_omni` exists. | E-07 `bounded`; flagged as highest-leverage missing parent. | Verify in Root before any availability claim. |
| 2026-09-02 | Availability freshness hard-coded at 10 minutes; founder transcript mentions "a few hours". | Added freshness window to founder questions. | — |
| 2026-09-02 | No automatic availability reply exists; `facility_pro` entitlement does. | E-10 `missing`. | D-03. |
| 2026-09-02 | Founder answered all 7 questions; rejected buyer-chain-first slice; imposed Admin → Seller → Buyer rebuild order. | Gate 1 closed; SDM slice selection rewritten; task tree T-05…T-08 reordered. | Freshness 4 h / 24 h and per-facility / per-account entitlements stand as accepted defaults until the founder reopens them. |
| 2026-09-02 | Founder added three Species rules for the Admin/operator maquette (HO-OMNI-03): R-01 bottom simple control panel, R-02 simple/direct first visit, R-03 map-contextual actions. | T-05 executed (G-02a audit done); T-05a produced (G-02b Admin/operator set) pending founder acceptance. Resource Receipt extended with `visual-and-logic-coherence-review.md`. | Admin/operator set is the first Species set to accept; no Root/Trunk code until accepted. |
| 2026-09-02 | Founder supplied prior-session context: liquid-glass art direction, logo = pin-with-eye 3D, flows épurés/map-centric/contextual, and accepted screen set A1–A8; confirmed public trust label + separate operational state (D-01). | Maquette rebuilt to inherit real LiquidGlass tokens + pin-eye 3D SVG + A1–A8. | — |
| 2026-09-02 | Founder **refined R-01/R-03** (with reference images): for **every** flow (admin/team/buyer/seller) the map is the heart and **always fully visible**; content appears only as **partial bottom sheets/grids rising from the bottom**; navigation is a **minimal floating pill — 3 icons** (search ⌕ · QR ▦ · menu ≡) near the thumb; "aucune exagération, rien de superflu." | Maquette rebuilt to the **map-heart pattern**: dark-globe map always visible, partial sheets, minimal pill. | — |
| 2026-09-02 | Founder **refined again**: admin is also a **role** → top pill shows Buyer **+ Admin + Operator** (only if the connected account holds the role). The **dock and grids are contextual**: Buyer ⌕ → search dock, ▦ QR → scan facility public QR, ≡ → menu grid; **Admin** pin-click or search on a facility shows the **admin sheet** — **different from what a buyer sees**. One identity + capability (D-06). | Maquette rebuilt as **one consolidated Buyer+Admin** surface. | — |
| 2026-09-02 | Founder **locked the final visual direction** (reference image): the map is **monochrome black & white** — white base, black continents, a single circular count marker (e.g. "206"). Names/options must be **simple and unambiguous**. Reminder of the **order of existence**. | **Palette locked:** monochrome ink `#0f0f0f` / white / panel `#f7f7f7` + **one accent** `#1fa97a` = "En stock / Vérifié" only. **Naming simplified:** `En stock`, `Vérifié`, `À valider`, `Bientôt`. **Order of existence restated: Admin → Seller → Buyer**; Facility before Offer; verification before availability shown. | — |
| 2026-09-02 | Founder: **"INTÈGRE LE TRACÉ DE CONTINENTS RÉELS sinon accept"** + **dock updates by screen + sheet + role**. Maquette must reflect all master elements. | Maquette rebuilt as full master flow with real continents + contextual dock. | — |
| 2026-09-02 | Founder added **contextual micro-details**: horizontal result grid; search dock compact at first; green accent softened; facilities/products visuals; unclaimed facilities; back rule; comparison + bulk; role-contextual plans; role-scoped search. | Maquette rebuilt with all of the above (accent `#2e8b6f`). Verified. | — |
| 2026-09-02 | Founder said **"accept but…"**: **transaction chat not properly represented**; **"verify availability" button not properly designed/responsive**; **result-grid sheet rises too high** (sheet heights must be contextual); **universal back to previous screen/sheet from anywhere, unless specifically locked (transaction)**; **spaces must be role-contextual** (Buyer ≠ Seller ≠ Admin). | Maquette rebuilt: CHAT sheet, consistent responsive buttons, contextual sheet heights, universal back via history stack, role-contextual homes. Verified. | — |
| 2026-09-02 | Founder **refined the transaction flow & polish**: (1) **nothing overlays the bottom navigation dock**; (2) **transaction QR is the gateway** — the transaction room (chat + QR inside it) is where QR-verified → choose payment → tracking (state from intent → rating) happens; **only in there is there no backing off** (cancel/advance only); (3) **scrollbars hidden** (right-side scroll lines unaesthetic); (4) **modern icons** (SVG line icons, not unicode stickers), aligned with Omni V1 master. | Maquette rebuilt: single **TXN room sheet** (state-tracking timeline intent→rating + transaction chat + QR/payment advance), dock shows ✕ Annuler / ▦ QR / ≡ Menu inside the locked flow (no ‹). Scrollbars hidden (scrollbar-width:none, ::-webkit-scrollbar none). All nav/menu icons converted to inline SVG line icons. Verified in browser (pin → facility → select → availability → intent → TXN room with cancel/QR/menu dock). Pushed `omni-v2-rebuild`, opened PR → `main`. | G-02b pending founder visual acceptance of refined maquette. |

## Return handoff to Founder HQ (G-02a + G-02b pass, 2026-09-02)

| Field | Value |
|---|---|
| HQ plan ID | `HQ-OMNI-2026-09-02` |
| Local plan ID | `NW-PROD-OMNI-01` |
| Active gate | Gate 2 — Species (G-02a done; G-02b ready for founder acceptance) |
| Closed/open/blocked/deferred | T-05 `done`; T-05a `ready` (pending acceptance); T-05b/c, T-06–T-08 `planned`. |
| Resource Receipt | `nature-way/SKILL.md`; `nature-way/references/intra-skill-execution-controller.md`, `visual-and-logic-coherence-review.md`; `nature-way-founder-hq/references/intra-skill-execution-controller.md`; templates `intra-skill-plan.md`. Read MV1 screen spec §4/§75–77/§78; blueprint §4D; inventory; existing prototype HTML/JS. |
| Evidence (as-of 2026-09-02) | `docs/nature-way/omni-species-audit-G02a-2026-09-02.md` (audit table); `docs/nature-way/omni-admin-operator-maquette-set-G02b-2026-09-02.md` (spec); `docs/maquette/omni-admin-operator-maquette.html` (visual, validated well-formed). |
| Residual gap | Founder acceptance of the Admin/operator set (G-02b). The existing admin stubs are rejected as Species; the new set must be reviewed against R-01/R-02/R-03 and the honest boundaries. No standalone admin maquette existed before this pass. |
| Risk classification | Elevated (admin authority, trust transitions, audit) — unchanged; no code authorized. |
| Owner / next smallest action | Founder: review `omni-admin-operator-maquette.html` and accept or request revisions. On acceptance, G-02b closes and Nature Way produces the Seller set (G-02c). |
| Re-plan trigger | Founder changes R-01/R-02/R-03 or the build order, or rejects the admin direction; reopening a D-01…D-07 decision reopens Seed. |

## Historical return handoff (Gate 1 close, 2026-09-02)

| Field | Value |
|---|---|
| Gate outcome | Seed **closed** (founder confirmation 2026-09-02); SDM built and re-sliced to the founder's rebuild order. Species **open**. |
| Evidence | `docs/nature-way/omni-intent-brief-2026-09-02.md`, `docs/nature-way/omni-system-dependency-map-2026-09-02.md`; test run 184/184; lint clean. |
| Residual gap | D-07 (which maquettes survive) — answered by T-05; production/Neon state unverified; no admin/operator maquette exists today. |
| Risk classification | Elevated (identity, wallet money, payment method display, production DB). No implementation authorized. |
| Smallest next action | T-05: audit existing maquettes and return a keep/revise/reject table plus the list of missing Admin/operator screens; then propose the Admin/operator set (T-05a). No code. |
| Re-plan trigger | Founder rejects the V1 loop as the milestone, or changes the ontology (D-02) in a way that invalidates `v2_*` tables. |

### Founder questions (asked to close Gate 1 — answered 2026-09-02, see Intent Brief)

1. **D-01 Trust states** — Keep the 9-state internal lifecycle and show a 3–4 value public label plus a separate operational state (open/closed/temporarily off)? Or collapse the DB to exactly `{unclaimed, unconfirmed, confirmed}` as `OMNI-V3-MASTER-PLAN.md` demanded?
2. **D-02 Ontology** — Confirm "Product" becomes "Offer" in contracts, and that V1 adds a `StockEvent` ledger tied to completed transactions. Is supply-location ≠ facility-location (real estate, mobile providers) in V1 or later?
3. **D-03 Auto-availability** — Is the deterministic automatic reply (allocation ≥ requested qty AND last seller confirmation within the freshness window) part of V1, and is it Pro-only?
4. **Freshness window** — How long does a seller confirmation keep allocated stock "visible/available": 10 minutes (current code), a few hours (transcript), or configurable per facility?
5. **D-04 Free vs paid** — Confirm: free = single-facility availability checks unlimited + 3 bulk operations/month; Buyer Pro $5 = bulk credits; Seller Pro $10 = auto-reply + >5 offers; facility slots purchasable; $20 credit locked until confirmed.
6. **D-05 Auth boundary** — Confirm: anyone can browse the map and tap pins; constraint search, availability, scan-to-buy require an account; the query is preserved through auth + onboarding.
7. **First proof** — Do you accept the proposed first truthful chain (one real Lomé seller + one non-team buyer completing availability → QR → external payment → fulfilment → stock event) as the Trunk milestone, before any v3 re-skin?

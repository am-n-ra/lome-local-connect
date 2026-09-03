# Intra-Skill Plan — `/nature-way` — Omni Gate 1 (Seed reconciliation + SDM) → Gate 4 (Trunk)

> **Plan ID:** `NW-PROD-OMNI-01`  
> **Handoff ID:** `HO-OMNI-01` (from `docs/founder-hq/handoff-receipt-HO-OMNI-01.md`); active handoff `HO-OMNI-04` (from `docs/founder-hq/handoff-receipt-HO-OMNI-04.md`)  
> **As of:** 2026-09-03 (UTC)  
> **Gate owned:** Seed (closed) → Species (closed 2026-09-02) → Root (closed 2026-09-02) → **Trunk (active, handoff `HO-OMNI-04`)**  
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
| 5 | **Trunk — Gate 4** | Locked order Admin → Seller → Buyer; each slice inventoried vs accepted maquette, gaps closed, proven (API + browser, 4 widths) before the next starts; integrated proof with one real seller + one non-team buyer + one team operator | Per-slice gap table + proof record | `active` |

## Task tree

| ID | Parent | Objective | Depends on | Status | Proof |
|---|---|---|---|---|---|
| T-01 | Gate 1 | Read founder inputs, extract need / solution / feature ideas / assumptions separately | — | `done` | Intent Brief |
| T-02 | Gate 1 | Inspect repo schema, API, server, trunk; re-run tests | — | `done` | SDM evidence basis |
| T-03 | Gate 1 | Cross-source contradiction table D-01…D-07 | T-01, T-02 | `done` | Intent Brief table |
| T-04 | Gate 1 | Founder decisions | T-03 | `done` | Intent Brief § Founder confirmation |
| T-05 | Gate 2 | Audit existing `docs/omni-species-*` + `docs/maquette` vs MV1 §75–77 and D-01…D-06: keep / revise / reject per screen; list missing admin screens | T-04 | `done` | `docs/nature-way/omni-species-audit-G02a-2026-09-02.md` |
| T-05a | Gate 2 | Admin/operator maquette set | T-05 | `done` (accepted 2026-09-02) | `docs/nature-way/omni-admin-operator-maquette-set-G02b-2026-09-02.md` + unified `docs/maquette/omni-species-maquette.html` |
| T-05b | Gate 2 | Seller maquette set | T-05a | `done` (accepted 2026-09-02) | `docs/nature-way/omni-seller-maquette-set-G02c-2026-09-02.md` |
| T-05c | Gate 2 | Buyer maquette set | T-05b | `done` (accepted 2026-09-02) | `docs/nature-way/omni-b02-buyer-audit-G02d-2026-09-02.md` |
| T-06 | Gate 3 | Root contracts: availability state + freshness (RG-1), StockEvent ledger (RG-2), saved searches (RG-3), claim requests ported to v2 (S1); non-destructive migration | T-05c | `done` | Inspection `omni-root-inspection-G03-2026-09-02.md`; `038_v2_g03_root_gaps.sql` applied on Neon by founder 2026-09-02 (manual proof class) |
| T-07 | Gate 4 | Trunk in order Admin → Seller → Buyer; each slice proven before the next | T-06 | `in_progress` | See T-07a–T-07d |
| T-07a | T-07 | **Admin slice** — inventory + close gaps + prove | T-06 | `done` | 039 applied; push exécuté; **prod proof 9/9 PASS 2026-09-03** (correlation `16e0997f-…`, compte admin fondateur) — close-out + proof record `omni-trunk-admin-inventory-T07a-2026-09-03.md` |
| T-07b | T-07 | **Seller slice** — onboarding/claim (S1 ported), Offer editor (discount/allocation), availability setter + freshness expiry (proven @ `2d4b487`), availability inbox + auto-reply, StockEvent history (S5, proven @ `2d4b487`), wallet/Pro, QR verification, fulfilment side, chat | T-07a | `ready` | Gap table + proof record à produire |
| T-07c | T-07 | **Buyer slice** — map + constraint search (SearchDock rewritten @ `deb5072`), saved searches (RG-3), availability request w/ per-account credits, intent, QR issuance, delayed contact/itinerary, payment declaration, fulfilment, rating, chat | T-07b | `planned` | Gap table + proof record |
| T-07d | T-07 | **Deploy freshness guardrail** — prod bundle hash must match `omni-v2-rebuild` HEAD build before any slice proof is recorded as prod-verified | T-07 (parallel guardrail) | `verified at T-07a production evidence (2026-09-03)` | Bundle prod `index-BCg5G0cM.js` === build local @ `03f0b41` (post-push hash check passed) |
| T-08 | Gate 4 | Integrated proof: one real seller + one non-team buyer + one team operator complete `offer → availability → intent → QR → payment → fulfilment → StockEvent → qualifying_sales` flawlessly | T-07a–T-07c | `planned` | Proof record |

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
| 2026-09-03 | HO-OMNI-04 (founder: « développer la V1 », maquette de placement). Evidence this session: `npm ci` + `npm test` → **44 files / 274 tests pass at `deb5072`** (observed); `npm run build` → `index-DzG1YV4e.js`; prod `omni.sparkafrika.online` serves **the same hash** → 2026-09-02 stale-deploy blocker **resolved**. `.fld` confirmed in `docs/design.md` vocabulary (l.61). | T-05a/b/c, T-06 → `done`; T-07 split into T-07a (Admin), T-07b (Seller), T-07c (Buyer), T-07d (deploy freshness guardrail, `done`); T-07a `ready`, T-07b/c `planned`. Plan header moved to Gate 4. | Trunk proceeds on the accepted unified maquette as visual authority. If the founder's mentioned maquette is a NEW artifact, Species reopens for audit before further Trunk inheritance. |
| 2026-09-03 | **T-07a Admin slice implemented** (HO-OMNI-04). Inventory vs accepted A1–A8: A2/A4/A5 present; A1 console, A3 operational state (Root gap), A6 counter correction, A8 audit log, R-03 map focus were missing. Closed: migration `039_v2_operational_state.sql` (D-01); routes `/admin/console`, `/admin/audit-events`, `/admin/facilities/:id/operational-state`, `/admin/facilities/:id/sales-counter`; `AdminConsoleSheet` + `AdminAuditSheet`; A3/A6 controls in claim context; `TrunkMap.focusTarget` + queue lat/lng. Admin role pill → console (was: reviewer queue). | 285/285 tests (+11), tsc clean, build `index-BCg5G0cM.js`, boundary clean; sandbox browser proof of shell only (no DB/Auth locally) | **Founder:** apply `039` on Neon **before** push; push = prod deploy (founder-only); then prod browser+API proof of the admin chain closes T-07a → T-07b (Seller). |

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

## Return handoff to Founder HQ (G-04 Trunk diagnosis pass, 2026-09-03)

| Field | Value |
|---|---|
| HQ plan ID | `HQ-OMNI-2026-09-02` |
| Local plan ID | `NW-PROD-OMNI-01` |
| Active gate | Gate 4 — Trunk (locked order Admin → Seller → Buyer) |
| Closed/open/blocked/deferred | T-06 (Root) `done`; T-07d (deploy guardrail) `done`; T-07a (Admin slice) `implemented` — prod proof pending founder (apply 039 → push → prod proof); T-07b/c, T-08 `planned`. Nothing `blocked`. |
| Resource Receipt | Loaded: `nature-way/SKILL.md`; `nature-way/references/execution-controller.md`; `nature-way/references/intra-skill-execution-controller.md` (HQ copy); HQ `references/ecosystem-orchestration-protocol.md`. Template reconciled (not recreated): `templates/intra-skill-plan.md` → this file. Not loaded / reason: `autonomous-delivery-gates.md`, `proof-and-decision-ledger.md`, `launch-envelope.md`, `technical-lead-production-review.md`, `visual-and-logic-coherence-review.md` — required at slice-proof/maturity/release claims, not for this diagnosis pass; they will be loaded before T-07a proof and any T-08/release claim. |
| Evidence (as-of 2026-09-03) | `npm test` 44 files / **285 tests** (was 274; +11 admin) at slice HEAD; build `index-BCg5G0cM.js`, tsc + boundary clean; Species closed via accepted unified maquette `docs/maquette/omni-species-maquette.html`; Root 038 applied by founder; T-07a admin slice inventory + implementation recorded in `omni-trunk-admin-inventory-T07a-2026-09-03.md`. |
| Residual gap | T-07b (Seller) and T-07c (Buyer) slice inventories not started. Species-vs-Trunk coherence review not yet run on the Trunk app. Integrated proof (T-08) not started. Prod API re-verification of G-04 routes to be re-run during slice proofs. |
| Founder decision (2026-09-03) | **Confirmed:** the maquette is the accepted unified `docs/maquette/omni-species-maquette.html`. Species stays closed; Trunk proceeds on it as visual authority. |
| Owner / next smallest action | ~~Founder: apply 039~~ (done 2026-09-03). **Founder: push `omni-v2-rebuild` (= prod deploy), then run `node scripts/prove-v2-admin.mjs`** → prod proof closes T-07a. Nature Way: T-07b (Seller slice) starts after T-07a prod proof. |
| Re-plan trigger | Founder declares a new maquette (Species re-audit); a slice proof fails; a D-01…D-07 decision reopens; prod hash diverges from HEAD again. |

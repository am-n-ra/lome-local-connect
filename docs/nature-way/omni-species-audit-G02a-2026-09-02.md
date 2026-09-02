# Omni V2 — Species Audit (G-02a) of Existing Maquettes

> **Audit ID:** `SPECIES-AUDIT-2026-09-02`
> **Plan:** `HQ-OMNI-2026-09-02` · **Handoff:** `HO-OMNI-03` · **Gate:** Species (G-02a)
> **Audited by:** `/nature-way` (specialist in control of Gate 2)
> **As of:** 2026-09-02 (UTC)
> **Authority:** MV1 `docs/omni-v1-screen-and-state-specification.md` §4 (Screen Registry), §75–77 (completion / single test / final contract); confirmed decisions D-01…D-07; blueprint `docs/omni-species-blueprint-2026-08-27.md` §4D.
> **Scope:** every screen present in `docs/omni-species-html/app.js` (the live prototype), the `docs/omni-species-*` set (2026-08-27), and `docs/maquette/omni-species-maquette.html`. Each is a candidate — none is pre-accepted (D-07).
> **Output:** a keep / revise / reject table per screen + the list of missing screens, so the founder can decide the Admin/operator set (G-02b) next.

## Audit basis

- **MV1 §4 Screen Registry** is the authoritative screen list. It enumerates Buyer (B01–B20), Seller (S01–S15), Shared/System (X01–X05). **Critically, MV1 lists NO dedicated Admin/operator screen.** Admin/operator capability is implied by X02 Certification (claim review) and the governance parent in the SDM (E-01 roles, E-05 trust lifecycle, E-19 operator runs, E-20 audit). The founder's build order (decision #7: Admin/team ops → Seller → Buyer) **adds** Admin/operator as the first Species set to accept; it does not contradict MV1 — it fills the gap MV1 leaves implicit.
- **§75 completion** requires the buyer + seller loops to work; **§76** requires a new user to complete "find → buy" without explanation; **§77** requires honest ladder (known to exist ≠ available ≠ verified ≠ paid). These govern the buyer/seller maquettes, not admin.
- **D-01…D-07 confirmed decisions** (see Intent Brief): 9 internal trust states + public label + operational state; Offer/StockEvent; deterministic auto-availability (facility_pro); 4 h/24 h freshness; per-facility seller entitlements, per-account buyer credits; one identity w/ capability toggle; rebuild order Admin → Seller → Buyer.
- **R-01/R-02/R-03** (founder, 2026-09-02, from HO-OMNI-03) apply to the Admin/operator set being built next; they do not retroactively reject buyer/seller maquettes, but they reveal that the existing buyer `bottom-nav` already partially satisfies R-01's bottom-control principle, which the admin set must inherit consistently.

## G-02a audit table — existing screens

| # | Screen (prototype / doc) | MV1 §4 ref | Verdict | Reason | Action for G-02c/d |
|---|---|---|---|---|---|
| Buyer — landing/globe/map | `landing()` app.js; maquette.html "Canonical arrival" | B01 Map Home | **keep, revise** | Map-first identity correct (§5, Intent Brief). Revise: align trust labels to D-01 public label (3 values) + separate operational state; ensure `certified` is an internal milestone only, not a public pin color that could be confused with `confirmed`. | G-02d |
| Buyer — search dock (bottom) | `search`/`options` maquette.html; `results()` app.js | B02/B03/B04 | **keep, revise** | Bottom search dock already satisfies the spirit of R-01 (reachable). Revise: freshness display (D-04: fresh/stale/expired) and the "known ≠ available" ladder (§77) must be unmistakable in result cards; add the auto vs manual response distinction (D-03). | G-02d |
| Buyer — facility sheet | `facility()` app.js | B05/B06 | **keep, revise** | Revise: separate the two QRs (public discovery QR vs transaction QR) per §22–24 and blueprint §6; show certified-vs-confirmed + sales counter (0/3→3/3) per D-01 and blueprint §4. | G-02d |
| Buyer — availability builder/result | `availability()` app.js; bulk() | B08/B09/B10 | **keep, revise** | Revise: reflect deterministic auto-reply (D-03) vs manual; freshness 4 h/24 h (D-04); bulk credits = per-account (D-04). | G-02d |
| Buyer — cart/intent/decision | `cart()`, `intent()`, `decision()` app.js | B07/B11/B12 | **keep, revise** | Revise: "Je veux acheter" gates transaction (§21); transaction QR is tied to buyer+transaction, never the public QR. | G-02d |
| Buyer — transaction/QR/chat/payment/fulfilment/closed | `transaction()`…`closed()` app.js | B13–B17 | **keep, revise** | Revise: chat only after intent (§23); delayed contact/itinerary reveal (E-14); rating required at close (E-16). | G-02d |
| Buyer — wallet/pro/credits | `wallet()` app.js | (B20 Buyer Account) | **keep, revise** | Revise: $20 bonus locked until `confirmed` (D-04); bulk credits per-account; buyer Pro $5. | G-02d |
| Buyer — menu/account/bottom-nav | `menu()`, `nav()` app.js | B20 | **keep** | Bottom nav (Explorer/Demandes/Transactions/Wallet/Compte) is the precedent for R-01. Keep as the inherited control pattern. | G-02d |
| Seller — home/facility/companies/stock/catalogue/requests/transaction | `seller()`,`companies()`,`sellerStock()`,`sellerCatalog()`,`sellerRequests()`,`sellerTransaction()` | S01/S02/S03/S05/S06/S08/S09 | **keep, revise** | Revise: per-facility entitlements (D-04); StockEvent ledger visibility (D-02); auto-reply setting gated by facility_pro (D-03); claim vs create separation (§38, blueprint §4). | G-02c |
| Seller — create facility / evidence / certification / claim | `createFacility()`,`facilityEvidence()`,`certification()`,`claim()` | X01, §38, §58 | **keep, revise** | Revise: claim≠create; certification is a manual Omni decision (D-01); progress 0/3→3/3 + $20 bonus (blueprint §4). | G-02c |
| Admin — "Revue Omni" queue (créations + claims) | `admin()` app.js | X02 (implicit) | **reject & rebuild** | This is a minimal dashboard stub. It violates R-02 (too abstract, "queue" with no direct action) and R-03 (no map context). Becomes the seed of G-02b, rebuilt to obey R-01/R-02/R-03. | — (replaced by G-02b) |
| Admin — review dossier (certify/request evidence/reject) | `adminReview()` app.js | X02 (implicit) | **reject & rebuild** | Abstract table row, no map reflection (violates R-03), no role management / operator runs / audit views. Replaced by G-02b. | — (replaced by G-02b) |
| Maquette set docs | `docs/omni-species-*` (2026-08-27) | — | **keep as history** | These are visual exploration, never accepted (D-07). Treated as orphaned leaves; honest work preserved but not pre-accepted. | — |

## Missing screens (not in any existing maquette)

| Required by | Missing screen | Why it must exist | Built in |
|---|---|---|---|
| SDM E-01, blueprint §4D, founder build order #1 | **Admin/operator maquette set** — role management, claim/verification review, trust + operational state transitions, operator field runs, audit views | No admin/operator maquette exists today (G-02b status `planned`, none exists). It is the **first** set to accept. | **G-02b (this pass)** |
| D-01 | Operational state (open/closed/temporarily_off) surfaced separately from trust label | No existing screen separates these; current pin/badge mixes them. | G-02b (admin) + G-02c/d (seller/buyer badge) |
| D-03, E-10 | Deterministic auto-availability toggle + fresh/stale/expired display | Seller stock screen shows "Pro requis" but no fresh/stale/expired ladder. | G-02c |
| D-04 | Per-account buyer credit ledger + per-facility slot purchase | Wallet shows bonus/credits but not the credit ledger or facility-slot purchase flow. | G-02d |
| E-07, D-02 | StockEvent ledger on allocation change + completion | No screen surfaces the stock event history. | G-02c |

## Conclusion of G-02a

- The buyer and seller candidate maquettes are **largely keep-with-revisions**; they were never accepted (D-07) and must be revised against D-01…D-04 before G-02c/G-02d acceptance.
- The two existing admin stubs (`admin()`, `adminReview()`) are **rejected** as Species for admin because they are minimal dashboards that violate the founder's R-02 (not simple/direct) and R-03 (not map-contextual). They become the seed concept only.
- **The decisive gap is G-02b: no Admin/operator maquette set exists.** Per the founder's build order, it is the first set to accept. The next pass produces it obeying R-01/R-02/R-03.

**G-02a status: done.** Decision owner: Founder (accept the audit) → then Nature Way produces G-02b.

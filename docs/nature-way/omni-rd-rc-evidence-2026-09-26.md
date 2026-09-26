# R-D / R-C — Evidence Register (2026-09-26)

**Document ID:** `OMNI-NW-RD-RC-EVIDENCE-2026-09-26`
**Slice:** `R-C` (retirer les offres orphelines) + `R-D` (chemin `individu`)
**Plan:** `intra-skill-plan-NW-PROD-OMNI-RD-01.md`
**Founder orders:** « retirer » (`R-C`) · « r-d » (`R-D`)
**Status:** `delivered — push pending explicit founder order`

---

## 1. The measurement that changed `R-D`

The inventory (`omni-root-finishing-inventory-2026-09-25.md`) described `R-D` as:

> « `C-6` est corrigé en code, mais 0 entité `individu` existe en base… Finition : créer une entité `individu` de bout en bout. Effort : petite (fixture + preuve). »

**That description was wrong, and re-measuring before executing is what caught it.**

| Claim | Measured truth |
|---|---|
| « corrigé en code » | True for the **threshold** (`case when e.kind = 'individu'` at 4 sites), false for the **path**. |
| « créer une entité `individu` … fixture + preuve » | **A fixture would have been a lie.** `createSellerFacility` hardcoded `'organisation'`. **No code path in `src/` could produce `kind = 'individu'`.** A hand-inserted row would have demonstrated a path that did not exist. |

**So `R-D` was not a fixture task — it was a missing product capability.** The Seed promise (« un particulier vend sans structure ») had no way to be expressed. The honest slice was therefore: let the seller declare it, then exercise it for real.

## 2. `R-C` — removal of the orphan offers

Founder order « retirer ». Three published offers sat on ownerless facilities (`Atelier Kegue` ×2, `Pharmacie du Port` ×1).

The **fixture ledger already declared them as fixtures** — `v2-root-fixture-ledger.md` marks all three `public_import` with the allowed assertion *« Catalogue serialization and facility scope only; not live stock »*. Removing them makes the data match the ledger's own non-claim.

| Measure | Before | After |
|---|---|---|
| published offers on ownerless facilities | **3** | **0** |
| total published offers | 16 | 13 |

**Reversibility:** `publication_state` was set to `'archived'`. Re-publishing the same three ids restores the prior state exactly.

**Dead-end closed:** the write path guards on `publication_state = 'published'`, so an ownerless offer could never be claimed or answered — it was a discovery entry that led nowhere. Archiving removes the dead end rather than hiding it.

## 3. `R-D` — the missing path, now real

No migration was required: `058_v2_entity_layer_r1.sql` already defines `kind text not null default 'organisation' check (kind in ('individu', 'organisation'))`. The column always accepted `'individu'`; **nothing could write it.**

Delivered:

| Layer | Change |
|---|---|
| validator (`http.ts`) | `ownerKind` declared; **unknown value rejected**, absent value falls back to `organisation` (schema default — an old client must not turn a business into an individual by omission) |
| repository (`trunk-repository.ts`) | the entity INSERT binds the **declared** kind instead of the literal `'organisation'` |
| client (`api.ts` / `types.ts`) | `ownerKind` sent; `OfferOwnerKind` forked in client types (the client deliberately does not cross the domain boundary) |
| seller form (`SellerV13.tsx`) | « Vous vendez en tant que » — Particulier / Commerce, inheriting the **existing** segmented-button pattern. The maquette has **no** nature control, so no new pattern was invented. The helper text states the real rule (1 sale vs 3). |

### Two real bugs found by the end-to-end proof — neither visible to unit tests

The repo's own lesson applies: *stubs discard bound values and never type-check SQL*. Both defects were invisible to the 638-test suite and appeared only against a real database.

**Bug 1 — `LEAST types text and integer cannot be matched`.** Inside a CTE, a bare bound parameter is inferred as **`text`**. So `least(threshold, 5)` and `integer >= threshold` both fail. This affected **all four** threshold sites, not only the individu one — the organisation path was equally broken, which is why no `individu` row ever existed to expose it. Fixed by casting the constants `::int`.

Probe that isolated it:

| Pattern | Result |
|---|---|
| `select least($1, 5)` | OK |
| `with t as (select case when true then $1 else $2 end as threshold) select least(threshold, 5)` | **FAIL — text vs integer** |
| same CTE with `$1::int` | OK |

**Bug 2 — the distinct-buyer counter lagged by one sale.** `unlock_counts` counted `v2_seller_unlock_progress` **in the same instruction that inserted into it**. By Postgres snapshot semantics the inserted row is not visible, so the count returned the total from *before* the current sale. Consequence: `qualifying_sales` advanced 0 → 1 → 2 … and confirmation needed **one extra sale** — an organisation needed 4, and an individual could never be confirmed by its first sale. This is the same class of defect previously fixed for ratings and QR issuance. Fixed by counting the **table** (prior sales, visible) and adding the current sale from the `RETURNING`.

## 4. Proof

`scripts/prove-v2-individual-owner.mjs` drives the **shipped** `createSellerFacility` and `submitTransactionRating` against a disposable branch.

| Step | Result |
|---|---|
| T1 shipped create path persists a declared `individu` | **PASS** — `kind=individu`, entity linked |
| T2 declared `organisation` preserved | **PASS** |
| T3 **one** sale confirms an individual (threshold 1) | **PASS** — `trust=confirmed`, `qualifying=1` |
| T4 **one** sale does **not** confirm an organisation (threshold 3) | **PASS** — `trust=unconfirmed`, `qualifying=1` |
| T5 **three** distinct buyers confirm the organisation | **PASS** — `trust=confirmed`, `qualifying=3` |

T3/T4 together are the **discriminating control**: the same single sale confirms one kind and not the other, so the threshold genuinely depends on the declared nature.

### Falsifications (a test that cannot fail proves nothing)

| Falsification | Result |
|---|---|
| restore hardcoded `'organisation'` in the entity insert | R-D repo test **FAILS** |
| coerce the validator default to `individu` | R-D validator test **FAILS** |
| restore the snapshot-blind counter | proof **T3/T4/T5 FAIL** (`qualifying=0/0/2`) |

### Non-regression on the flows that share the changed CTE

| Proof | Result |
|---|---|
| `prove-v2-transaction-lifecycle.mjs` | **9/9 PASS** |
| `prove-v2-stock-reservation.mjs` | **6/6 PASS** |

## 5. Honest residuals

- **The push is not done.** Prod still serves the previous bundle. `T-07d` is therefore **not** crossed — no deploy claim is made.
- The `individu` **search/threshold** behaviour is proven at the data layer. No browser proof of the new form control was captured (sandbox has no DB/Auth session).
- `R-B` remains open and untouched by this slice: characteristics are still **0/16 populated** in the data, and `listPublicFacilities` still does not filter on them.
- `ownerKind` is declared **once**, at facility creation. There is no edit path; a seller who mis-declares must create a new facility. Not a defect, but an unstated limit.
- Gate 6 stays **CLOSED**. Nothing here asserts a Species or Root closure.

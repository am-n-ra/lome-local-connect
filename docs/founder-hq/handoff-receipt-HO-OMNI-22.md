# Handoff Receipt — `HO-OMNI-22`

> **Request ID:** `HO-OMNI-22`
> **Founder HQ timestamp:** 2026-09-26 (UTC)
> **Primary authority:** `/nature-way-founder-hq` (front door) → `/nature-way` (product gate)
> **Exact invocation:** `/nature-way-founder-hq`
> **Activation status:** `activated`
> **HQ Plan ID:** `HQ-OMNI-2026-09-02`
> **Local plan:** `NW-PROD-OMNI-01` (alignement app) — tranche `ALIGN-1`

---

## 1. Dispatch Record

| Field | Value |
|---|---|
| **User objective** | Verdict on the process itself: *« on a assez tourné en rond, je pense qu'on a raté tout le process depuis Species… j'aime bien la présentation visuelle globale actuelle mais tout le fond et la logique qui doit faire de Omni omni n'est pas là et même il y a beaucoup d'incohérence dans ce qu'on veut réellement faire et proposer »* |
| **Classification** | **Reconciliation**, not a new feature request. The claim is about process integrity and product coherence. |
| **Reversibility** | N/A — a diagnosis. The one irreversible act taken (data correction) is recorded with its rollback. |
| **Missing information** | Which of the two readings the founder means: (a) *« the process was wrong »* or (b) *« the product is hollow »*. Both are addressed separately below, because they have different answers. |
| **Primary skill** | `/nature-way` — product phase diagnosis + finishing inventory. |
| **Secondary route** | None active. Venture Lifecycle / Fundraising / Opportunity remain `watch`. |
| **Expected return** | Gate verdict, evidence, residual gap, owner, next action. |

**Note on repetition.** This is the **same trigger** as `hq-reconciliation-2026-09-26.md` (already committed). Rather than restate that document, this receipt **re-measures** it — the document itself warns that its inventories can be stale within the hour (§5 bis). Every number below was re-checked independently in this session.

---

## 2. Honest verdict — separating what is true from what is not

| Founder claim | Measured this session | Verdict |
|---|---|---|
| « on a tourné en rond » | **True, and the cause is named.** The product never looped — **our memory of the product** looped. The base was rebuilt (`058`→`061`) while the state documents did not follow, so each restart began from a stale map. | **CONFIRMED** |
| « on a raté tout le process depuis Species » | **Partly false.** Seed V2 (`S-01…S-34`) and Species V2 (74 screens, 27/27, `NON MESURÉ = 0`) are real and validated. What was missed is not the *process* but its **synchronisation**. | **PARTIAL** |
| « la présentation visuelle globale est bonne » | **True** — `check:maquette`: 74 screens, 5 levels, registry truthful, 0 duplicates. | **CONFIRMED** |
| « le fond et la logique qui font d'Omni Omni ne sont pas là » | **True, and quantified — on one layer only.** Re-measured on `br-dawn-hill-am5amy22`: of 16 published offers, `condition_kind` **0/16**, `handover_kind` **0/16**, `price_kind` **0/16**, `uniqueness_kind` **0/16**, `position_kind` **13/16**. The mechanism is **delivered** (write `SellerV13.tsx:174`, read `trunk-repository.ts:505-508`, catalogue `:2310-2311`); the **usage is empty**; the **filtering is absent by design** — the four columns are *selected* in the read path but appear in **no `WHERE` clause**. | **CONFIRMED** |
| « beaucoup d'incohérence dans ce qu'on veut faire et proposer » | **True** — and this is the part that was fixable, so it was fixed today (§3). | **CONFIRMED, now reduced** |

**The one thing that is not true is the most important one**: the work is not hollow. Seed is coherent, Species is validated, the entity base is executed, the transaction cycle is proven. The rot was **in the map, not the territory** — and a stale map is indistinguishable from a lost territory when you are reading it.

---

## 3. What moved in this session — `ALIGN-1` (the app ↔ maquette gap, closed)

The master plan (`HO-OMNI-20`) recorded three named gaps and marked app alignment **forbidden until Species closed**. Species closed 2026-09-25. Those three gaps are now closed:

| Gap (as recorded) | What was done | Evidence |
|---|---|---|
| **App contradicts approved `D-CON-1…5`** — frozen chips `'Quantité 10'` / `'≤ 15 000 FCFA'` posed as filters | Budget and quantity are now **editable thresholds**; the **three families** (disponibilité / votre besoin / attributs) are explicit; the duplicate distance chip is gone (distance keeps one scope control); `Livraison` (a request mode, `043`) and `Transactable` (a trust tier) left search — neither is a catalogue filter | `src/trunk/search-constraints.ts`, `TrunkAppV13.tsx` |
| **App contradicts approved `D-LOC-1…5`** — `OMNI_DEFAULT_LOCAL_CURRENCY` hardcoded in components | `src/domain/currency.ts` resolves the currency from the user's **localisation**; the pilot value survives as a fallback, not the rule | 10 tests, incl. GH→GHS, US→USD, TG→XOF |
| **Server budget filter is currency-blind** — `price_minor <= budget`, no currency, no conversion | The filter is **currency-aware**; an unconvertible currency is **excluded**, never compared | `trunk-repository.ts`, `http.ts` |
| **Data debt: 9 published offers labelled USD, priced in francs** (200–1 800) | Corrected to XOF on the canonical branch. **Rollback = the recorded id list.** | `'Box déjeuner togolais'` at 800, `'Kente tote bag'` at 1 800 |
| *(new, found while measuring)* `money()` divided by 100 unconditionally → a 255 F offer rendered **`2.55 XOF`** | Fixed — XOF has zero decimals | `formatAmount` |

**Prod proof (not local).** Deployment `0423fea` === HEAD, and the behaviour is decisive:

```
budget_max=2500 & budget_currency=XOF & rate=500  ->   5 facilities
budget_max=2500 & budget_currency=USD & rate=500  ->   0 facilities
budget_max=2500 (no currency)                     ->   5 facilities
```

The currency **changes the answer** — so the filter is real, not decorative.

**Verified:** tsc clean · **72 files / 633 tests** · boundary clean · state/docs/coherence/maquette green · build `index-DO1Q_Ljf.js` === prod.
**Four falsifications, all firing** (a guard that cannot fail is not a guard): currency condition removed → **2 failures**; locale resolution disabled → **2**; the `/100` bug reintroduced → **1**; a frozen threshold chip restored → **1**.

---

## 4. Why 607 green tests did not see a 500 — the method defect, named

The repository's tests use a **stubbed `sql`**: they **never execute SQL**. A query Postgres cannot even **compile** therefore passes every unit test. That is why production sat at HTTP 500 while the suite was green. This is an **angle blind of the method**, not developer negligence, and it is now closed by two falsified guards (`prove-root-read-paths.mjs`, `group-by-completeness.test.ts`).

**The rule this session added to itself:** *the measurement prevails over the memory* — including over the document that says so. Before executing a recommendation, **re-measure it**. Cost: minutes. Saving: an entire re-done slice.

---

## 5. What remains — one gate, one decision

**Current gate: `ROOT`, open.** Species stays closed (founder decision 2026-09-25) — not reopened.

| # | Finishing | State |
|---|---|---|
| 1 | **Alignement app ↔ maquette** | **DONE this session** (`ALIGN-1`) |
| 2 | **`R-D` — `individu` path** | 0 entities of this type — **never exercised in data** |
| 3 | **`SP-V2-01` / `R-C` — ownerless offers** | Re-verified: `Atelier Kegue` (2 offers) and `Pharmacie du Port` (1), both `public_import`, **no owner** → a buyer **can ask**, **no seller can answer**, **expires in 15 min, 0 credits**. **Founder decision required: remove or attach.** |
| 4 | **`R-B` usage — offer characteristics** | Mechanism delivered; **0/16 written**. Filling it is a **real seller act**, not a code slice. |

**Founder decision required:**
1. **`SP-V2-01`** — remove the 3 ownerless offers, or attach them to a real entity if a real seller claims them? (I will not invent an owner — `S-04` forbids an orphan offer.)
2. **Order of remaining finishing** — I recommend **`R-D` (the `individu` path)** next: it is a product promise ("a private individual sells without a structure") that has **never been exercised in data**, so its truth is unproven.

**Explicitly NOT recommended:** widening scope, or reopening Seed/Species. The Seed is coherent; the defect was **execution and synchronisation of the base**.

---

## 6. Resource Receipt

| Status | Path |
|---|---|
| Loaded | `.agents/skills/nature-way-founder-hq/SKILL.md` |
| Loaded | `references/intra-skill-execution-controller.md` |
| Loaded | `templates/intra-skill-plan.md` (instantiated — `ALIGN-1` task tree) |
| Loaded | `templates/skill-handoff-receipt.md` (this document) |
| Loaded | `references/ecosystem-orchestration-protocol.md` · `references/founder-hq-board.md` |
| Loaded (state of record) | `docs/founder-hq/founder-hq-board.md` · `docs/founder-hq/hq-reconciliation-2026-09-26.md` · `docs/nature-way/omni-root-finishing-inventory-2026-09-25.md` · `docs/founder-hq/founder-hq-master-plan.md` |
| Not loaded / reason | `templates/founder-hq-master-plan.md` — plan exists, append (no rewrite) · `portability-protocol.md` / `portable-starter` — no workspace migration |

## 7. Handoff to Founder HQ

> **Active milestone:** V1/V2 pilot-ready loop on Lomé, aligned with the accepted maquette
> **Current gate:** `ROOT` (Species closed 2026-09-25)
> **Maturity verdict:** `prototype` → **not yet `pilot-ready`**; trigger = `R-D` + `R-B` usage + `SP-V2-01` decision
> **Closed this session:** `ALIGN-1` (app ↔ maquette: `D-CON-1…5` + `D-LOC-1…5` + currency-aware filter + `/100` display + 9 mislabelled offers), prod-verified `0423fea`
> **Open / blocked:** `SP-V2-01` (founder decision) · `R-D` (ready) · `R-B` usage (seller act)
> **Residual gap:** offer characteristics **0/16 written** — the mechanism exists, the usage does not; filtering on them is **deferred by the accepted maquette**, not by omission
> **Next smallest action:** founder decides `SP-V2-01` (remove or attach the 3 ownerless offers)
> **Re-plan trigger:** founder rejects a finishing · `R-D` proves the entity model cannot express a real individual seller · a new production incident

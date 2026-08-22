# Omni V2 — Root Closure Register

**Document ID:** `OMNI-V2-ROOT-CLOSURE-001`
**Method:** Nature Way — Phase 2, Root System
**Observed:** 2026-08-22
**Status:** `open`

This register converts the Root exit ledger into bounded closure work. It is not approval to start the buyer Trunk. Every item must be proven or explicitly accepted as `manual`, `blocked` or `deferred` by the responsible owner before the Root gate can move.

| ID | Root gap | Owner | Required evidence | Current state | Stop condition |
|---|---|---|---|---|---|
| AUTH-01 | Real Neon Auth bearer acceptance | Auth/server owner with an authorized test operator | One real sign-in/session request against the V2 branch; record only actor class, HTTP result, correlation ID and no token | `blocked` | No credential or connected browser session is available; do not invent credentials or create a user autonomously |
| AUTH-02 | Idempotent Auth-to-V2 account provisioning | Server/data owner | First authenticated request provisions one `v2_accounts` row and wallet; replay returns the same account without duplication | `blocked` | Depends on AUTH-01 and a safe owned fixture identity |
| DATA-01 | Migration-forward and preserved-row proof | Data owner/operator | Execute additive migrations 001–003 on a disposable Neon branch, compare Auth/legacy/V2 counts and schema, record rollback/disposal result | `partial` | Migration 003 executed and verified on expiring branch `br-broad-wildflower-amw7k0om`; preserved-row comparison and production/default-branch decision remain manual |
| DATA-02 | Facility/company and availability-scope ownership | Server/data owner | Server mutation tests plus database-safe constraint or normalized relation proof for same-account ownership and scope membership | `partial` | Pure validators exist; live repository transaction and schema enforcement remain open |
| DATA-03 | Append-only wallet ledger | Server/data owner | Database policy/trigger or restricted writer boundary, with update/delete denial tests | `partial` | Disposable branch confirms trigger presence; representative update/delete denial proof and live writer permissions remain open |
| TX-01 | Atomic QR replay transition | Server/data owner | Conditional update/row-lock transaction, concurrent first-pass/second-pass test and audit append proof | `partial` | Disposable branch confirms QR function/constraint presence; representative execution, concurrency and audit proof remain open |
| TX-02 | Transaction state transition authority | Server/data owner | Positive/negative state-transition matrix across intent, QR, payment, fulfilment, received, rating and close | `partial` | Pure state graph and actor tests exist; live mutation/event append proof remains open; do not build transaction UI against unproven persistence |
| MAP-01 | Protected route provider seam | Map/integration owner | Provider/manual decision, authorized member test, pre-intent denial, unavailable-provider state and precise-location privacy proof | `partial` | No provider call or private location exposure until policy and provider are selected |
| REC-01 | Browser refresh/back/reconnect recovery | Browser/runtime owner | Browser proof at approved breakpoints with context restore, stale request, expired QR, denied camera/location and unavailable source/provider states | `blocked` | Connected-browser bridge previously returned HTTP 504; no claim may be based on screenshots alone |
| FIX-01 | Labelled fixture ledger | Test/data owner | Fixture IDs, actor labels, environment boundary and assertion that fixtures cannot represent marketplace/user success | `todo` | No fixture-backed release or production claim |

## Current evidence already present

Local proof currently reports 10 Vitest files and 37 passing tests, a successful production build, 3 bundled Vercel functions, a clean client boundary, map/route policy proof, QR and transaction state-policy proof, Auth fail-closed malformed-token proof, public stock-field absence, additive migration static review, disposable-branch guardrail verification and read-only Neon/API smoke evidence. These are supporting foundations, not closure of the open rows above.

## Nature Way stop decision

The Root System remains `review`. The buyer Trunk remains closed. Work may continue only on the rows in this register or on a newly documented Root amendment; no buyer UI, transaction UI, route provider, production migration or authenticated data mutation may be smuggled in as proof work.

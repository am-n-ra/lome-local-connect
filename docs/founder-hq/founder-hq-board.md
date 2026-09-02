# Founder HQ Board — Omni

**As of:** 2026-09-02 (UTC)  
**Plan:** `HQ-OMNI-2026-09-02` (`docs/founder-hq/founder-hq-master-plan.md`)  
**Supersedes:** `v2-founder-hq.md` (2026-08-25) as the operating index. That file is kept as history.

| Area | Current truth | Authority / record | Gate or status | Owner | Next action | Capacity / risk |
|---|---|---|---|---|---|---|
| Active milestone | M-01: pilot-ready V1 loop derived from `OMNI — MASTER V1`. Seed confirmed 2026-09-02. Rebuild order fixed by the founder: **Admin/team ops → Seller → Buyer**, then a seller + buyer + team operator prove the loop. | Confirmed Intent Brief; HQ Master Plan | Gate 1 `done`; Gate 2 Species — `in_progress` (G-02a audit ready) | Founder + Nature Way | Nature Way audits existing maquettes, then presents the Admin/operator set for acceptance. | Do not resume PR 2–6 of `OMNI-V3-MASTER-PLAN.md`; no code until Species and Root pass. |
| Product proof | Repository has a real Root/Trunk: 12 Neon migrations, server authority + ledger, availability request/response, purchase intent, QR issuance/verification, external payment declarations, wallet + FedaPay adapter, transaction messages, admin role. Claims of "155 tests green" and production READY are from 2026-08-29 docs; re-verification in progress this session. | `db/migrations/*`, `src/server/*`, `src/trunk/*`, `OMNI-V3-MASTER-PLAN.md §5` | `bounded / inherited; not re-accepted` | Nature Way | Reconcile code model against Master V1 ontology (SDM). | Existing code is evidence to inspect, not proof a gate passed. |
| Customer / commercial | Lomé field pilot intended; no live customer transaction evidence in repo beyond demo/bounded fixtures. | `v2-field-pilot-*.md`, `docs/omni-production-walkthrough-2026-08-27.md` | `unproven` | Founder | None until Trunk proof. | Do not present demo seed as marketplace traction. |
| Capital / runway | Not in scope; no capital process active. | — | `inactive` | Founder | — | — |
| Opportunity pipeline | None active. | — | `inactive` | — | — | — |
| Release / operations | `omni-v2-rebuild` auto-deploys to Vercel prod; skills bundle merged (#75). No release decision is open. | Git, `vercel.json` | `frozen for product changes` | Founder HQ | Keep prod stable; docs-only PRs until Species and Root close. | Any UI/migration PR before Seed acceptance repeats the rushed pattern. |
| Decisions | **Resolved 2026-09-02:** D-01 keep 9 internal trust states, derive public label, add operational state; D-02 Offer naming + `StockEvent` ledger; D-03 deterministic auto-availability in V1, `facility_pro`-gated; freshness 4 h fresh / 24 h expired (accepted recommendation); D-04 supply≠facility location deferred post-V1; D-05 seller entitlements per facility, buyer credits per account (accepted recommendation); D-06 one identity, buyer+seller capabilities, mode switch. **Open:** D-07 which existing maquettes survive — answered by the Species audit. | Intent Brief § Founder confirmation | `resolved except D-07` | Founder | Accept/reject maquette sets in build order. | Reopening any decision reopens Seed. |

## Current gate

> **Gate 1 — closed** (founder confirmation 2026-09-02).  
> **Gate 2 — Species — open.** Order of acceptance: Admin/operator → Seller → Buyer. Ready task: G-02a audit of existing maquettes. Root and Trunk stay planned; no code is authorized.

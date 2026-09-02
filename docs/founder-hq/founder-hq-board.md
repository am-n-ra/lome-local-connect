# Founder HQ Board — Omni

**As of:** 2026-09-02 (UTC)  
**Plan:** `HQ-OMNI-2026-09-02` (`docs/founder-hq/founder-hq-master-plan.md`)  
**Supersedes:** `v2-founder-hq.md` (2026-08-25) as the operating index. That file is kept as history.

| Area | Current truth | Authority / record | Gate or status | Owner | Next action | Capacity / risk |
|---|---|---|---|---|---|---|
| Active milestone | M-01: pilot-ready V1 loop derived from `OMNI — MASTER V1`. The founder judges prior Species/roadmap work rushed; product framing is being re-derived from the three 2026-09-02 inputs. | Founder inputs (problem statement, Master System, Master V1); HQ Master Plan | Gate 1 Seed + SDM — `in_progress` | Founder + Nature Way | Founder confirms/corrects the Intent Brief and answers the 7 open questions. | Do not resume PR 2–6 of `OMNI-V3-MASTER-PLAN.md` until Seed is confirmed. |
| Product proof | Repository has a real Root/Trunk: 12 Neon migrations, server authority + ledger, availability request/response, purchase intent, QR issuance/verification, external payment declarations, wallet + FedaPay adapter, transaction messages, admin role. Claims of "155 tests green" and production READY are from 2026-08-29 docs; re-verification in progress this session. | `db/migrations/*`, `src/server/*`, `src/trunk/*`, `OMNI-V3-MASTER-PLAN.md §5` | `bounded / inherited; not re-accepted` | Nature Way | Reconcile code model against Master V1 ontology (SDM). | Existing code is evidence to inspect, not proof a gate passed. |
| Customer / commercial | Lomé field pilot intended; no live customer transaction evidence in repo beyond demo/bounded fixtures. | `v2-field-pilot-*.md`, `docs/omni-production-walkthrough-2026-08-27.md` | `unproven` | Founder | None until Trunk proof. | Do not present demo seed as marketplace traction. |
| Capital / runway | Not in scope; no capital process active. | — | `inactive` | Founder | — | — |
| Opportunity pipeline | None active. | — | `inactive` | — | — | — |
| Release / operations | `omni-v2-rebuild` auto-deploys to Vercel prod; skills bundle merged (#75). No release decision is open. | Git, `vercel.json` | `frozen for product changes` | Founder HQ | Keep prod stable; docs-only PRs until Gate 1 closes. | Any UI/migration PR before Seed acceptance repeats the rushed pattern. |
| Decisions | D-01 facility trust-state model (3 vs 4 vs 6 vs 9 states); D-02 offer/product ontology and naming; D-03 is deterministic auto-availability in V1 and is it Pro-only; D-04 supply location ≠ facility location in V1; D-05 free/paid boundary (bulk 3/month free vs Pro-only); D-06 Buyer/Seller as capabilities of one identity vs role toggle; D-07 which existing Species maquettes survive. | Nature Way handoff `NW-PROD-OMNI-01` | `review now` | Founder | Answer in the Intent Brief confirmation. | Each unresolved decision blocks Root. |

## Current gate

> **Gate 1 — Seed reconciliation + System Dependency Map — open.** Nature Way has returned a draft Intent Brief, a System Dependency Map and a phase diagnosis. The gate closes when the founder confirms the brief and decides D-01…D-07. Nothing else is authorized.

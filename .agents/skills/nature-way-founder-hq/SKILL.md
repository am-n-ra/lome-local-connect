---
name: nature-way-founder-hq
description: Run the Nature Way ecosystem as a founder headquarters and active dispatch layer across product delivery, venture lifecycle, fundraising, opportunity intelligence, founder learning, and optional sidereal reflection. Use when a founder or venture team enters a project through one front door, needs the current stage diagnosed, needs work routed to the correct specialist skill before execution, or needs one operating view across active work. Explicitly dispatches to the primary specialist; it does not replace that skill’s product, evidence, legal, financial, or safety gates.
---

# Nature Way Founder HQ

## Resource loading and attestation

Treat every named `references/` or `templates/` resource as a required input when its stated trigger applies. Load the exact file or directory before performing the dependent work, then include a **Resource Receipt** in the phase output: `Loaded`, `Template instantiated`, and `Not loaded / reason`. Do not claim to have followed a resource that was not loaded. If a required resource is unavailable, state the gap and stop before the gate it controls.

For every active Founder HQ gate, load [references/intra-skill-execution-controller.md](references/intra-skill-execution-controller.md) and instantiate [templates/intra-skill-plan.md](templates/intra-skill-plan.md) for the local work. Record the local plan ID in the Master Plan and require its task/proof handoff before closing the gate.

Use this skill as the **front door, plan owner, and active dispatch layer** to the Nature Way ecosystem. It creates one Founder HQ Master Plan, then delegates execution to the specialist skill that owns each gate. It does not create competing specialist plans, perform a specialist skill’s work, or treat existing code as permission to continue implementation. It identifies the current objective and gate, activates the next specialist in sequence, and synchronizes each returned plan/task/proof handoff so product, capital, opportunity, and personal reflection work do not drift into separate stories.

## Founder HQ Master Plan

Before any substantive venture work, create or reconcile one **Founder HQ Master Plan**. It is the orchestration source of truth, not a duplicate of specialist artifacts. It must contain the venture outcome, current milestone, maturity target, ordered gates, active specialist, dependencies, handoff IDs, task owners, capacity limits, evidence required, and the condition that causes re-planning.

Use the sequence `HQ plan → specialist activation → specialist gate → returned evidence → HQ reconciliation → next specialist`. Keep only one gate and one specialist active at a time unless two independent tracks have separate owners, dependencies, capacity, and proof. Do not mark a gate complete because a specialist was named; close it only after the specialist’s Activation Receipt, Resource Receipt, evidence, residual gap, owner, and next action are returned.

Create the plan with [templates/founder-hq-master-plan.md](templates/founder-hq-master-plan.md). Read [references/ecosystem-orchestration-protocol.md](references/ecosystem-orchestration-protocol.md) before starting a new venture, resuming stale work, or changing the active milestone.

## Non-negotiable dispatch protocol

For every substantive request, classify the user’s objective, current evidence, reversibility, and missing information. Then publish a short **Dispatch Record** containing the primary skill, the reason, any secondary handoff, the known artifacts, and the first required gate.

Immediately activate the named primary skill and let it run its own protocol. State the invocation plainly, for example: `Dispatch: /nature-way — product delivery and phase diagnosis.` Record the activation in the Master Plan and wait for its specialist handoff before opening another specialist gate. Do not continue with specialist planning, code, product advice, capital advice, qualification, or sidereal interpretation under Founder HQ after naming the route.

If the environment cannot invoke the named skill dynamically, say so, give the user the exact skill name to invoke, and stop at the dispatch boundary. Do not simulate the specialist skill or continue around its gates.

## Dispatch activation receipt

A route named in prose is not a successful dispatch. At every handoff, create an **Activation Receipt** containing: primary skill and exact invocation name; activation status (`activated`, `user invocation required`, or `unavailable`); concise handoff input; primary authority/gate; specialist resource requirement; and the expected return artifact. Use [references/ecosystem-activation-manifest.md](references/ecosystem-activation-manifest.md) to select the route and [templates/skill-handoff-receipt.md](templates/skill-handoff-receipt.md) to make the handoff observable.

Only call a route `activated` when the specialist skill is actually available in the current environment and has taken control of its gate. If activation cannot be verified, use `user invocation required` or `unavailable`; do not continue the specialist work under Founder HQ. When the specialist returns, require its Resource Receipt along with the gate, evidence, residual gap, owner, next action, and any plan/task changes. If a required resource is unavailable, block the dependent gate and record the smallest unblocking action.

## Product and existing-project guardrail

Route every request to build, design, develop, refactor, migrate, repair, integrate, launch, or extend a product to **`/nature-way`** before making implementation recommendations or touching code. Nature Way must inspect the repository and authoritative artifacts, create or reconcile a **System Dependency Map**, diagnose the actual structural path and phase, and decide whether Seed, Species/maquette, Root System, Trunk, Heartwood, Branches, Canopy, or Rings work is current. The map must identify what has to exist, be authorized, be populated, and be proven before the most visible child capability can be truthful.

Treat existing code, a prototype, screenshots, or a prior task list as evidence to inspect—not evidence that product framing, a visual maquette, contracts, security, or proof are complete. Preserve valid work, but reopen a missing, stale, or unaccepted Seed, Species, Root, or prerequisite-parent gate before further implementation. If a visible surface is already built while its upstream parents are missing, mark it as an `orphaned leaf`, preserve only what is honest, and rebase the next slice on the highest-leverage missing parent. If the current product direction is not explicitly accepted, stop for the art-direction and maquette decision rather than coding forward blindly.

## The six companions

| Need | Route to | Authority |
|---|---|---|
| Build, fix, launch, scale, or prove a product and its operations | **Nature Way** | Product, causal dependency, data, security, release, customer, and proof gates. |
| Identify the current venture stage, validate demand, test a demo, establish distribution, or frame the next milestone | **Nature Way Venture Lifecycle** | Lifecycle stage, validation, distribution, retention/economics, and scaling-readiness gates. |
| Prepare for a raise, investor process, data room, deck, or closing | **Nature Way Fundraising** | Capital claims, readiness, data room, raise process, and post-close rhythm. |
| Discover or assess a grant, program, partner, pilot, procurement, credit, or other external path | **Nature Way Opportunity Intelligence** | Source verification, fit, capacity, terms, status, and decline rules. |
| Close a capability gap blocking the next milestone | **Nature Way Founder Learning** | Learn/hire/delegate/advisor/tool/defer decision and evidence of capability transfer. |
| Reflect on personal founder rhythm using the selected sidereal framework | **Nature Way Sidereal Reflection** | Non-deterministic prompts only; no product, money, legal, or people-decision authority. |

## Staged ecosystem orchestration

Do not call all six companions for every venture. Select the smallest phase-appropriate sequence from the Master Plan:

| Sequence moment | Primary specialist | Activate next when |
|---|---|---|
| New idea with unclear problem, product intent, or build request | `/nature-way` for product Seed; add `/nature-way-venture-lifecycle` when problem/segment evidence is the uncertainty | Seed/next-proof handoff is returned and the Master Plan names the next gate. |
| Approved product direction and a delivery gate | `/nature-way` | Nature Way returns Species, Root, Trunk, Heartwood, Canopy, or Ring evidence. |
| Venture stage, customer proof, distribution, retention, or scale uncertainty | `/nature-way-venture-lifecycle` | Stage scorecard and next experiment are returned. |
| Capital readiness or investor process | `/nature-way-fundraising` | Product/venture evidence and capital handoff are current. |
| External program, partner, grant, pilot, or procurement path | `/nature-way-opportunity-intelligence` | Source, fit, terms, capacity, and decision are returned. |
| A capability gap blocks the active gate | `/nature-way-founder-learning` | Response decision and transfer evidence are returned. |
| Optional personal reflection | `/nature-way-sidereal-reflection` | It remains private and returns only a non-authoritative prompt/action. |

After every specialist handoff, reconcile the Master Plan before activating another route. The next route is chosen by the **returned gate and evidence**, not by the order in which the skills appear in the pack.

## One board, not four silos

Maintain one **Founder HQ Board** and one **Founder HQ Master Plan**. The Board is a concise index of current truth; the Master Plan is the ordered execution controller. Neither replaces specialist artifacts. Store a short summary and links/IDs to the authoritative proof ledger, product plan, capital-proof packet, data room, opportunity tracker, and optional private reflection ledger.

The board answers only six questions:

1. **What is the active milestone?**
2. **What is the one current gate?**
3. **What evidence says we may advance—or must stop?**
4. **What is the next smallest action and who owns it?**
5. **What external opportunity or capital process is consuming capacity?**
6. **What decision, risk, or dependency needs review next?**

Read [references/founder-hq-board.md](references/founder-hq-board.md) before creating the board, beginning a recurring founder review, or reconciling cross-skill work.

## Portable starter kit

Use the tool-neutral starter kit in [templates/portable-starter](templates/portable-starter) when beginning a venture, moving to a new project/repository, changing a work-management tool, or handing the operating system to a new owner. The kit contains a manifest, a board, and CSV indexes for handoffs, lifecycle/distribution, opportunities, and learning.

1. Copy the starter kit into a private venture workspace.
2. Set the venture ID, time zone, roles, active milestone, primary authority, review cadence, and approved evidence locations in `ecosystem-manifest.yaml`.
3. Create only the authoritative specialist records that the current milestone requires; use the board and CSV files as indexes, not competing copies.
4. Start the first Founder HQ review, name the current gate, and remove stale imported work from the active queue.
5. Before migration or handoff, follow the export/import rules below and preserve access boundaries.

Read [references/portability-protocol.md](references/portability-protocol.md) before exporting, importing, migrating, duplicating, or transferring a Founder HQ workspace.

## Route every new item in one minute

For each new request, first identify its **primary authority**, then any secondary handoffs.

| New item | Primary dispatch | Required first action / typical secondary route |
|---|---|---|
| “Should we build/launch/change this?”, or any feature/code/UI request | `/nature-way` | Build/reconcile the System Dependency Map and diagnose the product phase before implementation; use Opportunity or Fundraising only if a commitment changes. |
| “I have an idea/problem; what must be true before we build?” | `/nature-way-venture-lifecycle` | Diagnose problem evidence and next proof, then hand the selected product slice to `/nature-way`. |
| “What stage are we really at, what must be proven next, or how do we find distribution?” | `/nature-way-venture-lifecycle` | Run the stage/distribution gate; hand a required product slice to `/nature-way`. |
| “Can we raise or talk to investors?” | `/nature-way-fundraising` | Check Nature Way proof and capacity before capital claims or process. |
| “Is this grant/accelerator/partner worth pursuing?” | `/nature-way-opportunity-intelligence` | Verify source, fit, terms, capacity, and required product or capital handoff. |
| “What knowledge, skill, or support are we missing?” | `/nature-way-founder-learning` | Close the gap, then return transfer evidence to the blocked primary gate. |
| “What should I focus on this week?” | Founder HQ | Identify the active gate, then dispatch the action to its primary specialist; optional private sidereal prompt only. |
| “I feel uncertain before this meeting/decision.” | `/nature-way-sidereal-reflection` | Return the factual decision to the product, lifecycle, fundraising, or opportunity authority. |

Do not route a product decision through astrology, an investment decision through a deck, or a grant decision through prestige. If a new item changes data authority, security, capital obligations, or a release commitment, open the appropriate Nature Way decision gate before acting.

## Return handoff to Founder HQ

After the primary skill completes a bounded pass, return only a concise handoff: active milestone, phase/gate, evidence and as-of date, residual gap or blocker, owner, next smallest action, review trigger, Resource Receipt, and task-tree changes. Founder HQ must reconcile these fields into the Master Plan, update the board index, and select the next gate. Store links or IDs to the specialist’s authoritative artifacts; never rewrite its methodology or promote a board summary into a replacement source of truth.

## Commitment budget

Before changing an item from `watch` or `ready` into active work, name what it displaces, its time window, its owner, and the gate that would justify continuing. Founder HQ should prefer one completed proof over several unbounded commitments; when capacity is already committed, pause or decline the new item explicitly.

## Operating cadence

Use a cadence proportionate to the venture stage; do not turn it into bureaucracy.

| Cadence | Founder HQ action | Output |
|---|---|---|
| Daily or start-of-work | Reconfirm the active milestone, current gate, top evidence need, and blocked dependency. | One priority and one protected focus block. |
| Weekly | Review product proof, customer/commercial signal, cash/capital assumptions, active opportunities, capacity, decisions, and risks. | Updated board with no more active work than the team can sustain. |
| Monthly | Reconcile the product milestone, default-alive plan, pipeline, launch/measurement results, and opportunity thesis. | Keep, change, pause, or stop decisions with owners. |
| Event-driven | Run immediately after a customer signal, major failure, launch guardrail breach, material opportunity, investor feedback, or commitment change. | Routed decision and an updated specialist artifact. |

Optional sidereal reflection may be used before or after the cadence as a private prompt. It never replaces the board’s factual review.

## Shared-record rules

| Record | Source of truth | What Founder HQ stores |
|---|---|---|
| Product evidence and decisions | Nature Way proof and decision ledger | Proof IDs, current gate, residual gap, owner. |
| Product launch | Nature Way launch envelope | Exposure, guardrail, observation window, next release decision. |
| Capital evidence and process | Fundraising capital-proof packet, claim ledger, and contingency plan | Raise stage, milestone, capacity cost, next capital gate. |
| External opportunities | Opportunity Intelligence tracker and qualification cards | Current status, deadline, fit, veto/dependency, next action. |
| Venture stage and distribution | Venture Lifecycle scorecard and experiment register | Current stage, next proof, distribution thesis, and milestone owner. |
| Capability development | Founder Learning capability map and practice plan | Active gap, response, transfer evidence, and review point. |
| Personal reflection | Sidereal Reflection Ledger | Nothing by default; only a user-chosen non-sensitive action or boundary. |

Never duplicate sensitive personal, customer, personnel, financial, or legal detail in the Founder HQ Board. Link to its authoritative record and preserve its access controls.

## Migration and transfer rule

Move the **operating index**, not unrestricted underlying data. The portable package may include stable IDs, summaries, owners, dates, access classes, and current gates. Keep secrets, birth data, raw customer data, sensitive finance/legal records, credentials, and restricted third-party material in their approved source-of-truth systems. On import, revalidate freshness, reassign access, and reopen decisions whose review triggers have passed.

## Founder HQ decision rule

Advance work only when the primary authority’s gate passes. When two tracks conflict, protect the active product/customer commitment, safety, legal, and evidence boundaries first. Explicitly pause, defer, or decline the lower-value item rather than keeping it “active” without capacity.

## Start-of-review template

> **Active milestone:** `<user-visible or capital milestone>`  
> **Current gate:** `<Nature Way / Fundraising / Opportunity Intelligence gate>`  
> **Evidence:** `<proof ID, source, as-of date, residual gap>`  
> **Capacity:** `<active work and what it displaces>`  
> **Decision needed:** `<reversible / hard to reverse / high stakes>`  
> **Next owner/action:** `<one smallest action>`  
> **Optional reflection:** `<private prompt or boundary; never decision authority>`

## Definition of done

Call the Founder HQ review complete only when the active milestone and primary gate are clear, the Founder HQ Master Plan exists and identifies exactly one active gate or an explicitly justified independent pair, current proof and residual gaps are linked, each active external track has an owner and capacity cost, specialist activation and Resource Receipts are recorded, sensitive records remain in their authoritative locations, and the next action is small, owned, and compatible with the venture’s evidence and commitments.

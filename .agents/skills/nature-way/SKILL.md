---
name: nature-way
description: "A founder-autonomous full-stack product delivery method modeled on how trees grow. Use it to take a web app, mobile app, backend service, product, or feature from a vague idea through guided discovery, accepted visual maquettes, technical contracts, a self-maintaining plan and task tree, vertical slices, debt control, production evidence, and controlled release. Use whenever a founder or team asks to build, plan, extend, redesign, migrate, refactor, debug, correct incoherence, or release a product end-to-end; needs an AI-led path from idea to production readiness; requests a PRD, design blueprint, architecture plan, roadmap, production audit, or technical-debt review; invokes Nature Way; or reports code that works incompletely, looks inconsistent, contains mock-only behavior, has unclear scope, repeated redesign, untracked work, or unverified completion. Do not promise commercial success, universal safety, or compliance; require targeted qualified review for high-risk decisions."
---

# Nature Way

## Resource loading and attestation

Treat every named `references/` or `templates/` resource as a required input when its stated trigger applies. Load the exact file or directory before performing the dependent work, then include a **Resource Receipt** in the phase output: `Loaded`, `Template instantiated`, and `Not loaded / reason`. Do not claim to have followed a resource that was not loaded. If a required resource is unavailable, state the gap and stop before the gate it controls.

## Founder HQ integration

When a venture has simultaneous product, capital, opportunity, and founder-rhythm work, begin with **Nature Way Founder HQ** to identify the active milestone, capacity, primary authority, and next gate. Nature Way remains the authority for product, data, security, release, customer, and proof decisions; do not replace its gates with a board summary.

## Ring handoff snapshot

At the end of every material ring, publish a compact handoff snapshot: current proof IDs and classes, residual gap, affected customer/distribution assumption, release state, owner, and review trigger. This lets Founder HQ, Venture Lifecycle, Fundraising, Opportunity Intelligence, and Founder Learning use the same current product truth without copying the full product record.

## Core idea

Grow software like a healthy tree. Roots support the trunk, the trunk carries the branches, and only then does the canopy expand. Never build a visible interface without the data and logic that powers it, and never build backend logic without the interface and evidence that expose it. The default unit of delivery is a **complete vertical slice**: interface, data, server, integration, hardening and proof are present together.

Nature Way prevents two recurring failures:

1. Functionality works but the UI is unusable, inconsistent or confusing.
2. The UI looks right but uses mock data, missing permissions or disconnected backend behavior.

Do not compensate for an unclear product with premature code. Make the current phase, structural path, dependencies and definition of done explicit. Do not call a slice complete until it works end-to-end with real or explicitly bounded data, handles obvious loading/empty/error/retry/cancel/locked/recovery states, matches its approved design direction and meets the accessibility baseline.

## Founder-autonomous delivery posture

Translate technical work into clear founder decisions, but do not hide the decision, risk, or residual gap. Start from the founder’s intent, guide the questions needed to make the next choice, propose reversible hypotheses where facts are missing, and obtain confirmation before crossing a material gate. A founder does not need to know the technical task list in advance; Nature Way must create and explain it.

Use **one gate, one decision, one vertical slice**. At every pass, name the current phase, authoritative artifact, riskiest uncertainty, smallest evidence-producing action, stop condition, owner, and next gate. Create and maintain an execution plan with dependency-aware tasks and subtasks before substantial work begins; do not leave the founder to infer the work sequence. Do not repeat an accepted analysis without a review trigger, build broad parallel backlog branches, or use code volume, screenshots, or a passing build as evidence of product maturity.

Read [references/autonomous-delivery-gates.md](references/autonomous-delivery-gates.md) before setting a maturity claim, accepting a phase, preparing a release, or calling anything production-ready. Read [references/risk-and-escalation-matrix.md](references/risk-and-escalation-matrix.md) whenever the work affects payments, sensitive data, security, regulated activity, minors, destructive change, or an incident.

## Fractal principle: every scale repeats the whole

The phases below are both the global product method and a recursive method for any unit of work. A feature is a smaller tree inside the product; a flow is a smaller tree inside a feature; a state, operation or subtask may contain another smaller tree. There is **no fixed recursion-depth limit**.

At the structural level being executed, identify:

- **mini-seed:** what this unit must do, for which actor, and why;
- **mini-species:** what this unit should look and feel like when its design is non-obvious or introduces a new interaction pattern;
- **mini-root:** data shape, API contract, permissions, invariants and dependencies;
- **mini-trunk:** the core case working end-to-end through real or bounded data;
- **mini-heartwood:** validation, authorization, edge states, duplicate/retry/back/cancel/recovery behavior and negative proof;
- **mini-canopy:** visual hierarchy, responsive behavior, accessibility, performance and interaction polish;
- **ring decision:** evidence, residual gaps, rollback/ownership and whether the parent may accept the unit.

Use an explicit structural path such as `product > feature > flow > state > operation > subtask`. Recurse to whatever depth the work genuinely requires. Continue decomposing while a nested unit has its own meaningful objective, dependency, design decision, contract, state transition, failure mode, owner or proof gate. Stop at the smallest coherent unit that can be implemented, reviewed and proven without losing context.

Different branches may have different depths. A checkout, transaction, map, Auth or payment flow may require several nested cycles; a genuinely simple one-endpoint change may need only a brief mini-seed, mini-root, mini-trunk and direct proof. Do not force ceremony onto trivial work, and do not keep complex work artificially shallow.

## Intra-skill plan and task tree

Before substantive work inside any phase or nested unit, create or reconcile a local plan under the controlling product artifact. Use the structural path `product > feature > flow > state > operation > task > subtask`; extend it only when the child has its own objective, dependency, decision, state transition, failure mode, owner, or proof gate. Attach acceptance, expected proof, risk/debt boundary, owner, and re-plan trigger to every executable unit.

Use `todo → ready → in_progress → review → verified → done`, with `blocked`, `partial`, `manual`, or `deferred` when accurate. A child requires proof to close, and a parent requires its own acceptance and gate proof even when all children are complete. Re-plan when evidence, intent, dependencies, capacity, risk, or a gate condition changes; preserve valid evidence, reopen only affected descendants, reconcile the controlling artifact first, and report the task-tree changes. Read [references/intra-skill-planning-protocol.md](references/intra-skill-planning-protocol.md) when creating a nested plan, splitting a task, or preparing a handoff.

## Growth phases

Work through these phases in order at the global level and repeat the relevant cycle at every nested level selected by the structure. A phase may be skipped only when its output is already authoritative, current and explicitly accepted. Never skip a missing gate merely because a later artifact or screen looks complete.

### Phase 0 — Seed: vision and PRD

Run a guided **intent discovery** before drafting a PRD, a maquette, or code. Use short conversational loops rather than a generic interrogation. Rephrase the founder’s intent after each loop, distinguish a user need from the proposed solution and features, and ask only questions that may change the critical journey, architecture, safety, experience, or proof. When a non-critical fact is absent, record a visible, reversible, dated hypothesis instead of blocking progress.

Clarify the trigger for the idea, affected actors and context, current alternatives/workarounds, desired human or operational outcome, harms to avoid, constraints and resources, non-goals, unknowns, and the smallest journey that could prove value. If problem evidence, target segment, or the next proof remains unclear, remain in Seed or hand off to Venture Lifecycle; do not use a polished maquette or early code to conceal the uncertainty.

Capture the compressed genetic code for the work before implementation:

- the problem, target actors and context;
- the single core journey the product or slice must perform well;
- measurable success criteria and what production-ready means here;
- explicit non-goals, manual boundaries, deferred scope and assumptions;
- the user-visible value and the failure that must not be shipped.

Output or reconcile a concise **Intent Brief**, founder mission contract, and PRD. The Intent Brief must be understandable and correctable by the founder before Species or Root work begins. If ambiguity could change architecture, security, money, data authority, irreversible behavior or the critical journey, ask focused questions before coding. If authoritative product documents already exist, inspect and reconcile them rather than restarting them silently.

Read [references/founder-intent-discovery.md](references/founder-intent-discovery.md) when the starting point is an idea, an ambiguous product request, an assumed solution, a conflicting founder objective, or undocumented existing work. Use [templates/intent-brief.md](templates/intent-brief.md) and [templates/founder-mission-contract.md](templates/founder-mission-contract.md) to close Seed.

### Phase 1 — Species: design blueprint

Decide what kind of product experience is being grown before implementation determines it accidentally. The Species phase is the visual and experiential counterpart to the Root System’s technical contract. It must produce an actual agreed visual maquette, not only a prose mood description, before the Trunk builds the product’s pixels.

Define, as applicable:

1. **Art direction options.** When the user has not already supplied a direction, propose two or three genuinely distinct options covering typography, palette, brand treatment, component language, density and tone. Present choices and wait for the direction to be selected. When the user supplies a reference, treat it as the candidate direction to analyze, formalize and confirm rather than silently replacing it.
2. **Locked design system.** Define the type scale, color tokens, semantic colors, spacing, component shapes, iconography, material, motion and responsive rules. This is the product’s visual DNA; every screen inherits it.
3. **Complete visual maquette.** Work through every planned screen and key interaction state, not only the happy-path Trunk. Produce actual screen mockups when image generation is available; otherwise write precise, ready-to-use generation prompts or detailed screen specifications. Iterate until the set is genuinely agreed.
4. **Experience contract.** Define information hierarchy, navigation, surface ownership, platform conventions, accessibility, safe areas, touch, keyboard and reduced-motion behavior, plus the boundary between approved decisions and implementation detail.
5. **Reference register.** Record the user-provided images, examples, mood boards, generated mockups and accepted revisions that the maquette must preserve.

Output the Species blueprint and an approved maquette set or, where direct image generation is unavailable, the exact prompts/specifications that reproduce every required screen and state. Treat the maquette as the visual reference DNA for the Trunk and every later Branch; do not improvise a screen’s look while implementing business logic. If no direction exists, stop after presenting the two or three options until one is selected.

At nested levels, run mini-species only when the unit introduces a genuinely new visual or interaction pattern. Check the unit against the parent maquette first; generate a new screen mockup or precise prompt only when the pattern is genuinely new, then record inheritance or the approved extension explicitly.

### Phase 2 — Root System: load-bearing foundation

Define the invisible contracts before writing UI or server behavior:

- data model, invariants, constraints, indexes, migrations and retention rules;
- API request/response/state/error contract, written before either client or server implementation;
- authentication, authorization, actor ownership, privacy and trust boundaries;
- architecture, stack, hosting, integrations and the reasoning behind consequential choices;
- environment variables, secrets handling, feature flags, observability and rollback boundaries;
- idempotency, concurrency, auditability, correlation IDs and recovery strategy;
- representative fixtures, their scope/labels and the rule preventing fixtures from appearing as production claims.

Treat the API contract as the interface between roots and trunk. Mark every temporary adapter, manual operation, bounded fixture and external dependency explicitly. Preserve existing users, identities, historical records and legacy tables by default; destructive migration requires a separately confirmed, documented decision.

### Root upgrade — decision ownership and expiry

For every material architectural, data-authority, security, rollout, platform, or integration decision, record the evidence, owner, alternatives rejected, downstream artifacts, and the condition that requires reconsideration. A decision that can silently age must have a review date or a concrete event trigger. Do not let an old implementation shortcut become an invisible product rule.

### Root upgrade — anti-debt and technical stewardship

Before a material integration, identify the source of truth, invariants, contract version, compatibility/migration path, authorization boundary, dependency owner, observability, rollback, and cost/capacity implication. Reuse a proven component, type, endpoint, table, or state boundary before creating a competing one. Mark every mock, manual operation, temporary adapter, unproven dependency, or shortcut as `bounded`, `manual`, `temporary`, or `blocked`, with an owner and removal/review trigger.

For a consequential architecture, API, schema, integration, or deployment decision, run the proportionate technical-lead review and record options, trade-offs, tests, rollout, rollback, and the reason not to choose the alternatives. Read [references/technical-lead-production-review.md](references/technical-lead-production-review.md) before that review.

### Phase 3 — Trunk: one complete core journey

Select the highest-value journey from the Seed and implement it vertically, matching the Species blueprint:

1. Build the authoritative server operation against the real database or explicitly bounded adapter.
2. Build the actual screens and states that call the operation, not a clickable illusion.
3. Wire the UI, API, database, Auth and deployment in production-like conditions.
4. Prove the journey with representative data and at least one browser or integration test.

A trunk that exists only as a backend, frontend mockup or fixture-driven illusion is a broken stem. Do not branch until the core journey works from UI to database, matches the agreed blueprint and respects its privacy and authorization boundaries.

### Phase 4 — Heartwood: harden the trunk

Strengthen the core before adding breadth:

- validate inputs and outputs at every trust boundary;
- enforce authorization and actor ownership server-side;
- implement loading, empty, error, retry, cancel, locked, success and unavailable states;
- handle duplicate submissions, concurrency, refresh, back navigation, expired context and interrupted sessions;
- add smoke, negative, recovery and boundary tests;
- sanitize user content and prevent secrets from client bundles, logs, fixtures and evidence;
- verify responsive layout, focus order, keyboard/touch ergonomics, reduced motion and accessible names;
- inspect production logs and external dependencies without claiming more than the evidence shows.

A demo path is not a production path until its obvious failures are designed, tested and recoverable.

### Heartwood upgrade — proof ladder and residual-gap discipline

Classify evidence as observed, reproduced, bounded, external, manual, or unproven. Tie every material proof to its acceptance criterion, method, environment/data basis, owner, as-of date, and residual gap. Do not upgrade a bounded fixture result into a production claim, or treat a screenshot as proof of a server-side rule. Record the proof class in the slice and release record so later product, fundraising, and operations work inherits reality rather than presentation.

Read [references/proof-and-decision-ledger.md](references/proof-and-decision-ledger.md) when a unit introduces a consequential decision, an external dependency, production-like proof, a manual operation, or investor-facing product evidence.

### Heartwood upgrade — coherence and debt correction

Before closing a material slice, compare the approved maquette, rendered interface, component system, state transitions, displayed data, server rules, authorization, errors, and recovery. Trace inconsistency to its source—Species, contract, client state, server rule, data, or operation—and correct the source rather than cosmetically masking the symptom.

Classify discovered debt as visual, logical, technical, data, security, operations, or documentation. Record severity, user/risk impact, correction cost, owner, disposition, and review trigger. Do not close or defer high-severity debt silently. Read [references/visual-and-logic-coherence-review.md](references/visual-and-logic-coherence-review.md) for mismatch/debugging work, and [references/anti-slop-and-debt-review.md](references/anti-slop-and-debt-review.md) before calling a slice clean or ready.

### Phase 5 — Branches: one feature at a time

Sequence additional features instead of building shallow parallel tracks. For each feature, run the full nested cycle:

1. Select one feature and confirm its dependencies and parent gate.
2. Run its mini-seed and inherit or define its mini-species blueprint.
3. Write or update its data, API, permission and acceptance contract.
4. Build its UI and backend together and integrate it with the trunk state machine.
5. Add validation, permissions, async states, recovery, analytics and operational ownership as applicable.
6. Verify with unit, integration, browser, responsive and negative evidence.
7. Update the execution plan/task tree, backlog, proof record and release implications; close, split, defer, or reopen tasks based on evidence.
8. Start the next branch only after the current branch is verified or explicitly blocked/deferred.

If a phase inside the nested unit is itself substantial, recurse again before treating it as complete. Never leave an API without a reachable UI or a UI without a real operation while claiming the feature is done. If a manual or backend-only boundary is unavoidable, label it `manual`, `partial` or `blocked` and identify its owner.

### Phase 6 — Canopy: polish and quality

After the required branches work, perform the holistic pass:

- visual hierarchy, spacing, typography, color, contrast and component consistency;
- consistency with the Species blueprint and any approved extensions;
- responsive behavior, dynamic viewport/safe areas and touch/focus ergonomics;
- transitions, micro-interactions, reduced-motion behavior and honest empty-state copy;
- accessibility names, announcements, focus order and keyboard/back ownership;
- performance, loading behavior, query efficiency, bundle size and cache strategy;
- observability, support tooling, runbooks, rollback and operational readiness.

Do not use polish to conceal missing contracts, disconnected functionality, fake data or unproven permissions.

### Canopy upgrade — launch envelope and reversible rollout

Before a material release, define the intended outcome, success signal, guardrail, exposure, rollout sequence, observation window, reversal path, owner and communication plan. Release to the smallest safe audience when risk or uncertainty warrants it. Expand only when the success signal and guardrails support expansion; pause, reverse, or escalate when they do not.

Read [references/launch-envelope.md](references/launch-envelope.md) for a launch, migration, feature exposure, externally visible milestone, or other change that must be measured and recoverable.

### Canopy upgrade — maturity verdict and operational readiness

Classify the result truthfully as `prototype`, `pilot-ready`, `production-candidate`, `production-ready`, or `production-verified`; never use a higher label because the interface looks complete. Tie the verdict to the intended scope, evidence register, known limits, security/privacy controls, performance/cost expectations, monitoring, support/runbook, backup/recovery where applicable, rollout, and rollback.

Issue an explicit `Go`, `Go with limits`, or `No-go` decision. A production claim must name the as-of date, evidence basis, residual gaps, exposure limits, owner, and review trigger. Use [templates/production-evidence-register.md](templates/production-evidence-register.md) for the evidence and decision record.

### Phase 7 — Rings: release and iteration

Release only after the applicable Seed, Species, Root System, Trunk, Heartwood, Branches and Canopy gates pass. Record the release commit, environment, deployment, test evidence, known limitations, rollback path and owner.

A future request becomes a new ring around the stable core and repeats the relevant cycle at its actual structural depth. Revisit Species when the request introduces a real visual or interaction change. Revisit the Root System when it changes data authority, security, architecture, money, persistence or migration. Do not silently restructure roots or weaken the trunk to bolt on a feature.

## Operating rules

- **Maquette before pixels, contract before code.** For anything visual, build and check against the approved Species maquette or its exact written prompt/specification. For anything crossing the UI/backend boundary, define the interface before writing either side.
- **No orphaned layers.** Do not call backend-only, frontend-only, mock-only or design-only work a complete feature. State the boundary plainly.
- **One trunk, sequenced branches.** Prefer depth on the active slice over many partial features. Do not parallelize work that cannot be independently integrated and proven.
- **One source of truth per concern.** Reconcile Seed/PRD, flow/state, blueprint, Root System, plan, backlog and proof documents before coding when they disagree. Do not maintain competing masters.
- **Real versus bounded data.** Use real production-like data when available; otherwise label fixtures, bound their scope and never use them to claim marketplace, user or operational success.
- **Server authority.** UI visibility is not authorization. Trust, price, stock, money, status, identity, QR validity and transaction transitions must be enforced server-side.
- **Preserve by default.** Do not delete users, identities, historical tables or records to make a new slice easier. Require explicit confirmation for destructive changes and record the decision.
- **Evidence over optimism.** A passing build is not a passing journey. A screenshot is not proof of Auth. A seeded row is not proof of real users. Report exact evidence and residual gaps.
- **Correct root causes.** Resolve visual, logical, data, and technical inconsistencies at the controlling artifact or rule; do not paper over them with local styling, duplicate state, or a second implementation.
- **Debt must be explicit.** Classify, own, prioritize, and revisit debt. A temporary shortcut without a boundary and trigger is hidden product risk, not a delivery acceleration.
- **Maturity is scoped.** State the product scope, environment, evidence class, exposure, and known limitations behind every readiness claim. `Production-ready` is never a synonym for “deployed.”
- **Decisions must age visibly.** Give every material decision an owner, evidence, downstream impact, and review trigger or expiry. Reopen it when that trigger occurs.
- **Definition of done per unit.** The unit works end-to-end, handles obvious failure and recovery states, matches its blueprint, is accessible at required breakpoints and has its proof artifact updated.
- **No hidden environment work.** Keep credentials out of chat, source control, public bundles, screenshots, logs and evidence. If deployment or connector configuration is manual, mark it manual and identify the next human action.
- **Release must be controlled.** Define a success signal, guardrail, observation window, owner and reversal path before materially exposing a change.
- **Stop at a gate.** If a required dependency, decision or proof is missing, stop the next phase and present the blocker instead of redesigning around it.

## Required artifacts

For a substantial product or feature, create or reconcile these artifacts. Keep them concise and link every task to a feature ID and acceptance criterion.

| Artifact | Purpose |
|---|---|
| Intent Brief | Founder-confirmed problem, actors, desired outcome, alternatives, constraints, non-goals, hypotheses, and next proof |
| Founder mission contract | Founder decisions, AI responsibilities, maturity target, scope boundary, success signal, and next gate |
| PRD / Seed | Problem, actors, core journey, success, non-goals and production meaning |
| Species / design blueprint | Approved art direction, maquette set, visual language, surface ownership, platform and interaction rules |
| Flow/state contract | Actors, states, transitions, permissions, locks and recovery |
| Root System / interface architecture | Schema, invariants, API, UI contracts, system boundaries and dependencies |
| Implementation plan | Dependency-ordered vertical slices, phase gates and evidence plan |
| Execution plan and task tree | Gate-linked plan, tasks, subtasks, dependencies, owners, status, acceptance, proof, and replan triggers |
| Task backlog | Feature-linked tasks/subtasks, priority, owner, status, blocker and evidence |
| Proof record | Commands, API responses, browser assertions, screenshots, logs and residual gaps |
| Proof and decision ledger | Evidence class, acceptance linkage, data basis, residual gap, decision owner and revisit trigger |
| Coherence and debt register | Visual, logical, technical, data, security, operations, and documentation debt with owner, disposition, and review trigger |
| Production evidence register | Maturity verdict, acceptance evidence, operating readiness, limits, rollout, rollback, and Go/No-go decision |
| Launch envelope | Outcome, metric baseline, guardrail, exposure, rollout rule, observation window, reversal and communication owner |
| Release record | Commit, environment, deployment, rollback, monitoring, acceptance and owner |

Do not create duplicate master documents merely to avoid reconciling an existing authority. If an existing artifact is authoritative, update it or record a focused amendment. If a blueprint is unnecessary because the parent design is explicit and unchanged, record that inheritance.

## Tracking model

Use explicit statuses: `todo`, `ready`, `in_progress`, `blocked`, `review`, `verified`, `done`, `partial`, `deferred` and `manual`.

A feature is `verified` only when its stated evidence exists. Use `done` only when its slice gate and release conditions are closed. After every substantive pass, record what changed, what was proven, what remains and why. Never turn an unresolved limitation green for momentum.

Track these activities as needed for every feature:

- Seed/objective and acceptance criteria;
- Species/blueprint and interaction states;
- data/schema/migration;
- server operation and authorization;
- UI states and responsive treatment;
- integration with the product state machine;
- unit/integration/E2E proof;
- operations, recovery and ownership.

## Execution controller: plan, tasks, and subtasks

Before substantial discovery, design, engineering, refactor, migration, debugging, or release work, create an **Execution Plan and Task Tree**. Derive it from the Intent Brief, current gate, structural path, Species, Root System, risk classification, and maturity target; do not derive it merely from files that happen to exist.

Structure the work as `milestone → gate → vertical slice → task → subtask`. Keep a task at the smallest coherent scope that can have one clear owner, one dependency boundary, one testable outcome, and one proof update. Split work that combines unrelated actor outcomes, interfaces, contracts, data changes, risk decisions, or proof methods. Do not manufacture subtasks where the work is genuinely atomic.

Every task and subtask must include: stable ID; structural path; Nature Way phase/gate; objective; parent; status; priority; owner; predecessor/dependency; acceptance criterion; expected proof; risk/debt boundary; and the event that requires re-planning. Use `blocked` only with a named blocker, owner, and smallest unblocking action. Use `done` only after the required evidence is linked; use `partial`, `manual`, or `deferred` when that truth is more accurate.

Default to one active vertical slice at a time for a solo founder. Do not start a dependent task while its prerequisite gate is open, and do not expand the plan into a long feature wish list. Keep future ideas in a separate `watch` or `deferred` queue with a review trigger; they do not become active merely because they are plausible.

Re-plan immediately after a failed or contradicting proof, a changed founder intent, new customer evidence, a material design/contract change, a security/privacy finding, a dependency failure, a new incident, a scope decision, or a release-guardrail breach. Preserve completed proof, invalidate only the affected assumptions/tasks, state what changed and why, then rebuild the smallest dependency-correct path. Never silently continue an outdated plan.

If the working environment provides its own plan or task mechanism, mirror the active task tree there and keep it synchronized after each material pass. The authoritative product artifacts and proof remain the source for acceptance; the plan is the execution controller, not a substitute for evidence.

Read [references/execution-controller.md](references/execution-controller.md) before creating or re-planning a substantial project, feature, refactor, migration, debugging effort, or release. Use [templates/execution-plan-and-task-tree.md](templates/execution-plan-and-task-tree.md) to create the first plan and update it after every gate.

## Execution protocol

When applying Nature Way to a real task:

1. **Discover and inspect.** For a new or unclear initiative, run the Seed intent-discovery loops and obtain an Intent Brief. Read the authoritative documents, repository, existing tests, integrations, environment/deployment state and current proof. Treat existing code as evidence to inspect, not proof that a preceding phase passed.
2. **Reconcile and classify.** Identify contradictions, stale documents, unsupported UI claims, missing dependencies, incoherent logic, visual debt, technical debt, risk level, maturity target, and the smallest coherent slice. Amend the controlling source of truth before implementation if needed.
3. **Frame and plan.** Tell the founder the current structural path and depth, phase, objective, dependencies, non-goals, maturity target, risk/escalation boundary, and definition of done. Create the dependency-ordered execution plan/task tree, name the single active slice, and identify its proof before implementation. If Species is not approved, present the art-direction options and maquette work before implementation.
4. **Grow the slice.** Execute the next ready task/subtask only when its dependency and parent gate allow it. Complete the relevant Seed, Species, Root System, Trunk, Heartwood and Canopy work for the selected unit. Preserve stable unrelated behavior.
5. **Prove and correct progressively.** Run focused unit and boundary tests first, then build, API/integration checks, browser/responsive proof, visual/logical-coherence review, real deployment checks and operational inspection. Diagnose and correct failures at their source rather than weakening assertions.
6. **Update and re-plan.** Record the result in the task tree/backlog, proof, decision, coherence/debt, and release records. Close, split, defer, or reopen affected work from the new evidence; state why the plan changed. Commit only intended changes. Keep secrets and temporary artifacts out of the repository.
7. **Gate.** Advance only when the phase definition of done is satisfied. If blocked, state the blocker, evidence, owner and smallest next action.
8. **Report.** Summarize completed work, exact evidence, known limitations, rollback/recovery path and the next gated slice. Never claim the whole product is production-ready because one ring passed.

## Start-of-slice template

Use this concise structure before implementation:

> **Structural path:** product > feature > nested unit(s)  
> **Phase:** Seed / Species / Root System / Trunk / Heartwood / Branch / Canopy / Ring  
> **Slice:** one sentence describing the user-visible outcome  
> **Dependencies:** blueprint, contracts, data, Auth, integrations and manual gates  
> **Non-goals:** explicitly deferred work  
> **Definition of done:** end-to-end behavior, failure/recovery states, blueprint match, accessibility baseline and proof artifacts

## End-of-slice template

Use this structure after implementation:

> **Status:** verified / partial / blocked / manual  
> **Changed:** files, contracts, migrations and deployed surfaces  
> **Proven:** commands, API behavior, browser widths/states, visual checks and operational evidence  
> **Not proven:** exact protected, external, human or production conditions still open  
> **Preserved:** users, identities, historical data and unrelated stable behavior  
> **Next gate:** one dependency-ordered action, not a broad redesign

## When invoked on existing work

Read what exists and identify the actual phase and structural depth. Do not restart Seed, Species or Root System when authoritative artifacts remain valid, but do not trust stale prototype documents, fixture-only success or undocumented assumptions. Reconcile them and open a new Roots decision only when a foundational change is genuinely required.

If the user asks to skip directly to UI polish, explain that this recreates the failure Nature Way prevents. Follow the explicit request only if the user confirms, mark the resulting contract/backend/proof gap and do not call the result production-ready.

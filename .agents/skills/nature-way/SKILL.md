---
name: nature-way
description: "A full-stack product development method modeled on how trees grow, used to take web apps, mobile apps, backend services, products and features from idea to a genuinely production-ready state without gaps between UI, backend, data, permissions, recovery or proof. The method is fractal: the same Seed-to-Rings pattern repeats at the product level and at every nested work-item level required by the structure. Use whenever the user asks to build, plan, extend, redesign, migrate, refactor or release a product or feature end-to-end; requests a PRD, architecture plan, roadmap or production readiness; invokes Nature Way; or reports a working prototype with poor UI, attractive UI with missing logic, undocumented scope, repeated redesign or unverified completion."
---

# Nature Way

## Core principle

Grow software like a healthy tree. Roots support the trunk, the trunk carries the branches, and only then does the canopy expand. Never build a visible interface without the data and logic that powers it, and never build backend logic without the interface and evidence that expose it. The default unit of delivery is a **complete vertical slice**: contract, data, server, UI, integration, hardening and proof are present together.

Nature Way prevents two recurring failures:

1. Functionality works but the UI is unusable, inconsistent or confusing.
2. The UI looks right but uses mock data, missing permissions or disconnected backend behavior.

Do not compensate for an unclear product with premature code. Make the current phase, current level, dependencies and definition of done explicit to the user. Do not call a slice complete until it works end-to-end with real or explicitly bounded data, handles obvious loading/empty/error/retry/cancel/locked/recovery states, and meets the product’s visual and accessibility baseline.

## Fractal principle: every scale repeats the whole

The six growth phases are both a global product method and a recursive method for any unit of work. A feature is a smaller tree inside the product, and each meaningful nested unit is a smaller tree inside its parent. There is no fixed recursion-depth limit.

At the level that is actually being executed, identify:

- **mini-seed:** what this unit must do, for which actor, and why;
- **mini-root:** data shape, API contract, permissions, invariants and dependencies;
- **mini-trunk:** the core case working end-to-end through real or bounded data;
- **mini-heartwood:** validation, authorization, edge states, duplicate/retry/back/cancel/recovery behavior and negative proof;
- **mini-canopy:** visual hierarchy, responsive behavior, accessibility, performance and interaction polish;
- **ring decision:** evidence, residual gaps, rollback/ownership and whether the next unit may start.

Use an explicit structural path in the working plan, such as `product > feature > flow > state > operation > subtask`, and recurse to whatever depth the work genuinely requires. Continue decomposing while a nested unit has its own meaningful objective, dependency, contract, state transition, failure mode, owner or proof gate. Stop at the smallest coherent unit that can be implemented, reviewed and proven without losing context. Do not force a trivial one-endpoint change through unnecessary ceremony, and do not keep a complex flow artificially shallow. Different branches may have different depths; a substantial checkout, transaction, map, Auth or payment flow may require several nested micro-cycles before it belongs in its parent branch.

## Growth phases

Work through these phases in order at the global level and repeat the relevant miniature cycle at every nested level selected by the structure. Do not start a later phase while the current gate is only a mockup, an isolated backend, an unverified deployment or a visual concept.

### Phase 0 — Seed: vision and PRD

Capture the compressed genetic code for the work before implementation:

- one-paragraph problem statement and target actors/context;
- the single core journey this version or slice must perform well;
- measurable success criteria and what production-ready means here;
- explicit non-goals, manual boundaries, deferred scope and assumptions;
- the user-visible value and the failure that must not be shipped.

Output or reconcile a concise PRD. If ambiguity could change architecture, ask focused questions before coding. If authoritative product documents already exist, inspect and reconcile them rather than restarting them silently.

### Phase 1 — Roots: load-bearing foundation

Define the invisible contracts before writing UI or server behavior:

- data model, invariants, constraints, indexes, migrations and retention rules;
- API request/response/state/error contract, written before either client or server implementation;
- authentication, authorization, actor ownership, privacy and trust boundaries;
- architecture, stack, hosting, integrations and the reasoning behind consequential choices;
- environment variables, secrets handling, feature flags, observability and rollback boundaries;
- idempotency, concurrency, auditability, correlation IDs and recovery strategy;
- representative fixtures, their scope/labels and the rule preventing fixtures from appearing as production claims.

Treat the API contract as the interface between roots and trunk. Mark every temporary adapter, manual operation, bounded fixture and external dependency explicitly. Preserve existing users, historical records and legacy tables by default; destructive migration requires a separately confirmed, documented decision.

### Phase 2 — Trunk: one complete core journey

Select the highest-value journey from the Seed and implement it vertically:

1. Build the authoritative server operation against the real database or explicitly bounded adapter.
2. Build the actual screens and states that call the operation, not a clickable illusion.
3. Wire the UI, API, database, Auth and deployment in production-like conditions.
4. Prove the journey with representative data and at least one browser or integration test.

A trunk that exists only as a backend, only as a frontend mockup or only as seeded fixtures is a broken stem. Do not branch until the core journey works from UI to database and its privacy/authorization boundaries are proven.

### Phase 3 — Heartwood: harden the trunk

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

### Phase 4 — Branches: one feature at a time

Sequence additional features instead of building shallow parallel tracks. For each feature:

1. Select one feature and confirm its dependencies and parent gate.
2. Run its mini-seed and write or update its data/API/permission contract.
3. Build its UI and backend together and integrate it with the trunk state machine.
4. Add validation, permissions, async states, recovery, analytics and operational ownership as applicable.
5. Verify with unit, integration, browser, responsive and negative evidence.
6. Update the backlog, proof record and release implications.
7. Start the next branch only after the current branch is verified or explicitly blocked/deferred.

Never leave an API without a reachable UI or a UI without a real operation while claiming the feature is complete. If a manual or backend-only boundary is unavoidable, label it as `manual`, `partial` or `blocked` and identify its owner.

### Phase 5 — Canopy: polish and quality

After required branches work, perform the holistic quality pass:

- visual hierarchy, spacing, typography, color, contrast and component consistency;
- responsive behavior, dynamic viewport/safe areas and touch/focus ergonomics;
- transitions, micro-interactions, reduced-motion behavior and honest empty-state copy;
- accessibility names, announcements, focus order and keyboard/back ownership;
- performance, loading behavior, query efficiency, bundle size and cache strategy;
- observability, support tooling, runbooks, rollback and operational readiness.

Do not use polish to conceal missing contracts, disconnected functionality, fake data or unproven permissions.

### Phase 6 — Rings: release and iteration

Release only after the applicable Seed, Roots, Trunk, Heartwood, Branches and Canopy gates pass. Record the release commit, environment, deployment, test evidence, known limitations, rollback path and owner. A future request becomes a new ring around the stable core and repeats the feature-level cycle.

Do not silently restructure roots or weaken the trunk to bolt on a feature. If a new requirement needs foundational change, stop and open an explicit new Roots decision with migration, compatibility, rollback and preservation analysis.

## Operating rules

- **Contract before implementation.** Any UI/backend boundary needs a written request, response, state, error and permission contract before either side is coded.
- **One trunk, sequenced branches.** Prefer depth on the active slice over many partial features. Do not parallelize work that cannot be independently integrated and proven.
- **No orphaned layers.** Do not call backend-only, frontend-only, mock-only or design-only work a complete feature. State the boundary plainly.
- **One source of truth per concern.** Reconcile PRD, flow/state, architecture, plan, backlog and proof documents before coding when they disagree. Do not maintain competing masters.
- **Real versus bounded data.** Use real production-like data when available; otherwise label fixtures, bound their scope and never use them to claim marketplace, user or operational success.
- **Preserve by default.** Do not delete users, identities, historical tables or records to make a new slice easier. Require explicit confirmation for destructive changes and record the decision.
- **Evidence over optimism.** A passing build is not a passing journey. A screenshot is not proof of Auth. A seeded row is not proof of real users. Report the exact evidence and residual gap.
- **Definition of done per unit.** The unit works end-to-end, handles obvious failure and recovery states, is visually usable, is accessible at required breakpoints and has its proof artifact updated.
- **No hidden environment work.** Keep credentials out of chat, source control, public bundles, screenshots, logs and evidence. If deployment or connector configuration is manual, mark it manual and identify the next human action.
- **Stop at a gate.** If a required dependency, decision or proof is missing, stop the next phase and present the blocker instead of redesigning around it.

## Required artifacts

For a substantial product or feature, create or reconcile these artifacts. Keep them concise and link every task to a feature ID and acceptance criterion.

| Artifact | Purpose |
|---|---|
| PRD / Seed | Problem, actors, core journey, success, non-goals and production meaning |
| Flow/state contract | Actors, states, transitions, permissions, locks and recovery |
| Roots / interface architecture | Schema, invariants, API, UI contracts, system boundaries and dependencies |
| Implementation plan | Dependency-ordered vertical slices, phase gates and evidence plan |
| Task backlog | Feature-linked tasks/subtasks, priority, owner, status, blocker and evidence |
| Proof record | Commands, API responses, browser assertions, screenshots, logs, residual gaps |
| Release record | Commit, environment, deployment, rollback, monitoring, acceptance and owner |

Do not create duplicate master documents merely to avoid reconciling an existing authority. If an existing artifact is authoritative, update it or record a focused amendment.

## Tracking model

Use explicit statuses: `todo`, `ready`, `in_progress`, `blocked`, `review`, `verified`, `done`, `partial`, `deferred` and `manual`.

A feature is `verified` only when its stated evidence exists. Use `done` only when the parent slice gate and release conditions are closed. After every substantive pass, record what changed, what was proven, what remains and why. Never turn an unresolved limitation green for momentum.

Track these activities as needed for every feature:

- contract and acceptance criteria;
- data/schema/migration;
- server operation and authorization;
- UI states and responsive treatment;
- integration with the product state machine;
- unit/integration/E2E proof;
- operations, recovery and ownership.

## Execution protocol

When applying Nature Way to a real task:

1. **Inspect.** Read the authoritative docs, repository, existing tests, integrations, environment/deployment state and current proof. Do not assume the current phase.
2. **Reconcile.** Identify contradictions, stale documents, unsupported UI claims, missing dependencies and the smallest coherent slice. Amend the source of truth before implementation if needed.
3. **Frame.** Tell the user the current structural path and depth (for example, `product > feature > flow > state`), phase, objective, dependencies, non-goals and definition of done. For substantial work, create a dependency-ordered plan before coding.
4. **Build one slice.** Implement contract, data/server, UI, integration and hardening together. Preserve stable unrelated behavior.
5. **Prove progressively.** Run focused unit and boundary tests first, then build, API/integration checks, browser/responsive proof, real deployment checks and visual inspection. Diagnose failures rather than weakening assertions.
6. **Update.** Record the result in the backlog, proof record and release record. Commit only the intended changes. Keep secrets and temporary artifacts out of the repository.
7. **Gate.** Advance only when the phase definition of done is satisfied. If blocked, state the blocker, evidence, owner and smallest next action.
8. **Report.** Summarize completed work, exact evidence, known limitations, rollback/recovery path and the next gated slice. Never claim the whole product is production-ready because one ring passed.

## Start-of-slice template

Use this concise structure before implementation:

> **Structural path:** product > feature > nested unit(s)  
> **Phase:** Seed / Roots / Trunk / Heartwood / Branch / Canopy / Ring  
> **Slice:** one sentence describing the user-visible outcome  
> **Dependencies:** contracts, data, Auth, integrations and manual gates  
> **Non-goals:** explicitly deferred work  
> **Definition of done:** end-to-end behavior, failure/recovery states, visual/accessibility baseline and proof artifacts

## End-of-slice template

Use this structure after implementation:

> **Status:** verified / partial / blocked / manual  
> **Changed:** files, contracts, migrations and deployed surfaces  
> **Proven:** commands, API behavior, browser widths/states and visual checks  
> **Not proven:** exact protected, external, human or production conditions still open  
> **Preserved:** users, identities, historical data and unrelated stable behavior  
> **Next gate:** one dependency-ordered action, not a broad redesign

## When invoked on existing work

Read what exists and identify the actual phase. Do not restart Seed or Roots when authoritative artifacts remain valid, but do not trust stale prototype documents, fixture-only success or undocumented assumptions. Reconcile them and open a new Roots decision only when a foundational change is genuinely required.

If the user asks to skip directly to UI polish, explain that this recreates the failure Nature Way prevents. Follow the explicit request only if the user confirms, mark the resulting contract/backend/proof gap and do not call the result production-ready.

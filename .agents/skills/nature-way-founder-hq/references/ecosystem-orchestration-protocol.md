# Ecosystem orchestration protocol

Use this protocol to run Founder HQ as an execution coordinator rather than a static directory of skills. The plan owner remains Founder HQ; the gate owner remains the active specialist.

## Start the master plan

1. Capture the founder’s objective in plain language and classify it as product, venture evidence, capital, opportunity, capability, reflection, or mixed.
2. Load this protocol, the ecosystem activation manifest, the handoff receipt template, and the Founder HQ Board reference.
3. Create or reconcile one Founder HQ Master Plan. Identify the current milestone, maturity target, first gate, active specialist, expected return, capacity limit, and stop condition.
4. Select the smallest phase-appropriate sequence. Do not activate every companion because they exist in the pack.
5. Open only the first ready gate. Put downstream work in `planned`, not `active`.

## Standard handoff sequence

| Step | Founder HQ action | Specialist action | Required result |
|---|---|---|---|
| 1. Frame | Write the Master Plan row and Activation Receipt. | Confirm whether it can take the named gate. | Activation status is truthful. |
| 2. Load | Pass the exact phase, artifacts, constraints, and expected output. | Load only the triggered references/templates and create a Resource Receipt. | Resource use is observable. |
| 3. Execute | Wait at the dispatch boundary. | Perform its own workflow and update its specialist artifacts. | No duplicate method or parallel unowned work. |
| 4. Return | Receive the specialist handoff. | Return gate, evidence, residual gap, owner, next action, resource receipt, and task changes. | The gate is either advanced, blocked, deferred, or reopened. |
| 5. Reconcile | Update the Master Plan and Founder HQ Board. | Remain closed until the next activation. | One next specialist/gate is selected from evidence. |

## New product default sequence

For a new product request, use this default unless evidence changes it:

`Founder HQ Master Plan → Nature Way Seed → Nature Way Species → Nature Way Root → Nature Way Trunk → Nature Way Heartwood/Canopy → scoped release`.

Add Venture Lifecycle before or alongside a product gate only when problem evidence, segment, value, distribution, retention, economics, or stage is the current uncertainty. Add Founder Learning only when a capability gap blocks the active gate. Add Fundraising or Opportunity Intelligence only when the capital or external opportunity is material to the current milestone. Add Sidereal Reflection only when explicitly requested and only as a private non-authoritative prompt.

## Activation states

- `activated`: the specialist is available, was actually invoked, and has taken control of its gate.
- `user invocation required`: the specialist is known but the current environment cannot activate it from Founder HQ. Stop and give the exact invocation and the preserved handoff input.
- `unavailable`: the specialist or required resource cannot be found. Stop the dependent gate and record the smallest unblocking action.

Never upgrade a state from `user invocation required` to `activated` because a route name was printed. Never mark a gate `done` because an Activation Receipt was created.

## Resource loading rules

The active specialist loads its own resources. Founder HQ loads orchestration resources only. Do not claim that a reference or template was used because it is present in the bundle. The Resource Receipt must list the exact paths loaded, templates instantiated, and applicable resources deliberately not loaded. A missing required resource blocks the gate it controls.

## Reconciliation and re-planning

After every return, compare the specialist handoff with the Master Plan. Update status, evidence, dependencies, capacity, owner, residual gap, and the next gate. Re-plan when evidence contradicts the objective, an artifact is stale, a dependency fails, a risk changes, the founder changes intent, or an external commitment changes scope. Preserve completed work, reopen only affected tasks, and explain why.

## Founder-facing control questions

At each checkpoint, answer: What milestone is active? Which gate owns the next decision? Which specialist is actually active? What exact resource receipt was returned? What evidence allows progress? What is blocked? What is the smallest next action? Which work is deliberately not active? If any answer is missing, the plan is not ready for another specialist activation.

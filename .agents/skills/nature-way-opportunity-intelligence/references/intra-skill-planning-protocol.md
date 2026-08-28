# Intra-skill planning protocol

Use this protocol whenever Founder HQ itself must execute a bounded piece of work, not only dispatch a specialist. The same protocol may be applied inside a specialist skill when that skill owns a gate and must decompose it for execution.

## Planning rule

Create or reconcile a local plan before substantive work begins. Keep the local plan subordinate to the controlling Founder HQ Master Plan or specialist gate artifact; it must not become a competing source of truth. Record the structural path, active gate, owner, dependencies, acceptance condition, expected proof, capacity boundary, and re-plan trigger.

Use the path:

`HQ milestone > gate > specialist > slice > task > subtask`

Extend the path only when the child has its own meaningful objective, dependency, decision, state transition, failure mode, owner, or proof gate. Stop at the smallest coherent unit that can be completed and proven without losing context. Do not create subtasks merely to make a list look detailed.

## Unit definitions

| Unit | Purpose | Completion rule |
|---|---|---|
| Gate | Decide whether a material outcome may advance, pause, or stop. | The named decision condition is supported by recorded evidence. |
| Specialist | Own one domain gate and its method. | The specialist returns its required handoff and resource receipt. |
| Slice | Produce one end-to-end outcome or one bounded evidence packet. | The outcome is usable or the evidence is decision-grade. |
| Task | Make one coherent change or proof contribution with one owner. | Acceptance criteria and proof are complete; no hidden child work remains. |
| Subtask | Complete one atomic predecessor of a parent task. | Its output is handed to the parent and its own proof is recorded. |

## Local execution loop

1. State the local objective in plain language and link it to the parent gate.
2. Identify the smallest evidence-producing slice.
3. Decompose only the dependencies needed for that slice.
4. Mark one task or subtask `in_progress` per available owner and capacity limit.
5. Execute against the authoritative artifact, not a copied summary.
6. Record proof, residual gaps, decisions, and changed assumptions immediately.
7. Close the child only when its acceptance condition is proven; then reassess the parent.
8. Re-plan when evidence, intent, dependencies, capacity, risk, or gate conditions change.

## Status and parent rules

Use `todo → ready → in_progress → review → verified → done` only when the evidence supports each transition. Use `blocked`, `partial`, `manual`, or `deferred` truthfully. A child cannot be `ready` until its dependencies and parent gate are adequate. A parent cannot be `done` because all children are marked done; the parent’s own acceptance and gate proof must also be complete.

When a task is too large, split it into dependency-ordered children and keep the parent `partial` or `in_progress`. When a task is invalidated, reopen only the affected descendants and preserve completed evidence. When a child reveals a new risk, reconcile the controlling artifact before adding work.

## Handoff contract

Every specialist or local-plan return must include: active structural path; gate and decision condition; completed task/subtask IDs; proof IDs or links and as-of time; residual gap or blocker; owner; next smallest action; capacity impact; re-plan trigger; and a Resource Receipt. Founder HQ copies only these control fields into its Master Plan and keeps detailed execution evidence in the owning artifact.

## Founder-facing checkpoint

Explain four things without technical shorthand: what is active now, why it is the smallest next move, what is blocked or deliberately deferred, and what evidence will decide the next move. Ask for confirmation only before a material gate, irreversible change, capacity commitment, or decision that changes the accepted intent.

## Anti-patterns

Do not open multiple nested plans for the same gate, create duplicate tasks across HQ and a specialist, close parents by checklist completion, hide manual or mock work as done, or decompose a task below the point where ownership and proof remain intelligible.

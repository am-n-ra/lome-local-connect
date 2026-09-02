# Execution controller

Use this reference to turn a Nature Way phase into a plan that a founder can inspect, an AI can execute, and a reviewer can audit. The controller must make the next correct move obvious without pretending that work is complete.

## Build the task tree

1. Name the active **milestone** and its maturity target.
2. Name the one **gate** that determines whether the milestone can advance.
3. Select one **vertical slice** that produces the highest-value evidence for that gate.
4. Decompose the slice into dependency-ordered **tasks** and, only when helpful, **subtasks**.
5. Attach acceptance, proof, risk/debt boundary, owner, and re-plan trigger to every executable unit.
6. Mark exactly one slice as `in_progress` for a solo founder unless independent work can be integrated and proven separately.

## Task design rules

| Unit | Must answer | Do not use it for |
|---|---|---|
| Milestone | What founder/customer/release outcome matters next? | A feature wishlist or a vague business ambition. |
| Gate | What evidence permits progress or requires a stop? | A calendar date without a decision condition. |
| Vertical slice | What actor can achieve what outcome end to end? | A UI-only, backend-only, or test-only fragment presented as a feature. |
| Task | What coherent change or proof has one owner and acceptance? | Several unrelated modules or an unlimited research activity. |
| Subtask | What atomic predecessor is needed for the parent task? | A duplicate todo item or an artificial bureaucracy layer. |

## State transitions

Use `todo → ready → in_progress → review → verified → done` only when the evidence supports each move. Use `blocked`, `partial`, `manual`, or `deferred` truthfully at any point. A task may become `ready` only when its dependencies and parent gate are adequate. A task becomes `done` only when its proof is recorded and no unresolved acceptance condition remains.

## Re-plan protocol

Re-plan whenever evidence contradicts the current assumption, the founder changes a material decision, a gate fails, a dependency changes, a visual/logical inconsistency is found, or a release guardrail is crossed.

1. Preserve the completed evidence and explain the trigger.
2. Mark only affected tasks/assumptions as reopened, blocked, or invalidated.
3. Reconcile the controlling artifact before changing code or adding tasks.
4. Rebuild the smallest dependency-correct next slice.
5. Report the removed, added, deferred, and reopened work with its reason.

Never keep a task active merely because it was previously planned. Never close a parent because its children look complete if its gate proof is still missing.

## Founder review questions

At each review, answer: What exact outcome is active? What gate owns it? What proof is missing? Which single slice is in progress? What is blocked and who owns the unblock? What changed since the last review? What work has been deliberately deferred or declined? These questions keep the system legible without requiring the founder to invent technical subtasks.

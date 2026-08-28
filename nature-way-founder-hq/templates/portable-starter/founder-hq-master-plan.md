# Founder HQ Master Plan — `<venture / product>`

> **Plan ID:** `<stable ID>`  
> **As of:** `<date and time zone>`  
> **Founder outcome:** `<plain-language outcome>`  
> **Maturity target:** `<prototype / pilot-ready / production-candidate / production-ready>`  
> **Capacity limit:** `<active slices or hours available>`  
> **Plan owner:** Founder HQ

## Ordered gate plan

| Order | Nature Way / ecosystem gate | Decision condition | Primary specialist | Required resources | Expected return | Status | Re-plan trigger |
|---|---|---|---|---|---|---|---|
| 1 | `<Seed / Species / lifecycle / capital / etc.>` | `<what must be true>` | `/<skill>` | `<exact references/templates>` | `<handoff fields>` | `ready` | `<event>` |

## Activation ledger

| Handoff ID | Specialist | Activation status | Input passed | Resource Receipt | Gate owned | Returned evidence | Next action |
|---|---|---|---|---|---|---|---|
| `<ID>` | `/<skill>` | `activated / user invocation required / unavailable` | `<objective + current artifacts>` | `<loaded / instantiated / not loaded>` | `<gate>` | `<proof or gap>` | `<action>` |

## Dependency-aware task tree

| ID | Parent | Gate / specialist | Objective | Depends on | Owner | Status | Acceptance / proof | Blocker or risk | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| M-01 | — | HQ / milestone | `<venture outcome>` | — | `<owner>` | `in_progress` | `<milestone proof>` | `<boundary>` | `<event>` |
| G-01 | M-01 | `<gate>` / `/<skill>` | `<gate outcome>` | `<prior gate>` | `<owner>` | `ready` | `<gate proof>` | `<boundary>` | `<event>` |
| S-01 | G-01 | `<slice>` / `/<skill>` | `<vertical or evidence slice>` | `G-01` | `<owner>` | `todo` | `<end-to-end or stage proof>` | `<boundary>` | `<event>` |
| T-01 | S-01 | `<phase>` / `/<skill>` | `<coherent task>` | `<predecessor>` | `<owner>` | `todo` | `<criterion + proof>` | `<risk/debt>` | `<event>` |
| ST-01 | T-01 | `<phase>` / `/<skill>` | `<atomic prerequisite>` | `<predecessor>` | `<owner>` | `todo` | `<criterion + proof>` | `<risk/debt>` | `<event>` |

## Intra-skill planning notes

Use the structural path `HQ milestone > gate > specialist > slice > task > subtask` for work performed inside Founder HQ or inside an active specialist gate. Add a child only when it has a distinct objective, dependency, decision, state transition, failure mode, owner, or proof gate. Keep the local plan subordinate to this Master Plan and link to the owning artifact rather than duplicating detailed evidence.

| Local plan ID | Parent ID | Structural path | Objective | Depends on | Owner | Status | Acceptance / proof | Capacity impact | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| `<ID>` | `<parent>` | `<HQ > gate > ... > task/subtask>` | `<atomic objective>` | `<predecessor>` | `<owner>` | `<status>` | `<criterion + proof ID/link>` | `<hours or slot displaced>` | `<event>` |

A child is not complete merely because its checklist is finished; record proof. A parent is not complete merely because its children are done; prove the parent acceptance and gate condition. Use `blocked`, `partial`, `manual`, and `deferred` honestly, and reopen only affected descendants when re-planning.

## Active-control rules

Only the current gate and its ready work may be active. A downstream specialist remains `planned` until the current specialist returns its required handoff and Founder HQ reconciles the plan. `activated` means real control was transferred; a printed route is not activation. `done` requires evidence, not effort or an attractive output. Before substantive work inside a gate, instantiate or reconcile the local planning notes above and include the active path, completed task/subtask IDs, proof as of time, residual gap, next action, capacity impact, and re-plan trigger in the return handoff.

## Reconciliation log

| Date | Specialist return or new fact | Plan changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| `<date>` | `<evidence, failure, changed intent, or dependency>` | `<closed / split / deferred / reopened>` | `<advance / pause / stop / replan>` | `<owner>` | `<date or trigger>` |

## Founder checkpoint

> **Where we are:** `<milestone, current gate, active specialist>`  
> **Why this is next:** `<dependency and evidence logic>`  
> **What is not active:** `<deferred specialists/features/work>`  
> **What proves the next move:** `<specific proof>`  
> **What happens if it fails:** `<replan or stop rule>`

# Execution Plan and Task Tree — `<venture / product>`

> **As of:** `<date>`  
> **Active milestone:** `<outcome>`  
> **Maturity target:** `<prototype / pilot-ready / production-candidate / production-ready / production-verified>`  
> **Current gate:** `<Nature Way phase and decision condition>`  
> **Single active slice:** `<actor → action → outcome>`

## Gate plan

| Order | Gate | Decision condition | Required evidence | Owner | Status | Re-plan trigger |
|---|---|---|---|---|---|---|
| 1 | `<gate>` | `<advance / pause / stop condition>` | `<proof>` | `<owner>` | `<status>` | `<event>` |

## Task tree

| ID | Parent | Structural path and phase | Objective | Dependencies | Status | Acceptance and expected proof | Risk/debt boundary | Owner | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| M-01 | — | `product` | `<milestone outcome>` | — | `<status>` | `<gate proof>` | `<boundary>` | `<owner>` | `<event>` |
| S-01 | M-01 | `product > feature` / `<phase>` | `<vertical slice>` | `<gate>` | `in_progress` | `<end-to-end proof>` | `<boundary>` | `<owner>` | `<event>` |
| T-01 | S-01 | `… > task` / `<phase>` | `<coherent task>` | `<predecessor>` | `ready` | `<criterion + proof>` | `<boundary>` | `<owner>` | `<event>` |
| ST-01 | T-01 | `… > subtask` / `<phase>` | `<atomic prerequisite>` | `<predecessor>` | `todo` | `<criterion + proof>` | `<boundary>` | `<owner>` | `<event>` |

## Change and proof log

| Date | Event or evidence | Effect on task tree | Decision | Owner | Next review |
|---|---|---|---|---|---|
| `<date>` | `<proof, blocker, or new fact>` | `<opened/closed/split/deferred/reopened>` | `<reason>` | `<owner>` | `<date/trigger>` |

## Founder checkpoint

> **What is happening now:** `<plain-language active slice>`  
> **Why it is next:** `<gate and dependency explanation>`  
> **What is blocked or deferred:** `<plain-language status>`  
> **What proof will decide the next move:** `<test, observation, or review>`

# Intra-skill Plan — `<skill prefix>` / `<venture>`

> **Founder HQ Plan ID:** `<HQ plan ID>`  
> **Local Plan ID:** `<skill-prefix>-<stable ID>`  
> **Assigned gate:** `<gate>`  
> **Local owner:** `<specialist skill>`  
> **Expected return:** `<evidence, decision, gap, owner, next action>`

## Resource Receipt

| Status | Exact path or explanation |
|---|---|
| Loaded | `<references/...>` |
| Template instantiated | `<templates/...>` |
| Not loaded / reason | `<path and why not applicable>` |

## Local gate plan

| Order | Workstream | Gate condition | Evidence required | Status | Re-plan trigger |
|---|---|---|---|---|---|
| 1 | `<workstream>` | `<what must be true>` | `<proof>` | `ready` | `<event>` |

## Dependency-aware task tree

| ID | Parent | Structural path / phase | Objective | Depends on | Owner | Status | Acceptance / proof | Risk/debt boundary | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | — | `<gate>` | `<gate outcome>` | `<HQ predecessor>` | `<owner>` | `in_progress` | `<gate proof>` | `<boundary>` | `<event>` |
| W-01 | G-01 | `<workstream>` | `<coherent workstream>` | `<dependency>` | `<owner>` | `ready` | `<criterion>` | `<boundary>` | `<event>` |
| T-01 | W-01 | `<phase>` | `<coherent task>` | `<predecessor>` | `<owner>` | `todo` | `<criterion + proof>` | `<boundary>` | `<event>` |
| ST-01 | T-01 | `<nested unit>` | `<atomic subtask>` | `<predecessor>` | `<owner>` | `todo` | `<criterion + proof>` | `<boundary>` | `<event>` |

## Reconciliation log

| Date | Evidence or changed fact | Task changes | Decision | Owner | Next review |
|---|---|---|---|---|---|
| `<date>` | `<proof, blocker, conflict, or new fact>` | `<closed / split / deferred / reopened>` | `<advance / pause / stop / replan>` | `<owner>` | `<date/trigger>` |

## Handoff to Founder HQ

> **Local status:** `<verified / partial / blocked / manual / deferred>`  
> **Gate decision:** `<advance / pause / stop / replan>`  
> **Closed:** `<IDs + evidence>`  
> **Open or blocked:** `<IDs + blocker + unblock owner>`  
> **Resource Receipt:** `<summary>`  
> **Residual gap:** `<what remains unproven>`  
> **Next smallest action:** `<one action>`  
> **Re-plan trigger:** `<event>`

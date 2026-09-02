# System Dependency Map — `<venture / product>`

> **Map ID:** `<stable ID>`  
> **As of:** `<date and time zone>`  
> **Maturity target:** `<pilot-ready / production-candidate / production-ready>`  
> **Map owner:** `<owner>`

## Causal graph

| Edge ID | Parent capability | Child capability | Actor/owner | Source of truth | Command/state transition | Authorization boundary | Freshness | Edge status | Proof | Re-plan trigger |
|---|---|---|---|---|---|---|---|---|---|---|
| E-01 | `<what must exist first>` | `<what depends on it>` | `<role>` | `<record/system>` | `<event/state>` | `<who may do/see it>` | `<policy>` | `missing / bounded / real / verified` | `<evidence>` | `<event>` |

## Actor and parent inventory

| Layer | Capability that must exist | Why it is a parent | Downstream children unlocked | Owner | Status | Smallest proof |
|---|---|---|---|---|---|---|
| Governance/operations | `<admin/operator authority>` | `<reason>` | `<children>` | `<owner>` | `planned` | `<proof>` |
| Supply/provider | `<seller/provider onboarding>` | `<reason>` | `<children>` | `<owner>` | `planned` | `<proof>` |
| Canonical data | `<catalogue/availability/location>` | `<reason>` | `<children>` | `<owner>` | `planned` | `<proof>` |
| Demand/discovery | `<buyer/discovery>` | `<reason>` | `<children>` | `<owner>` | `planned` | `<proof>` |
| Transaction/fulfillment | `<transaction/contact/fulfillment>` | `<reason>` | `<children>` | `<owner>` | `planned` | `<proof>` |
| Support/measurement | `<support/reconciliation/observability>` | `<reason>` | `<children>` | `<owner>` | `planned` | `<proof>` |

## Existing-surface rescue

| Existing screen/feature | Parent edges missing | Honest states today | Fake/disconnected claim to remove | Rebased slice | Status |
|---|---|---|---|---|---|
| `<visible surface>` | `<edges>` | `<what is true>` | `<claim>` | `<smallest connected chain>` | `orphaned leaf` |

## Slice selection

> **Chosen first truthful chain:** `<parent → child → proof>`  
> **Why this chain first:** `<downstream leverage + uncertainty reduced>`  
> **Not active yet:** `<visible children or unrelated branches>`  
> **Gate to unlock next:** `<specific proof>`

## Readiness rule

A child may move to implementation only when its required parent edges are `verified`, or explicitly bounded with an owner, expiry/review trigger, safe failure behavior, and proof plan. A rendered screen is not evidence that its parent system exists.

# Technical-lead production review

Use this proportionately for a material architecture, API, schema, integration, release, or refactor decision. Keep the review smaller than the change, but never omit a control merely because the work came from an AI.

| Area | Required question | Evidence to record |
|---|---|---|
| Architecture | Are boundaries, ownership, dependencies, and alternatives explicit? | Decision, trade-offs, diagram/contract when useful, review trigger. |
| Contracts | Are API, event, schema, error, migration, and compatibility rules testable? | Version/compatibility plan and contract tests. |
| Quality | Is code typed, reusable, readable, and free of avoidable duplication/dead paths? | Lint/type/build result; debt disposition. |
| Tests | Are critical rules, boundaries, journeys, negative paths, and recovery covered at suitable levels? | Test matrix, commands, results, limits. |
| Delivery | Is change promotion reproducible and reversible? | CI checks, migration/flag strategy, deployment and rollback plan. |
| Dependences | Are packages/services owned, maintained, licensed appropriately, and monitored for risk? | Inventory, update/risk decision, fallback or owner. |
| Performance/cost | Is a budget or guardrail defined for latency, errors, queries, bundle, capacity, and spend? | Baseline/target, measurement, limit, owner. |
| Data/security | Are source of truth, authorization, privacy, retention, secrets, backups, and audit needs clear? | Control/test, residual risk, escalation where required. |
| Operations | Can the team observe, support, recover, and learn from failure? | Metrics/logs/alerts, runbook, rollback, incident owner. |

## Decision rule

Record the smallest sufficient evidence. If an unanswered question can cause irreversible data loss, trust violation, contractual breach, sustained outage, or uncontrolled cost, do not decide it from a generic checklist: use the risk/escalation matrix and request the specific qualified review needed.

# Anti-slop and debt review

Use this review before closing a material slice, accepting a refactor, or releasing a change. A polished surface is not evidence that the product is coherent or maintainable.

| Debt class | Detect | Correct at source |
|---|---|---|
| Visual | Divergent tokens, typography, spacing, colors, components, hierarchy, responsive behavior, or inaccessible contrast. | Species blueprint, design tokens, shared component, or the inconsistent surface. |
| Logical | Conflicting status meanings, state transitions, permissions, calculations, or user promises. | Flow/state contract, domain rule, state machine, or server authority. |
| Technical | Duplicate abstractions, dead code, circular/deep coupling, unsafe typing, brittle configuration, or undocumented shortcuts. | Module boundary, contract, shared primitive, build/deployment configuration, or removal plan. |
| Data | Competing sources of truth, fixture leakage, missing constraints, stale transformations, or untraceable metrics. | Schema, API/event contract, migration, validation, ownership, or analytic definition. |
| Security/operations | Secret exposure, unowned dependency, missing monitoring, no recovery, or unsafe manual procedure. | Trust boundary, dependency configuration, runbook, access control, or escalation. |

## Review sequence

1. Compare the change with its accepted intent, maquette, contract, and proof requirement.
2. List visible symptoms and trace each to one controlling source.
3. Correct the controlling source; do not add a competing local exception unless it is an accepted temporary boundary.
4. Record any remaining debt with class, severity, impact, cost, owner, disposition, and review/removal trigger.
5. Re-run the affected proof. Do not close high-severity debt without an explicit Go with limits or No-go decision.

## Red flags

Treat these as blockers until understood: one UI label with multiple business meanings; two screens showing different truth; mock data resembling production data; client-only authorization; repeated copy-paste of a rule; a new component for an existing pattern; an error state without recovery; a visual fix that bypasses a shared token; or a deployment that cannot be reversed.

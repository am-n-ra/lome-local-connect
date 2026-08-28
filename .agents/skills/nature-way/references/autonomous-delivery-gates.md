# Autonomous delivery gates

Use this reference to state the truthful maturity of the current product scope. A higher level does not erase residual risk; it means the listed evidence exists for the declared scope and environment.

| Level | Permitted claim | Minimum gate |
|---|---|---|
| `prototype` | The concept or flow can be explored. | Intent is framed; known mocks/manual boundaries are labelled; no production promise. |
| `pilot-ready` | A bounded, consenting cohort can test value. | Critical journey works in the intended environment; access/data limits, feedback path, guardrail, owner, and reversal are defined. |
| `production-candidate` | The scoped release is ready for final production validation. | Required contracts, authorization, failure/recovery states, tests, debt disposition, observability, rollout, and rollback evidence exist. |
| `production-ready` | The scoped product can be released under the defined exposure and controls. | Candidate evidence passed; outstanding limits are accepted; release owner makes an explicit Go or Go with limits decision. |
| `production-verified` | The release has operated within its declared guardrails for its observation window. | Live evidence, monitoring, support/incident record, and release review support the claim. |

## Gate sequence

1. Confirm the Intent Brief, mission contract, scope, and maturity target.
2. Confirm the approved Species maquette and experience contract for affected states.
3. Confirm Root contracts: data, APIs/events, permissions, dependencies, migration, recovery, and ownership.
4. Prove the critical journey and its material failure, authorization, retry/cancel, and recovery paths.
5. Resolve or explicitly disposition coherence and debt findings.
6. Confirm proportionate security, privacy, performance/cost, CI/CD, observability, runbook, rollout, and rollback readiness.
7. Issue `Go`, `Go with limits`, or `No-go`; record scope, as-of date, evidence links, residual gaps, owner, and review trigger.

## Stop conditions

Stop and return to the controlling phase when the target user, critical journey, maquette, contract, authorization, evidence, rollback, or risk owner is missing. Do not replace the missing gate with a disclaimer and proceed as though it passed.

## Go decision

Use `Go` only when the release is inside its declared scope and all applicable gates pass. Use `Go with limits` only when the exposure limit, monitoring, owner, and reversal plan make the residual gap acceptable. Use `No-go` when a required gate lacks evidence, risk is not owned, or a high-risk review is outstanding.

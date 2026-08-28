# Visual and logic coherence review

Use this reference when debugging a mismatch, reviewing a feature, refactoring a flow, or preparing a release. Review the full chain from intent to rendered state and back to authoritative data.

| Compare | Questions |
|---|---|
| Intent → maquette | Does the screen serve the accepted actor, outcome, hierarchy, and non-goal? |
| Maquette → rendered UI | Do tokens, typography, spacing, component behavior, responsiveness, and accessible states match the approved system? |
| UI → client state | Does each visible status, count, control, empty state, error, and loading state derive from an explicit state? |
| Client → contract | Are requests, responses, errors, retries, cancellation, pagination, and stale states aligned with the declared interface? |
| Contract → server/data | Is the displayed truth authorized, validated, atomic enough, and sourced from the right record? |
| Server/data → UI recovery | Can the user understand and recover from unavailable, denied, changed, duplicated, expired, or failed conditions? |

## Diagnose a mismatch

1. State the symptom without assuming a cause.
2. Identify the actor, state, data basis, device/viewport, and reproducible path.
3. Compare the controlling artifacts in order: Intent Brief, Species, flow/state contract, API/data contract, server rule, rendered evidence.
4. Identify one root cause and the source that owns it.
5. Apply the correction to that source, then prove the affected normal and negative paths.
6. Record any accepted discrepancy in the coherence/debt register with a review trigger.

Do not resolve a business-rule conflict only with a label, a layout defect only with a one-off style override, or a data/permission defect only with client-side hiding.

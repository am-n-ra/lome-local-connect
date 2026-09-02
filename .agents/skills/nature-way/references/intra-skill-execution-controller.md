# Intra-skill execution controller

Use this protocol inside every specialist skill after Founder HQ assigns a gate. The local plan is subordinate to the Founder HQ Master Plan but authoritative for the specialist’s own tasks, dependencies, and evidence.

## Required sequence

1. Read the Founder HQ handoff: plan ID, objective, gate, structural path, constraints, and expected return.
2. Load the phase-appropriate references and templates for this skill. Emit a Resource Receipt before dependent work.
3. Create or reconcile a local plan with a stable skill prefix, for example `NW-PROD`, `NW-LIFE`, `NW-CAP`, `NW-OPP`, `NW-LEARN`, or `NW-SID`.
4. Decompose the assigned gate as `gate → workstream → task → subtask`. Stop at the smallest coherent unit with one owner, dependency, acceptance condition, and proof.
5. Activate only the next dependency-ready unit. Keep downstream work planned until its predecessor and gate allow it.

Every local task and subtask must contain: ID, parent, structural path, phase, objective, dependency, owner, status, acceptance criterion, expected proof, risk/debt boundary, relevant resource, and re-plan trigger. Use `blocked` only with a named blocker, unblock owner, and smallest unblocking action. Use `verified` only with linked evidence. Use `done` only after evidence and parent-gate acceptance.

## Re-plan and return

After every material pass, update the local plan, proof, decision, debt/coherence record, and Resource Receipt. Re-plan when evidence contradicts an assumption, the handoff changes, a dependency fails, a resource is missing, a gate is rejected, a risk changes, or a new task boundary appears. Preserve completed evidence and reopen or split only affected work.

Return to Founder HQ: HQ plan ID; local plan ID; active gate; closed/open/blocked/deferred task IDs; Resource Receipt; evidence and date; residual gap; decision; owner; next smallest action; and re-plan trigger. Do not claim that a route or resource was used without an actual receipt.

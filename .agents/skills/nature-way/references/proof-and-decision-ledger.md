# Proof and Decision Ledger Reference

Use this reference for a material product, feature, launch, migration, or release. It keeps evidence, uncertainty, and consequential decisions visible across nested Nature Way cycles.

## Classify evidence honestly

| Class | Meaning | Permitted claim |
|---|---|---|
| `observed` | Seen once in a controlled check. | “Observed in this check.” |
| `reproduced` | Repeated through a documented test or journey. | “Reproduced under these conditions.” |
| `bounded` | Demonstrated against labelled fixture, mock, or sandbox data. | “Works against bounded data; production remains unproven.” |
| `external` | Confirmed by an external system or human with a recorded source. | “Confirmed externally as of this date.” |
| `manual` | Requires a named human/operator action. | “Manual step remains; owner and runbook recorded.” |
| `unproven` | Desired or inferred but not evidenced. | “Hypothesis or gap; do not market as a fact.” |

## Record every material proof

| Proof ID | Structural path | Acceptance criterion | Evidence class | Method / source | Environment / data basis | Owner | As of | Result / residual gap |
|---|---|---|---|---|---|---|---|---|
| `PR-001` | `<path>` | `<testable statement>` | `<class>` | `<test, log, screenshot, source>` | `<basis>` | `<role>` | `<date>` | `<result / gap>` |

Never use a screenshot as proof of a server-only rule, a seeded fixture as proof of real demand, or an untested UI state as proof of an end-to-end journey.

## Record decisions that can age

| Decision ID | Decision | Why now | Options rejected | Owner | Trigger to revisit | Expiry / review date | Downstream artifacts |
|---|---|---|---|---|---|---|---|
| `DR-001` | `<decision>` | `<evidence>` | `<alternatives>` | `<role>` | `<event>` | `<date>` | `<files/slices>` |

Revisit a decision whenever its trigger occurs. A decision without an owner, evidence, and revisit condition is an undocumented assumption, not a resolved root.

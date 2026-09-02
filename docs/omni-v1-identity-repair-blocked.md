# Omni V1 Identity Repair — Staging Boundary Blocker

**Status:** `blocked`  
**Risk:** `L3`  
**Date:** 2026-08-19

## Evidence

The approved identity-repair plan was started with a read-only environment check. The repository contains a guarded staging seed that requires `OMNI_E2E_TARGET=staging`, `OMNI_E2E_ALLOW_MUTATION=1`, `OMNI_E2E_SELLER_ID`, `OMNI_E2E_BUYER_ID` and `OMNI_E2E_RUN_ID`. None of these variables are configured in the current shell or `.env`. A `DATABASE_URL` is configured, but without an explicit staging marker it cannot be treated as an isolated target.

## Safety decision

No mapping preview, repair transaction, migration, fixture seed or production mutation was executed. This is intentional. The L3 gate requires proof that the target is staging before reading or mutating identity-linked data for repair. The existing read-only audit remains the only database operation used for the identity finding.

## Exact unblock inputs

Provide or configure a verified isolated staging database connection and the following non-secret fixture variables in the execution environment:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` or `NEON_DATABASE_URL` | Isolated staging database only. |
| `OMNI_E2E_TARGET=staging` | Hard safety marker. |
| `OMNI_E2E_ALLOW_MUTATION=1` | Explicit approval for guarded staging fixture writes. |
| `OMNI_E2E_SELLER_ID` | Distinct staging seller identity. |
| `OMNI_E2E_BUYER_ID` | Distinct staging buyer identity. |
| `OMNI_E2E_RUN_ID` | Unique idempotent repair/fixture run identifier. |

The staging database must contain or be able to provision the duplicate-profile/legacy-owner fixture. Do not paste credentials into chat or reports. After configuration, resume at Phase 1, prove the staging target, create the redacted mapping preview, and stop again before mutation if collision checks fail.

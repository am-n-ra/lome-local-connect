# Omni V2 — Availability Repository Root Evidence

**Document ID:** `OMNI-V2-ROOT-AVAILABILITY-REPOSITORY-001`  
**Method:** Nature Way — Phase 2, Root System  
**Observed:** 2026-08-23  
**Status:** `partial`

## Scope

This record covers only the current server repository path for `POST /api/v2/availability`. It does not claim authenticated production success, real Auth acceptance, live user provisioning, inventory availability, reservation, payment or Trunk approval.

## Implemented boundary

`src/server/trunk-repository.ts#createAvailabilityRequest` now performs the selection and provisioning work through one PostgreSQL statement built from the following guarded sequence:

1. `valid_selection` requires the requested product to belong to the requested facility, be `published`, and belong to a facility whose trust state is `certified`, `unconfirmed` or `confirmed`.
2. The `account` CTE upserts one `v2_accounts` row by the authenticated Neon Auth user ID only when the selection is valid.
3. The `wallet` CTE ensures one account-level `v2_wallets` row through the existing unique account constraint.
4. `request_insert` creates the non-reserving availability request with a stable idempotency key and the validated product/facility pair.
5. The request result returns either the newly inserted row or the existing row for the same buyer account and idempotency key.
6. The repository compares the stored response shape with the replay input. A changed product, facility, quantity, budget mode or budget amount is rejected instead of silently reusing a response for a different request.

The HTTP boundary maps repository policy rejection to a non-retryable `409 POLICY_REJECTED`, malformed JSON/object bodies to `400 INVALID_INPUT`, and unexpected errors to a generic retryable `500 INTERNAL_RECOVERABLE` without returning raw database/runtime details.

## Executable local evidence

The focused tests use an injectable tagged-SQL seam and do not connect to Neon or create fixtures:

| Check | Result |
|---|---|
| Guarded selection, account upsert, wallet upsert and request idempotency clauses are present in the actual repository query | Pass |
| Repeating the same repository call returns the same canonical request result | Pass |
| Invalid/unpublished/out-of-scope selection returns a policy rejection and the statement gates account provisioning on valid selection | Pass |
| Reusing an idempotency key with a different request shape is rejected | Pass |
| Malformed JSON and array bodies are typed input errors | Pass |
| Policy rejection maps to HTTP conflict; unexpected internal details are redacted | Pass |

The full local validation checkpoint for this slice is **11 Vitest files / 45 tests passing**, production build passing, 3 Vercel functions bundled and `Client boundary: clean`.

## Explicit non-evidence

No real bearer token was accepted in this pass. No account or wallet was provisioned through the live HTTP route. No production/default or persistent V2 Neon branch was mutated. The disposable branch was not used for this repository test seam. Therefore `AUTH-01`, live `AUTH-02`, post-deploy availability persistence, persistent migration application, retry/recovery behavior and release clearance remain open in [`v2-root-closure-register.md`](./v2-root-closure-register.md).

The disposable database branch still provides separate migration/guardrail evidence, including labeled account and transaction fixtures, but those records cannot be used to claim this repository path is live or user-authorized. See [`v2-root-fixture-ledger.md`](./v2-root-fixture-ledger.md) and [`v2-root-disposable-migration-evidence.md`](./v2-root-disposable-migration-evidence.md).

# Omni V2 — Availability Repository Root Evidence

**Document ID:** `OMNI-V2-ROOT-AVAILABILITY-REPOSITORY-001`  
**Method:** Nature Way — Phase 2, Root System  
**Observed:** 2026-08-23  
**Status:** `partial`

## Scope

This record covers the current server repository path and one explicitly user-confirmed live browser proof for `POST /api/v2/availability`. It does not claim inventory availability, reservation, payment, marketplace adoption or Trunk approval. The live proof landed on the Vercel production/default Neon branch, not the persistent V2 development branch, so it cannot be used as persistent-V2 migration proof.

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

The current full local validation checkpoint is **11 Vitest files / 68 tests passing**, production build passing, 8 Vercel functions bundled and `Client boundary: clean`.

## Live authenticated proof — 2026-08-23

The connected browser displayed the authenticated account label `KH`. After explicit confirmation, one availability request was submitted for the catalogue product `Tomatoes` at `Cotonou Fresh Hub`, with quantity `1` and no budget ceiling. The exact same flow was submitted a second time. Both submissions returned the same user-visible `DEMANDE ENVOYÉE` / `En attente de la disponibilité` state.

Read-only aggregate Neon checks then showed that the persistent V2 branch `br-dawn-hill-am5amy22` remained at zero availability requests, while the production/default branch `br-bitter-math-amrlbym6` contained exactly one availability request, one distinct buyer account, one distinct idempotency key and status `submitted`. A linked aggregate check showed one account and one wallet for the request; total production/default counts were one V2 account, one wallet and one availability request. This proves a real bearer-authenticated request reached the deployed writer and that the two browser submissions collapsed to one row on the production/default branch. It does not prove the same behavior on the persistent V2 branch.

The production/default write was an explicitly confirmed bounded test, but it violated the intended environment boundary recorded earlier in the fixture ledger. No rollback or delete was performed because destructive cleanup is prohibited without a separately scoped decision. No IDs, key values, emails, bearer tokens or passwords were recorded. No inventory availability, reservation, payment, QR, seller confirmation or Trunk success is claimed.

The disposable database branch still provides separate migration/guardrail evidence, including labeled account and transaction fixtures, but those records cannot be used to claim this repository path is live or user-authorized. See [`v2-root-fixture-ledger.md`](./v2-root-fixture-ledger.md) and [`v2-root-disposable-migration-evidence.md`](./v2-root-disposable-migration-evidence.md).

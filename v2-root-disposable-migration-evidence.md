# Omni V2 — Disposable Neon Migration Evidence

**Document ID:** `OMNI-V2-ROOT-DISPOSABLE-MIGRATION-001`
**Method:** Nature Way — Root System evidence
**Observed:** 2026-08-22
**Status:** `partial`

## Isolated environment

Migration testing used Neon project `wild-moon-30984513` on the expiring disposable branch `omni-v2-root-proof-20260822` with branch ID `br-broad-wildflower-amw7k0om`. The branch was forked from `omni-v2-rebuild` and configured to expire automatically. The production/default branch and the persistent V2 branch were not modified.

## Migration execution

The corrected additive migration `db/migrations/003_v2_root_guardrails.sql` was executed as one PostgreSQL statement per transaction item because the Neon transaction endpoint rejects multi-command prepared statements. The first preparer attempt failed on parser handling of SQL comments, the second split-transaction attempt failed on a PostgreSQL `RAISE` placeholder, and the corrected final disposable-branch execution returned 14 successful statement results with no error.

## Read-only verification

A read-only query on the disposable branch returned:

| Object group | Observed |
|---|---:|
| New constraints | 2 |
| New guard triggers | 7 |
| QR verification function present | `true` |

The verification query did not insert, update or delete business data. No Auth user, V2 account, wallet, transaction, QR token or legacy record was created or modified by the proof.

## Limitations

This proves that the draft guardrails are syntactically executable and discoverable on a disposable branch. It does not prove behavior against representative rows, concurrent QR attempts, permissions under the deployed role, migration-forward preservation counts, or production/default-branch application. The temporary branch must not be promoted automatically. Any future branch cleanup or main-branch migration requires a separately authorized decision.

## Nature Way decision

Migration 003 is **partially evidenced** on an isolated disposable branch. Root remains `review`. The buyer Trunk remains blocked until representative negative/positive database behavior, preservation comparison, authenticated bearer/provisioning, atomic QR concurrency and recovery evidence are closed or explicitly assigned.

## Representative behavior checks

Labeled disposable fixtures were inserted only on the expiring proof branch and exercised within one transaction. The following negative and positive checks passed:

| Check | Result |
|---|---|
| Mismatched facility/company owner insert | Denied with `23514` |
| Product facility outside availability scope | Denied with `23514` |
| Response facility outside request scope | Denied with `23514` |
| Purchase intent for a different buyer | Denied with `23514` |
| Wallet ledger update | Denied with `55000` append-only error |
| Wallet ledger delete | Denied with `55000` append-only error |
| QR first verification | Returned `true`; `verified_at` set and replay count became 1 |
| QR second verification | Returned `false`; replay count remained 1 |

The fixture transaction was isolated to the disposable branch and used fixed IDs/labels beginning with `root-proof-fixture`. No production/default-branch row was touched.

These checks prove representative single-transaction behavior for the installed guardrails. They do not prove concurrent QR scanner behavior, role permissions of the deployed database user, preserved-row comparison across migration history, or production application.

## Preservation comparison

A matching read-only count query was run on the persistent `omni-v2-rebuild` branch and on the disposable migration branch.

| Measure | Persistent V2 branch | Disposable migration branch | Interpretation |
|---|---:|---:|---|
| Neon Auth users | 35 | 35 | Auth identity count unchanged |
| V2 accounts | 0 | 2 | Disposable branch contains only the two labeled proof accounts |
| Public V2 tables | 26 | 26 | No table loss or unexpected table addition |
| V2-named constraints | 125 | 127 | Two new migration-003 constraints present |
| Selected legacy public tables | 0 | 0 | No selected legacy table appeared or was removed |

This is a count-level preservation check, not a row-by-row checksum or migration replay comparison. The persistent V2 branch remains unchanged, and migration 003 remains unapplied there and on the production/default branch. The disposable branch is still temporary and must not be promoted automatically.

## Auth preservation checksum

A read-only checksum query was run against `neon_auth.user` on both branches. It returned the same 35-user count and matching non-reversible aggregate values:

| Measure | Persistent V2 branch | Disposable proof branch |
|---|---|---|
| Auth user count | 35 | 35 |
| Auth ID aggregate checksum | `ed098a8cfa789278524d3b99c8b7133c` | `ed098a8cfa789278524d3b99c8b7133c` |
| Auth schema aggregate checksum | `436113c870a83fee9caf861df0cceaf5` | `436113c870a83fee9caf861df0cceaf5` |

The checksums are aggregate evidence only and do not expose individual Auth IDs or credentials. They strengthen preservation confidence for the disposable migration test; they do not prove that migration 003 has been applied to the persistent V2 or production/default branch.

## Exactly-once event and audit behavior

Migration 004 was applied only on the expiring disposable branch and adds unique boundaries for a transaction state event and an audit action. Labeled duplicate attempts were then exercised:

| Check | Result |
|---|---|
| Duplicate `(transaction_id, state)` event | Denied by `v2_transaction_event_state_unique` with `23505` |
| Duplicate `(correlation_id, event_type, entity_type, entity_id)` audit action | Denied by `v2_audit_action_idempotency_unique` with `23505` |

This proves representative single-transaction duplicate denial on the disposable branch. It does not yet prove that every live writer uses these boundaries, that an idempotency retry returns the original response, or that concurrent transaction and audit writes are handled correctly in the deployed service.

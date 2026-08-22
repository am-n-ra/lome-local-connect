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

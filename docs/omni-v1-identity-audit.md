# Omni V1 Identity and Seller-Access Audit

**Audit mode:** read-only  
**Date:** 2026-08-19  
**Source:** existing `scripts/audit-demo-flows.mjs` against the configured database  
**Status:** `blocked-needs-data-repair`

## Finding

The demo email `demo@omni.tg` resolves to one Neon Auth user ID, but `public.profiles` contains multiple rows for the same email. The current Neon Auth identity is `a8c23f6a-84a9-452c-8be6-f0278060e436`; the seller-owned facilities are attached to a different legacy profile ID `8f5cc1cb-03cb-4c88-a9b2-c6ec5a5d70db`. The current `ensureProfile()` function correctly creates a profile for the authenticated provider ID when absent, but it does not reconcile duplicate email profiles or relink legacy ownership.

The local browser therefore reaches `/vendeur` with a valid buyer session but the seller shell returns `UNAUTHORIZED`/unauthorized data because seller queries consistently authorize with `facilities.owner_id = context.userId`. This is an identity/data-consistency failure, not evidence that the seller visual shell is ready or defective.

## Observed records

| Area | Observation | Consequence |
| --- | --- | --- |
| Neon Auth | One `demo@omni.tg` auth identity exists. | The provider identity is deterministic. |
| Public profiles | Three profile rows share the same email; one is current provider ID, two are legacy/duplicate IDs. | Email alone cannot be used as an ownership key without a repair policy. |
| Facilities | Four facilities are owned by the legacy profile; one is certified. | Current seller session cannot load the facility shell. |
| Transactions | No buyer transaction fixture exists for the audited current profile. | Full buyer/seller transaction E2E cannot be certified from this session. |
| Demand | Existing records include a manual request and an old bulk request with `credit_cost = 1`. | Existing data predates the current Free manual-only/Pro bulk decision and needs migration or explicit legacy display handling. |

## Required safe repair

Do not repair production by email in an ad hoc request. Create a staging-only migration/repair procedure that first selects a canonical provider identity, records every duplicate-to-canonical mapping, relinks owned facilities and dependent records inside a transaction, preserves audit history, and adds a uniqueness constraint or deterministic policy preventing duplicate profile emails. Re-run the read-only audit after repair and verify seller access with a distinct seller session before any production change.

The repair must define what happens to duplicate carts, demand requests, transactions, wallet ledger rows, notifications, roles, media ownership and audit records. It must be idempotent, reversible through a backup or explicit mapping table, and must stop if more than one provider identity claims the same email.

## Code boundary

Do not add an insecure email fallback to every seller query. That would hide the data defect and could merge two real accounts. The correct next implementation is a controlled identity-repair migration plus a canonical profile mapping helper only after the mapping decision is approved. Until then, seller certification is `blocked`, while buyer discovery and the QR-state correction remain `partial` and locally verified.

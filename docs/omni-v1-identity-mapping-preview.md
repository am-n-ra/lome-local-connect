# Omni V1 — Redacted Identity Mapping Preview

**Phase:** 2 — inventory and mapping preview  
**Risk:** L3  
**Status:** `blocked-before-mutation`  
**Target:** not yet proven as staging

## Candidate mapping

| Role | Redacted identifier | Evidence | Proposed treatment |
| --- | --- | --- | --- |
| Canonical Neon Auth identity | `auth:a8c23f6a…0436` | Current provider identity observed in the read-only audit. | Use as canonical candidate only in isolated staging. |
| Legacy profile/facility owner | `profile:8f5cc1cb…70db` | Four seller facilities are attached to this profile in the read-only audit. | Treat as source identity; preserve row and mapping evidence. |
| Other duplicate profile | `profile:791e3fb5…1f8e` | Same demo email, onboarding complete, no ownership evidence in the selected audit result. | Do not merge automatically; collision check required. |

The mapping is a **candidate**, not an authorization decision for production. The duplicate email is not sufficient proof that all rows represent one human account. A staging run must verify provider identity, ownership intent, roles, wallet state and conflicting activity before applying it.

## Inventory derived from repository contracts

| Surface | Identity-bearing fields or authorization root | Repair policy |
| --- | --- | --- |
| Profiles | `public.profiles.id`, email and onboarding metadata. | Preserve source rows; create an explicit source-to-canonical mapping. |
| Facilities | `facilities.owner_id`, claim/audit metadata. | Relink only facilities explicitly owned by the source identity; preserve claim history. |
| Roles | `user_roles.user_id`, `source`, `expires_at`. | Copy or relink only active roles after collision review; never broaden role scope. |
| Buyer demand | `demand_requests.buyer_id`, responses, credit cost and timestamps. | Relink buyer history only when the mapping is proven; preserve legacy credit semantics. |
| Cart and transaction | Buyer/facility ownership, intent keys, QR and transaction events. | Preserve amounts/statuses/events; verify uniqueness and seller/buyer authorization after mapping. |
| Chat and messages | Buyer/sender identity plus facility owner authorization. | Relink participants transactionally; prove cross-user denial. |
| Reviews | Buyer identity and transaction ownership. | Preserve author and transaction association; prevent duplicate review paths. |
| Coupons/offers | `target_user_id`, assignment/redemption/event user IDs. | Relink only user-owned artifacts; preserve redemption uniqueness and provenance. |
| Analytics and consent | Required/nullable profile-linked user fields. | Preserve consent; follow explicit nullable/FK policy for events. |
| Wallet | User/facility accounts, actor IDs, append-only ledger entries, transfers and snapshots. | Do not rewrite financial facts; use mapping/audit records and invariant checks. |
| Notifications/media | Recipient and owner-linked references. | Relink only allowlisted identity fields; keep audit trail. |

## Collision checks required before mutation

The staging query must stop if more than one active provider identity claims the same email, if the candidate canonical profile has independent facilities or financial activity, if source and canonical users have conflicting roles or wallet balances, if transactions have ambiguous buyer/seller ownership, or if dependent rows cannot be classified as user-owned versus facility-owned. It must also stop if any expected foreign-key update count differs from the preview.

## Required preview output

The repair runner must emit only redacted identifiers and counts: mapping run ID, source/canonical hashes, affected table counts, facility IDs/counts, role counts by provenance, demand/transaction/message/review/coupon/analytics counts, wallet account and ledger entry counts, financial totals before/after, orphan counts, and a deterministic checksum of the mapping. It must not emit connection strings, auth tokens, emails, phone numbers, QR tokens, coupon codes or wallet secrets.

## Current gate decision

No staging database or mutation marker is configured, so this preview cannot be executed against a target yet. The repository and prior read-only audit are sufficient to define the mapping shape, but not to approve the mapping. Resume only after Phase 1 proves an isolated staging target and provides distinct seller/buyer fixture IDs.

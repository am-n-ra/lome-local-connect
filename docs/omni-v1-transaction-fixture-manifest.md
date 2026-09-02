# Omni V1 — Transaction Certification Fixture Manifest

**Run family:** `omni-cert-20260819`  
**Status:** `prepared-blocked-on-second-auth-session`  
**Environment:** deployed Omni production with confirmed demo/test application data  
**Mutation performed:** none in this preparation step

## Selected fixture

| Role/surface | Selected record | Redacted identifier | Read-only evidence |
| --- | --- | --- | --- |
| Seller identity | Canonical repaired demo profile | `a8c23f6a…e436` | Current Neon Auth identity; owns the certified facility. |
| Seller facility | Épicerie Adidogomé Plus | `9ed61293…9034` | `certified`, six facilities now owned by canonical profile. |
| Product | Lait en poudre 400 g | `313a4458…623c` | Active, in stock, 3,200 FCFA, quantity 1. |
| Coupon | BIENVENUE10 | `dee978ce…713f` | Active, 10%; code intentionally not copied into this manifest. |
| Alternate coupon | OMNI15 | `82beb489…a3ba` | Active, 15%; code intentionally not copied into this manifest. |
| Buyer identity | Separate authenticated buyer | **Pending** | No second browser credential/session is available in the current task context. |

The selected seller facility has five active/in-stock products and two active coupons. The seller surface explicitly has no buyer-seller in-app payment and no seller withdrawal in V1. The selected coupon rows are generic active offers with no target-user restriction and no expiry timestamp in the read-only observation.

## Baseline snapshot

The current database contains 8 transactions, 38 transaction events, 7 wallet ledger entries with a total ledger amount of 105,690 in the database currency, 37 application profiles and 35 distinct profile email hashes. The private identity-surface rollback snapshot is stored outside the repository at `/home/ubuntu/omni-backups/omni-identity-surfaces-20260819.json`; its checksum is recorded in the identity-repair report. No fixture transaction, QR token, coupon redemption, wallet allocation or product mutation was created for this certification run.

## Planned run identity

Use a unique run ID derived from the second buyer fixture once available, for example `omni-cert-20260819-buyer01`. Use the same run ID as the transaction intent key for retries. Before any mutation, abort if an active transaction already exists with that key or if the seller/product/coupon ownership checks fail.

## Required proof before mutation

Provide or establish a separate authenticated buyer session that is not the seller’s canonical demo session. The buyer credential must be a test identity only; do not place personal credentials or passwords in this repository or chat. The seller session must remain authenticated as the repaired canonical demo identity. Once both sessions are available, the next action is the buyer discovery-to-intent proof, not fixture creation.

## Cleanup and rollback

Do not delete Neon Auth users or application profiles. If a tagged certification fixture is created, record every created row by run ID, use server idempotency, and reverse only the explicitly created application rows after the evidence is captured. Never reverse or rewrite pre-existing transactions, wallet ledger entries, coupon history or legacy completed-without-review fixtures as part of this run.

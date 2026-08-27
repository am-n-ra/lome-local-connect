# Transactional handoff progress — 2026-08-27

## Delivered

The Seller catalogue now permits an authorized Seller to edit a published product. The server changes the product back to `draft` when editing, so a changed public offer must be republished. Ownership, Seller readiness, facility-slot authorization, discount validation, and Free/Pro publication limits remain server-side.

The Buyer handoff now exposes a real route link to the selected facility after an authorized purchase intent exists. The public facility QR and the transaction QR remain separate: the route link is only navigation, while the transaction QR remains the account-bound handoff token used by the Seller.

A private transaction chat has been added for both Buyer and Seller. Messages are scoped to the transaction members, require an authenticated non-suspended account, are limited to 2,000 characters, and are stored in `v2_transaction_messages`. The fixed endpoint `/api/v2/transaction-messages?transactionId=...` is deployed with the existing serverless build pattern.

## Safety boundaries

No chat message can be sent by an account that is not a Buyer or Seller member of the transaction. No Wallet balance, external payment declaration, QR verification, or transaction state is changed by chat. The Live FedaPay payment remains user-declared evidence; no additional charge or verification was initiated.

## Verification

The test suite passes with 151 tests. The client-boundary check is clean. The Vercel function build now bundles 13 functions and the Vite production build succeeds. The only build note is the existing large client chunk warning.

## Remaining production work

The migration must be applied to the production Neon branch before chat writes can succeed. The next bounded branch is Admin review and access control, followed by mobile installation, push notification recovery, and an authorized Seller/Buyer browser proof.

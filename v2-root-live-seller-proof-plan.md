# Omni V2 — Live seller bearer proof plan

**Document ID:** `OMNI-V2-ROOT-LIVE-SELLER-001`  
**Structural path:** `Root System > seller availability response > authenticated live proof`  
**Method:** Nature Way  
**Status:** `in_progress`
**Auth decision:** [`v2-root-seller-bearer-simulation-options.md`](./v2-root-seller-bearer-simulation-options.md)
**Runner:** [`scripts/prove-v2-live-seller.mjs`](./scripts/prove-v2-live-seller.mjs)
**Environment template:** [`scripts/prove-v2-live-seller.env.example`](./scripts/prove-v2-live-seller.env.example)

## Mini-seed

Prove that the explicitly authorized demo seller identity can use a real authenticated bearer session against the deployed V2 routes, and that server authority connects that session to the labeled persistent-V2 seller fixture. This is the next highest-value Root proof because the current evidence proves only local policy, protected-route presence and direct database fixture behavior.

The proof is limited to the existing demo seller fixture on the persistent V2 branch. It does not create a seller workspace, claim a public-import facility, certify a facility, alter a real user, write the production/default branch or represent marketplace adoption.

## Manual authentication boundary

The user must personally sign in as the authorized demo seller identity in the connected browser, or confirm that an already-open session is that identity. The agent must not request, receive, type or inspect a password, one-time code, recovery code, bearer token, Auth ID or connection value. If the correct seller session is not already available, the proof stops at `manual` and the user owns the login step.

The current browser page is the canonical map-first entry surface. The browser bridge returned HTTP 504 while opening the J5 account surface and again while inspecting the Auth page, so those timeouts are runtime limitations and not proof of authentication failure or success.

## Autonomous feasibility check

The repository Auth client exposes the normal email/password sign-in and sign-up path plus retrieval of an existing JWT session. The server accepts a bearer token and verifies its subject against the Neon Auth JWKS; there is no autonomous demo-session, impersonation or pre-provisioned bearer mechanism in the repository or environment names. The disposable Neon branch `omni-v2-seller-proof-20260823` now exists with branch-local Better Auth and a branch-specific Auth/JWKS endpoint. The guarded runner consumes only external `OMNI_PROOF_*` values, refuses the canonical domain, keeps tokens and fixture IDs in memory, and fails preflight when those external values are absent. No password, one-time code, recovery code, bearer token, Auth ID or connection value was requested, received, typed or inspected by the agent.

A status-only negative pass against all protected V2 mutation routes returned HTTP 401 for `/api/v2/availability`, `/api/v2/availability-responses`, `/api/v2/purchase-intents`, `/api/v2/qr-issuances`, `/api/v2/qr-verifications`, `/api/v2/transaction-transitions`, `/api/v2/external-payment-declarations` and `/api/v2/external-payment-confirmations`. This confirms the deployed boundary fails closed without authentication; it does not provide the seller bearer required for positive proof.

## Root contract and route order

The live proof must use server-issued identifiers from the bounded fixture and a fresh, non-secret correlation value for each operation. Identifiers and idempotency values must remain in the execution channel only and must not be written into evidence.

| Step | Actor/session | Route or operation | Required assertion | Mutation boundary |
|---|---|---|---|---|
| 1 | Demo seller bearer | `POST /api/v2/availability-responses` | `201`; seller is derived from the bearer, the facility/product are owned and published, the request scope matches, and the available quantity is within persisted Omni allocation | One seller response plus its audit context; no stock reservation |
| 2 | Same demo seller bearer | Repeat step 1 with the same body and same `Idempotency-Key` | Original response is returned; no second response is created | Sequential idempotency only in this pass |
| 3 | Same demo seller bearer | Repeat step 1 with the same key and a conflicting body | Conflict is rejected; original response is unchanged | Negative idempotency proof |
| 4 | Authorized buyer bearer | `POST /api/v2/purchase-intents` for the response | `201`; one immutable transaction snapshot, buyer/seller memberships and initial event | Buyer-only intent mutation |
| 5 | Demo seller bearer | `POST /api/v2/qr-issuances` for the transaction | `201`; QR is server-issued and transaction-bound; returned QR material is never written to evidence | Seller-only issuance; current state becomes `qr_ready` |
| 6 | Demo seller bearer | `POST /api/v2/qr-verifications` using the server-issued transaction/QR material | First request is accepted and appends the expected event/audit fact | Seller membership, exact transaction/token match, unexpired and unverified token |
| 7 | Demo seller bearer | Repeat step 6 with the same QR material | `409`; replay is rejected and replay state increments exactly once | Sequential replay negative proof |
| 8 | Authorized buyer bearer | `POST /api/v2/external-payment-declarations` with `pay_on_delivery` | `200`; one declaration and one `payment_declared` event | Declaration only; no in-app payment rail |
| 9 | Demo seller bearer | `POST /api/v2/external-payment-confirmations` for the transaction | `200`; seller acknowledgement is accepted exactly once and `payment_confirmed` is recorded | External acknowledgement only |

The buyer bearer in step 4 and step 8 may reuse the already authorized KH buyer session only if the session is still available and the operation is explicitly bounded to this fixture. If a second authenticated browser actor cannot be established without asking the agent to handle credentials, stop rather than substitute a fixture insert or direct SQL call.

## Evidence to retain

| Evidence | Retain | Never retain |
|---|---|---|
| Route outcomes | HTTP status, redacted error code, response state, actor class, deployment commit/alias and non-secret correlation reference | Full bearer header, cookies or raw Auth identifiers |
| Persistence | Aggregate counts and state totals before/after; one response, one intent, one snapshot, two members, one QR token and expected event counts | IDs, QR token hashes, token material, idempotency values or connection strings |
| Security | Seller ownership, buyer/seller role separation, conflicting-key rejection, QR replay rejection and payment-method restriction | Passwords, login codes, raw request dumps or screenshots containing credentials |
| Recovery | Expired/mismatch/replay response and safe retry guidance | A claim that sequential proof establishes concurrency or camera proof |

## Mini-heartwood extension

After the bounded sequential path succeeds, concurrency remains a separate operation. Two independent HTTP clients or sessions must submit the same QR verification against the same transaction, and the database result must show one accepted transition and one rejected attempt. A single sequential Neon SQL call cannot satisfy this requirement.

Camera proof is also separate. It requires an HTTPS camera-capable browser, an explicit permission prompt, visible live preview, detection, stream shutdown and manual fallback. A server-issued QR or a successful HTTP verification is not camera proof.

## Ring decision

The proof may be marked `verified` only when the seller bearer, response idempotency, buyer intent, server-issued QR, first verification, sequential replay rejection, declaration and seller acknowledgement are all observed through the deployed authenticated path and the aggregate state matches without secret disclosure. Because no autonomous demo session is available and the browser bridge did not provide a usable authenticated session, the item is currently `blocked` at the authentication boundary; Root remains `review` and Buyer Trunk remains blocked. The next permissible step is to bind a Vercel Preview to the disposable branch, place fresh test credentials in an external secret store, and run `npm run proof:live-seller` with the non-secret environment metadata plus secret-store injection. The runner is intentionally blocked until those external values exist; the user-provided chat password is not used. A pre-existing authenticated demo seller session remains an alternative, without transferring credentials to the agent.

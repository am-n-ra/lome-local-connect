# Omni V2 — Seller bearer simulation and unblock plan

**Document ID:** `OMNI-V2-ROOT-AUTH-SIMULATION-001`  
**Structural path:** `Root System > Auth boundary > seller bearer proof`  
**Method:** Nature Way  
**Observed:** 2026-08-23  
**Status:** `decision-ready`

## Mini-seed

Unblock the real deployed seller proof for `response → purchase intent → QR issuance → QR verification` without weakening Neon Auth, bypassing server authorization, handling a human password in the agent session, or confusing a local test token with a real Neon Auth bearer.

The target proof is the explicitly authorized demo seller fixture on an isolated V2 test environment. It is not a production-user flow, marketplace adoption claim, seller workspace, facility certification or camera proof.

## Root contract

The Omni server accepts only an `Authorization: Bearer ...` header whose JWT signature is verified against the configured Neon Auth JWKS. The actor is derived from the verified `sub`; the client cannot select the V2 account. The seller route then checks the V2 account binding, onboarding state, facility ownership, product publication, request scope and allocated quantity. A valid simulation must therefore produce a **real signed token from the same Neon Auth issuer**, or it must be explicitly labeled as a local HTTP-test substitute.

The current repository exposes email/password sign-in and sign-up through the client and JWT retrieval for an existing session. It does not expose a test impersonation switch, a token minting endpoint or an Auth admin plugin. The deployed negative proof returns HTTP 401 for all protected V2 mutation routes without a bearer.

## Option comparison

| Option | Produces a real Neon Auth bearer? | Password handling by agent | Valid for deployed seller proof? | Decision |
|---|---:|---:|---:|---|
| Pre-existing authenticated demo-seller browser session | Yes | None if the session is already present | Yes, if the session is confirmed to be the demo seller and the bearer is used only in memory | Preferred when available; current browser bridge is unreliable |
| Dedicated Neon Auth preview/CI sign-up and sign-in using encrypted test secrets | Yes | No value is exposed to the agent; the test runner reads encrypted CI/Preview secrets at runtime | Yes; strongest autonomous path | **Recommended implementation** |
| Better Auth admin impersonation | Potentially yes, but only when the Auth server has the Admin plugin and the caller is authenticated as an admin | Admin session must be established through a supported, user-owned channel | Yes in a dedicated test environment, not automatically in current Managed Auth | Conditional alternative; not currently configured |
| Local ephemeral EdDSA key plus local JWKS server | No Neon Auth bearer; valid only for local verification | No human password | No; proves HTTP/JWT plumbing only | Useful local integration test, not live proof |
| Direct SQL inserts into `neon_auth.user`, `neon_auth.account` or `neon_auth.session` | No supported signed session lifecycle | May require hand-crafted password hashes or session material | No; bypasses Auth lifecycle and can create dangling state | Reject |
| Hand-crafted JWT, fake `sub`, unsigned token or development bypass header | No | None | No; defeats the security boundary | Reject |
| Neon management API user creation alone | Creates or propagates a user, but does not by itself establish the browser session required by the protected V2 API | May involve sensitive email/admin data | Not by itself | Insufficient alone; use only as part of a documented Auth test flow |

Neon’s Managed Better Auth documentation explicitly describes branch-isolated authentication environments and full sign-up/login testing in preview or CI branches [1]. The Neon management reference also marks the older standalone Auth user endpoint deprecated and directs users to the branch-scoped Auth user API [2]. Better Auth’s Admin plugin documents user creation and impersonation, but those operations require an authenticated admin and the plugin to be installed/configured [3].

## Recommended implementation path

### 1. Isolate the proof environment

Create a disposable Neon branch from `br-dawn-hill-am5amy22`, for example `omni-v2-seller-proof`, and never point the test harness at `br-bitter-math-amrlbym6` or the production/default branch. Deploy the current V2 commit to a Vercel Preview whose `V2_DATABASE_URL` is bound to that proof branch. The preview environment must be identifiable by deployment URL and commit, but no connection value may appear in logs, evidence or chat.

Keep the existing persistent V2 demo fixture as the source of the bounded seller/product/request shape, or seed a labeled copy on the disposable branch with the existing idempotent fixture procedure. Do not delete the current persistent demo identities merely to obtain credentials; deletion does not produce a signed session and would destroy useful evidence.

### 2. Inject test credentials through an external secret store

Create four test-only secret names in the CI or Preview secret store: `OMNI_TEST_SELLER_EMAIL`, `OMNI_TEST_SELLER_PASSWORD`, `OMNI_TEST_BUYER_EMAIL` and `OMNI_TEST_BUYER_PASSWORD`. The values must be random demo credentials, scoped to the disposable Auth branch and never reused by a human account.

The agent must not read, print, paste or receive these values. The runner may consume them only in process memory. Logs must contain only actor class, route, HTTP status, redacted error code, aggregate counts and a non-secret correlation reference. If the external secret store cannot be configured without exposing values to the agent, this step remains `manual` and the live proof stays blocked.

### 3. Add a test-only Auth session bootstrap

Implement a Playwright/Node proof harness outside the production client path. It should call the existing Neon Auth sign-in method with the encrypted seller or buyer secrets, retrieve the session JWT in memory, and immediately use it as a bearer header against the Vercel Preview. It must never write the token to a file, screenshot, test snapshot, console, exception message or evidence document.

If the fixture branch does not contain the required user, the bootstrap may sign up the test user through the normal Neon Auth API in that branch. It must then verify the session through the Auth client before calling Omni. No direct insert into `neon_auth` is permitted. The harness should fail if the Auth issuer, JWKS origin or preview database branch is not the expected test environment.

### 4. Resolve fixture IDs in memory only

The harness needs a matching `requestId`, `facilityId` and `productId`. Resolve them inside the test process from the labeled fixture using a server-side fixture query or a dedicated test setup helper; do not print them. The selected row must satisfy all of the following: the facility is owned by the demo seller account, the product belongs to that facility and is published, the buyer request selects that product, the facility is in the request scope, and the product’s `quantity_allocated_omni` is sufficient for the requested response.

The test should record only aggregate pre/post counts. It must not use public facility IDs as a substitute for ownership proof, and it must not expose stock through the public API.

### 5. Execute the positive seller/buyer route sequence

| Order | In-memory actor | Route | Required result |
|---:|---|---|---|
| 1 | Seller | `POST /api/v2/availability-responses` with a fresh idempotency key | `201`; one authorized response and audit context |
| 2 | Seller | Repeat the same body and key | Same response; no duplicate |
| 3 | Seller | Reuse the key with a conflicting body | Conflict; original response unchanged |
| 4 | Buyer | `POST /api/v2/purchase-intents` for the response | `201`; one intent, immutable snapshot, two memberships and initial event |
| 5 | Seller | `POST /api/v2/qr-issuances` for the transaction | `201`; server-issued transaction-bound QR material held only in memory |
| 6 | Seller | `POST /api/v2/qr-verifications` with the returned QR material | `200`; first verification accepted, event/audit appended |
| 7 | Seller | Repeat verification with the same material | `409`; replay rejected and replay state increments once |
| 8 | Buyer | `POST /api/v2/external-payment-declarations` with `pay_on_delivery` | `201`; one declaration and `payment_declared` event |
| 9 | Seller | `POST /api/v2/external-payment-confirmations` | `200`; seller acknowledgement and `payment_confirmed` event |

The harness must stop on any unexpected status and must not blindly retry a non-idempotent request after an unknown network outcome. It should use correlation IDs and idempotency keys generated in memory, with values redacted from output.

### 6. Prove concurrency separately

After the sequential route path succeeds, sign in two independent seller sessions from the encrypted test credentials and submit the same QR verification concurrently with `Promise.all` or two independent HTTP clients. Assert exactly one acceptance and one conflict, one committed `qr_verified` event and one replay increment. A sequential SQL script cannot satisfy this acceptance criterion.

### 7. Keep camera proof separate

A valid bearer and successful QR HTTP verification do not prove camera behavior. Camera proof requires a secure-origin Preview, explicit camera permission, visible live stream, code detection, stream shutdown, denied-permission recovery and manual fallback. It is a later Heartwood/Recovery operation and must not be used to conceal an incomplete bearer proof.

## Acceptance and stop conditions

The seller bearer item can move from `blocked` to `verified` only when the harness demonstrates the full sequence through a deployed Preview or canonical test deployment, the actor is authenticated by Neon Auth, the V2 seller account is derived from the token subject, aggregate state matches the expected bounded fixture deltas, sequential idempotency and replay rules pass, and no credential or token material is disclosed.

If test secrets cannot be injected without agent visibility, if the Auth branch cannot issue a real session, or if the proof runner cannot isolate its database branch, stop at `manual`/`blocked`. Do not replace the missing proof with a local fake JWT, direct SQL, a fixture-only transaction, a 401 smoke test or a screenshot.

## Selected decision

Use **dedicated Neon Auth branch/Preview sign-in with encrypted test secrets consumed by an in-memory test runner**. Keep the local ephemeral-JWKS harness as a separate lower-level test. Do not use direct SQL identity creation, hand-crafted JWTs, fake bypass headers or deletion/recreation of the current demo identities as a substitute for a real Auth session.

## References

[1]: https://neon.com/docs/auth/overview "Managed Better Auth — Neon Docs"
[2]: https://api-docs.neon.tech/reference/createneonauthnewuser "Create new auth user — Neon API Reference (deprecated endpoint notice)"
[3]: https://better-auth.com/docs/plugins/admin "Admin plugin — Better Auth"

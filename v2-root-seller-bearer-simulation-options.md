# Omni V2 — Seller bearer simulation and unblock plan

**Document ID:** `OMNI-V2-ROOT-AUTH-SIMULATION-001`  
**Structural path:** `Root System > Auth boundary > seller bearer proof`  
**Method:** Nature Way  
**Observed:** 2026-08-23  
**Status:** `in_progress`

## Mini-seed

Unblock the real deployed seller proof for `response → purchase intent → QR issuance → QR verification` without weakening Neon Auth, bypassing server authorization, handling a human password in the agent session, or confusing a local test token with a real Neon Auth bearer.

The target proof is the explicitly authorized demo seller fixture on an isolated V2 test environment. It is not a production-user flow, marketplace adoption claim, seller workspace, facility certification or camera proof.

## Root contract

The Omni server accepts only an `Authorization: Bearer ...` header whose JWT signature is verified against the configured Neon Auth JWKS. The actor is derived from the verified `sub`; the client cannot select the V2 account. The seller route then checks the V2 account binding, onboarding state, facility ownership, product publication, request scope and allocated quantity. A valid simulation must therefore produce a **real signed token from the same Neon Auth issuer**, or it must be explicitly labeled as a local HTTP-test substitute.

The current repository exposes email/password sign-in and sign-up through the client and JWT retrieval for an existing session. It does not expose a test impersonation switch, a token minting endpoint or an Auth admin plugin. The deployed negative proof returns HTTP 401 for all protected V2 mutation routes without a bearer. The user has supplied a demo password in chat, but the agent must not enter, submit, reuse or store it; it is therefore not an autonomous test secret.

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

A disposable Neon branch named `omni-v2-seller-proof-20260823` has been created from persistent V2 with branch-local Better Auth and a branch-specific Auth/JWKS endpoint. The remaining environment action is to deploy the current V2 commit to a Vercel Preview whose `V2_DATABASE_URL` is bound to that branch and configure the same branch-specific Auth/JWKS URLs. The test runner refuses the canonical domain and requires `OMNI_PROOF_ENVIRONMENT=isolated`. The preview environment must be identifiable by deployment URL and commit, but no connection value may appear in logs, evidence or chat. Because the user-reported deletion left the persistent seller-ready V2 account with an unmatched Auth binding, use a fresh labeled seller fixture on the disposable branch or repair that binding only after the new Auth user is created through the supported Auth lifecycle.

Keep the existing persistent V2 demo fixture as the source of the bounded seller/product/request shape, or seed a labeled copy on the disposable branch with the existing idempotent fixture procedure. Do not delete the current persistent demo identities merely to obtain credentials; deletion does not produce a signed session and would destroy useful evidence.

### 2. Inject test credentials through an external secret store

The repository now provides the non-secret template `scripts/prove-v2-live-seller.env.example` and the runner expects `OMNI_PROOF_SELLER_EMAIL`, `OMNI_PROOF_SELLER_PASSWORD`, `OMNI_PROOF_BUYER_EMAIL` and `OMNI_PROOF_BUYER_PASSWORD` in an external CI/Preview secret store. Values must be freshly generated, scoped to the disposable Auth branch and never reused by a human account. The password supplied in chat is not used.

The agent must not read, print, paste or receive these values. The runner may consume them only in process memory. Logs contain only branch metadata and step/status markers; fixture IDs, correlation values, idempotency keys, QR material and database URLs are not printed. If the external secret store cannot be configured without exposing values to the agent, this step remains `manual` and the live proof stays blocked.

### 3. Add a test-only Auth session bootstrap

Implemented `scripts/prove-v2-live-seller.mjs` and registered `npm run proof:live-seller`. It uses the installed Neon Auth client, attempts sign-in first, permits branch-local sign-up only when `OMNI_PROOF_ALLOW_SIGN_UP=1`, retrieves the JWT in memory and immediately uses it as a bearer header against the isolated Preview. It emits only step/status markers, never credential or token material. It must never write the token to a file, screenshot, test snapshot, console, exception message or evidence document.

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

Use **dedicated Neon Auth branch/Preview sign-in with encrypted test secrets consumed by an in-memory test runner**. The supplied chat password is not used by the agent. Keep the local ephemeral-JWKS harness as a separate lower-level test. Do not use direct SQL identity creation, hand-crafted JWTs, fake bypass headers or deletion/recreation of the current demo identities as a substitute for a real Auth session. Before the live seller test, repair the seller-ready V2 account’s unmatched Auth binding through a supported, auditable operation on the isolated branch.

## References

[1]: https://neon.com/docs/auth/overview "Managed Better Auth — Neon Docs"
[2]: https://api-docs.neon.tech/reference/createneonauthnewuser "Create new auth user — Neon API Reference (deprecated endpoint notice)"
[3]: https://better-auth.com/docs/plugins/admin "Admin plugin — Better Auth"

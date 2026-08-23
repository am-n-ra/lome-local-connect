# Omni V2 — Demo account recreation decision

**Document ID:** `OMNI-V2-ROOT-DEMO-RECREATE-001`  
**Structural path:** `Root System > Auth fixture boundary > demo recreation`  
**Method:** Nature Way  
**Observed:** 2026-08-23  
**Status:** `blocked`

## Confirmed scope

The user confirmed a destructive scope limited to the explicitly authorized demo seller and demo buyer identities and their associated persistent-V2 fixture rows. The allowed boundary excludes all other Neon Auth identities, legacy tables, public/default data, production/default branch records and unrelated Neon branches.

## Inventory result

The initial read-only aggregate inventory found 35 Neon Auth users, 2 V2 accounts and 2 wallets. One `buyer_ready` V2 account had two availability requests, one transaction membership and no owned facility. One `seller_ready` V2 account owned the labeled `Omni Demo Seller Hub` facility, had one published product, one transaction membership and one wallet. The two linked Auth accounts had password-provider records, but no password value, hash value, email, raw Auth ID or session token was read or recorded.

After the user reported deleting the demo accounts, the aggregate Auth-user count is 30 while the V2 aggregate remains 2 accounts and 2 wallets. The buyer-ready account still has one matching Auth account; the seller-ready account still has its V2 binding field but has no matching row in `neon_auth.account`. The seller facility and its product remain present. The count change is recorded as observed, but the five deleted Auth rows are not attributed individually because raw identities were intentionally not inspected.

## Safe-method decision

The repository Auth client exposes the normal email/password sign-in and sign-up methods plus retrieval of an existing JWT session. The server validates a bearer token against the Neon Auth JWKS and derives the actor from the token subject. Current Neon MCP capabilities provide branch/Auth provisioning and SQL, but not a supported user-level delete/recreate or session-impersonation operation for this project. Neon’s documented management API can create or propagate a branch-scoped Auth user, but user creation alone does not establish the browser session required by the protected V2 API. Better Auth’s documented Admin plugin can create or impersonate users only when that plugin and an authenticated admin session are configured; the current project does not configure them. Direct SQL insertion into `neon_auth.user`, `neon_auth.account` or `neon_auth.session` would bypass the Auth lifecycle and would not produce a trustworthy signed bearer session. The password supplied in chat will not be entered, reused or stored by the agent.

## Ring decision

The user deleted the current demo Auth rows outside this agent operation. The V2 fixture rows were not deleted by the agent and remain present, but the seller-ready V2 account now has a stale/unmatched Auth binding. This is a recoverable Root data-integrity condition, not proof of a valid seller session. No further deletion should occur until the intended demo identities are positively identified through a supported Auth operation.

The deployed negative proof remains valid: every protected V2 mutation route returns HTTP 401 without a bearer. Existing bounded direct-database transaction evidence remains fixture evidence only. Post-deletion aggregate state is 30 Auth users, 2 V2 accounts, 2 wallets, 4 facilities, 4 products, 2 availability requests, 1 purchase intent, 1 QR token, 5 transaction events and 1 external payment declaration; the labeled demo facility remains `created` / `unconfirmed` with one product. No V2-row deletion, password operation, session fabrication or credential disclosure occurred in this agent operation.

## Required next capability

To move the live seller proof beyond `blocked`, a supported Auth path must first create or restore the intended demo seller identity and a real signed session: either a user-controlled sign-up/sign-in, an isolated CI/Preview secret-store runner, or a configured authenticated admin/test-session facility. After creation, the server-side fixture repair must bind exactly that new Auth identity to the seller-ready V2 account on persistent V2, with aggregate pre/post checks and no other identity changes. Until then, Root remains `review`, the seller bearer proof remains `blocked`, and Buyer Trunk expansion remains prohibited.

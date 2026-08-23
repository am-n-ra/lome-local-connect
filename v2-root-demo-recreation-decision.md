# Omni V2 — Demo account recreation decision

**Document ID:** `OMNI-V2-ROOT-DEMO-RECREATE-001`  
**Structural path:** `Root System > Auth fixture boundary > demo recreation`  
**Method:** Nature Way  
**Observed:** 2026-08-23  
**Status:** `blocked`

## Confirmed scope

The user confirmed a destructive scope limited to the explicitly authorized demo seller and demo buyer identities and their associated persistent-V2 fixture rows. The allowed boundary excludes all other Neon Auth identities, legacy tables, public/default data, production/default branch records and unrelated Neon branches.

## Inventory result

A read-only aggregate inventory on persistent V2 found 35 Neon Auth users, 2 V2 accounts and 2 wallets. One `buyer_ready` V2 account has two availability requests, one transaction membership and no owned facility. One `seller_ready` V2 account owns the labeled `Omni Demo Seller Hub` facility, has one published product, one transaction membership and one wallet. The two linked Auth accounts have password-provider records, but no password value, hash value, email, raw Auth ID or session token was read or recorded.

## Safe-method decision

The repository Auth client exposes the normal email/password sign-in and sign-up methods plus retrieval of an existing JWT session. The server validates a bearer token against the Neon Auth JWKS and derives the actor from the token subject. The configured Neon MCP capabilities provide branch/Auth provisioning and SQL, but no supported user-level Auth delete, user recreation or session-impersonation operation. Direct SQL insertion into `neon_auth.user` or `neon_auth.account` would bypass the Better Auth lifecycle and would not produce a valid signed bearer session. Generating or submitting a password programmatically would also violate the project’s no-agent-password rule.

## Ring decision

The demo identities and V2 rows were **not deleted**. Deleting them would be irreversible within the authorized branch and would not solve the actual blocker: a real Neon Auth bearer session. The correct Nature Way decision is to preserve the existing labeled demo fixtures and stop at the Auth boundary rather than create dangling or synthetic identity records.

The deployed negative proof remains valid: every protected V2 mutation route returns HTTP 401 without a bearer. Existing bounded direct-database transaction evidence remains fixture evidence only. A second aggregate-only preservation check after the decision remained unchanged at 35 Auth users, 2 V2 accounts, 2 wallets, 4 facilities, 4 products, 2 availability requests, 1 purchase intent, 1 QR token, 5 transaction events and 1 external payment declaration; the labeled demo facility remained `created` / `unconfirmed` with one product. No production/default write, Auth deletion, V2-row deletion, password operation or credential disclosure occurred during this decision.

## Required next capability

To move the live seller proof beyond `blocked`, one of the following must exist: a pre-existing authenticated demo seller browser session that the agent can use without handling credentials, or a supported Neon Auth administrative/test-session facility that issues a real signed JWT without exposing a password or bypassing production authorization. Until then, Root remains `review`, the seller bearer proof remains `blocked`, and Buyer Trunk expansion remains prohibited.

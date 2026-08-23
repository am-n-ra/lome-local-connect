**Document ID:** `OMNI-V2-ROOT-LIVE-SELLER-RUNNER-001`  
**Structural path:** `Root System > Auth boundary > seller bearer proof > guarded runner`
**Method:** Nature Way  
**Observed:** 2026-08-23  
**Status:** `blocked-before-job-start`

## Scope

This record covers preparation and attempted guarded execution of the seller-bearer runner for the user-approved current production-connected B path. It does not claim a live seller transaction, QR success, camera proof, payment success or production release clearance.

## Prepared boundary

The persistent V2 branch `omni-v2-rebuild` is the selected application/Auth/database environment. Its Neon Auth configuration has email/password sign-up enabled and the Omni Preview origin added to the trusted-origin list. The canonical deployment serves the current V2 map-first application and is the public HTTP target encoded by the guarded production-connected mode.

The repository contains `scripts/prove-v2-live-seller.mjs`, the non-secret template `scripts/prove-v2-live-seller.env.example`, the command `npm run proof:live-seller` and `.github/workflows/prove-v2-live-seller.yml`. The runner accepts `production-connected-demo` only with an explicit allow flag, requires the canonical base URL in that mode, signs in through official Neon Auth, binds only the labeled demo seller fixture and guarded buyer application account, keeps credentials/tokens/fixture identifiers/idempotency values in memory and emits only redacted markers. No direct Neon Auth SQL, fabricated bearer or Auth bypass is used.

The workflow is manual-dispatch only, restricted by condition to `omni-v2-rebuild`, checks out that branch, uses the GitHub environment `omni-v2-seller-proof`, and injects values only from external secrets. It was registered on the repository default branch solely so GitHub can discover the workflow; the workflow still executes the V2 branch and does not copy application code to the default branch.

## Operator-managed inputs

The GitHub environment metadata reports all eight required secret names: branch ID, canonical base URL, persistent Auth URL, persistent database URL, seller email/password and buyer email/password. Values were not read. The workflow inputs were set for `allow_signup=0` and `rebind_fixtures=1`, because both identities were created through the official Omni Auth UI and the application binding is guarded and additive.

## Executed checks

The runner and workflow changes passed `git diff --check`, the full Vitest suite with 12 files and 75 tests, `npm run build`, `npm run check:boundary`, a staged-content secret scan and a clean commit/push on `omni-v2-rebuild` at commit `505ab4d`. The corresponding Vercel deployment reached `READY` and carries the same commit metadata.

A manual workflow dispatch was accepted by GitHub, but the run completed without starting the job. The visible GitHub annotation states that the account is locked because of a billing issue. Therefore no Auth request, database mutation, bearer proof, QR issuance, payment declaration or transaction transition was attempted by the failed run. This is a host-execution blocker, not a proof result.

## Not proven

The following remain open: seller bearer sign-in through the runner, additive seller fixture rebinding, seller availability response, same-key idempotent replay, conflicting-key rejection, buyer purchase intent, server-issued QR, first QR verification, sequential replay rejection, external payment declaration/acknowledgement, concurrent QR verification and HTTPS camera recovery. The browser did prove official account creation for two user-controlled identities and one current-environment buyer availability request, but those facts do not replace the seller bearer proof.

## Ring decision

Root remains `review` and Buyer Trunk remains closed. The next action is not another code workaround: the operator must restore GitHub Actions execution for this repository/account or provide an approved equivalent external runner that can consume the same eight values in memory. Once execution is available, the already-dispatched proof contract can be rerun; no password from chat is used and no direct Auth-table write is permitted.

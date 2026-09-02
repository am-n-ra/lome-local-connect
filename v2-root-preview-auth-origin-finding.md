# Root Finding — Preview Auth Origin

Status: `resolved-for-current-b-path`

## Original failure

The isolated Omni Preview loaded the map-first app and reported `data-auth="configured"`, but official sign-up returned `Invalid origin`. The request was being evaluated against an Auth endpoint whose trusted-origin list did not contain the Preview origin.

## Resolution

The user selected the current production-connected B path rather than the disposable branch. Read-only configuration checks confirmed that the deployed V2 client and server were already using the persistent V2 Auth/database binding. The missing configuration was the exact Vercel Preview origin in the persistent V2 Neon Auth `trusted_origins` list. That origin was added to the persistent V2 branch only; email/password sign-up remains enabled and email verification is not required for this demo path.

The user then completed two account-creation flows through the official Omni Auth sheet, personally entering fresh disposable credentials. The first account returned to the map with an active session, was signed out through Omni, and the second account returned to the map with an active session. No credential, bearer, raw Auth ID or endpoint value is recorded here.

## Current status

The official Auth sign-up origin blocker is resolved for the current production-connected B path. The buyer session also submitted one catalog-backed availability request for the labeled demo facility, and aggregate-only checks confirmed application account/wallet/request creation on persistent V2. Distinct seller/buyer subject mapping and the seller bearer transaction proof remain open until the operator supplies the already-created credentials through the external secret boundary.

## Non-claims

This finding does not claim a successful seller response, QR issuance, QR replay rejection, payment declaration, seller acknowledgement, concurrent verification, camera proof, marketplace activity or production release clearance. No direct Neon Auth SQL, fabricated bearer or authentication bypass was used.

# Live current-Neon evidence — 2026-08-22

## Environment

- Vercel project: `omniview`, Git branch `omni-v2-rebuild`, deployment `dpl_Eev6K9XuJ9kLn7A6Ye19mTfyseH7`.
- Deployment metadata reports state `READY`, target `production`, commit `29a946ffcf2d871a3c0f7f41e02e04e326888cfa`, and aliases including `https://omniviewer.vercel.app/`, `https://omni.sparkafrika.online/` and `https://lome-local-connect.vercel.app/`.
- Neon target: project `wild-moon-30984513`, branch `br-bitter-math-amrlbym6` (`production`), database `neondb`.
- Neon Auth is provisioned on that branch. The branch-scoped JWKS endpoint is configured in Neon; no secret values are recorded here.

## Current branch data

- Before proof seeding, the new V2 tables were empty (`v2_facilities=0`, `v2_products=0`, `v2_accounts=0`) while `neon_auth.user=35`.
- Five idempotent V2-only proof inserts were applied to the current branch. No historical table, `neon_auth` identity, DELETE, DROP or TRUNCATE operation was used.
- Read-only verification returned three facilities: Cotonou Fresh Hub (`unconfirmed`, one published product), Mènontin Home Bakery (`unconfirmed`, one published product), and Zongo Mobile Market (`unclaimed`, zero published products).
- These are bounded proof fixtures, not claimed real marketplace inventory.

## Live API

- `GET https://omniviewer.vercel.app/api/v2/public/facilities` returned HTTP 200 and three V2 facilities with coordinates, trust states and product counts.
- `GET https://omniviewer.vercel.app/api/v2/facilities/00000000-0000-0000-0000-000000000001` returned HTTP 200 and the facility-scoped published `Tomatoes` catalogue item.
- `POST https://omniviewer.vercel.app/api/v2/availability` without a bearer token returned HTTP 401. This confirms the protected write gate; no request row was created.

## Browser observation

- The connected browser loaded both the Vercel alias and the trusted custom domain. Extracted live page content showed `Omni V2`, `Live map`, `The world around you`, `3 public places in view`, and `Public exploration · account required to verify`.
- Browser extension viewport inspection timed out twice; therefore this pass records live page/content reachability but not a fresh screenshot-level interaction proof. Existing four-width local/deployment evidence remains in `trunk-proof.md`.

## Outstanding proof

- Authenticated live availability POST, duplicate idempotency replay, and interruption/recovery proof remain incomplete.
- A full browser screenshot-level check of facility selection/detail is still desirable once the connected browser bridge responds reliably.
- Do not call the Trunk production-ready until those protected-flow proofs and Heartwood recovery checks pass.

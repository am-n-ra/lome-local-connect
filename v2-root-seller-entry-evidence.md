# Omni V2 — Root Seller Entry Evidence

**Document ID:** `OMNI-V2-ROOT-SELLER-ENTRY-001`
**Method:** Nature Way — Phase 2, Root System / bounded entry correction
**Observed:** 2026-08-23
**Status:** `partial`

## Mini-seed

An authenticated Omni account must be able to choose `Vendre` and arrive at a truthful seller boundary. It must not reopen Auth and silently return to the buyer surface. The entry boundary must not create a seller profile, claim a facility, publish a product or imply seller authorization that the server has not granted.

## Root correction

The previous handler always called the Auth entry when `Vendre` was clicked. After Auth completed with no seller-specific return target, the client returned to the buyer shell, producing the observed `Vendre → Auth → buyer` loop.

The V2 correction adds an explicit seller-entry intent. An authenticated session opens a dedicated `seller-entry` sheet directly. An anonymous visitor is sent to Auth with `returnTo: seller-entry`, so a successful sign-in returns to the seller boundary rather than the buyer shell. The boundary is intentionally truthful: it displays `Accès vendeur à vérifier` when no authorized seller profile is linked, and states that the account remains intact and no facility/product mutation occurs.

The seller-entry decision is exported as `resolveSellerEntry` and covered by focused tests. The correction does not grant seller authorization and does not replace the future server-authoritative seller workspace.

## Live browser proof

The Git-integrated Vercel deployment for commit `c21c016` reached `READY` and served the canonical domain. With the connected user-controlled session visible as `KH`, the browser returned from `Vendre` to the buyer map through `Retour à acheter`, then clicked `Vendre` again. The second click opened the seller-entry sheet directly; it did not open Auth and did not redirect to the buyer surface. The sheet displayed `Espace vendeur`, `Accès vendeur à vérifier`, the no-mutation notice, `Retour à acheter` and `Se déconnecter`.

The browser inspection did not submit a seller operation. No facility, certification, catalogue item, transaction, payment or wallet record was created or changed by this correction.

## Validation

The exact local validation after the correction and Root additions reports 12 Vitest files and 75 passing tests, a successful TypeScript/Vite production build, 10 Vercel functions bundled and `Client boundary: clean`. The seller-entry decision tests cover both authenticated direct entry and anonymous Auth return targeting.

## Remaining boundary

This evidence proves the client entry correction and browser-visible no-loop behavior only. A separate explicitly authorized persistent-V2 fixture now contains one seller-ready demo account, one owned unconfirmed facility and one bounded transaction record; that fixture does not prove a real seller bearer session, certification, seller workspace operations, camera QR verification, concurrent replay or transaction authority. The full seller branch remains open and must be grown only through its own Seed/Species/Root contracts and authorized fixture boundary.

## Nature Way decision

The seller-entry loop correction is **verified as a bounded UI/session-entry fix**. The seller workspace remains **not started / open**, the Root System remains `review`, and the Buyer Trunk release gate is unchanged.

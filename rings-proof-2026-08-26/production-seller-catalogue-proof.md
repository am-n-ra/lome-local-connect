# Production Seller Catalogue Proof — 2026-08-27

## Result

The production Seller workspace now loads the authorized facility `Omni Demo Seller Hub` in the Catalogue tab. The facility select is populated, and the catalogue summary reports `1 produit`. The existing proof offer `Root proof demo product` is visible with `Omni Demo Seller Hub` and the archive action.

## Root causes found

Two independent production issues caused the previous `Aucune facilité disponible` state:

1. `/api/v2/seller/catalogue` was not published as a Vercel function. The project was already at the 12-function limit, so the route was mutualized into a new `catalogue.js` function and the old `demo-rebind.js` function was routed through it.
2. The production V2 database branch did not contain the additive offer columns from migration 009. Vercel runtime errors showed Neon error `42703: column p.discount_kind does not exist`. The missing columns and idempotency index were added additively on both the primary `production` branch and the `omni-v2-rebuild` branch.

## Deployment

- Git commit: `a01b349` (`fix: route seller catalogue through shared function`)
- Vercel deployment: `dpl_6KjwM2v3x2x55uHnzwiKZ2nmatMy`
- Deployment state: `READY`
- Canonical domain: `https://omni.sparkafrika.online`

## Production UI observation

After reopening the Seller workspace and selecting Catalogue:

- Facility option: `Omni Demo Seller Hub`
- Catalogue count: `1 produit`
- Existing offer: `Root proof demo product`
- Offer facility: `Omni Demo Seller Hub`
- Create-draft form: available with mandatory discount field

This closes the inherited Canopy mismatch between the authorized account/facility/slot association and the Seller UI.

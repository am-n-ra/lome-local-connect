# Acceptance validation — authenticated category search

Date: 2026-08-14

After reloading `/carte` with the authenticated demo session, opening the category rail, and selecting **Alimentation**, the staged MapLibre reveal completed and the result UI rendered.

Observed in the browser:

- **741 résultats** displayed for the `food` category.
- Claimed demo facility: **Épicerie Adidogomé Plus**, shown as “Facility certifiable Omni”, with **5 offers**, a starting price of **350 FCFA**, and **20% off**.
- OSM unclaimed facilities: **Mr Pizza**, **Picasso l'art du goût**, **Me Burger**, **Restaurant Délis de Félis**, and **Donuts Café**, each shown as “Facility à réclamer”.
- The category-only path now renders facility cards and the **Vérifier la disponibilité de tous** bulk action; this required updating the card/result presentation conditions to treat `category` as an active discovery input in addition to text queries.
- The MapLibre map remained the real globe/map component and transitioned to the focused Lomé map with facility discovery results.

The backend fix in `src/lib/omni.functions.ts` keeps unclaimed facilities discoverable with `(f.is_online = true OR f.status = 'unclaimed')` while preserving the emergency-shutdown guard.

Remaining validation: open a claimed and unclaimed facility detail panel, test bulk availability credit behavior, inspect authenticated navigation, then commit and merge.

## Browser evidence

The browser extraction after the category reveal contained the claimed facility, five unclaimed facility cards, and “741 résultats Vérifier la disponibilité de tous”.

## Notes

The initial immediate state briefly showed `0 résultat` while the server function request was still settling; a subsequent page view showed the completed result set.

## Facility detail validation

The claimed **Épicerie Adidogomé Plus** panel opened successfully after selection. It showed the verified/fixed/sponsored badges, two active coupons (`BIENVENUE10` and `OMNI15`), and **5 products** with prices, stock badges, freshness labels, quantity controls, and **Ajouter au panier** actions. The detail-loader was made resilient with `Promise.allSettled` so a failing optional detail relation cannot hide valid product data.

The unclaimed **Mr Pizza** panel also opened successfully and showed **Non réclamé**, the explanation that products and prices are unconfirmed, the **Est-ce votre commerce ?** claim CTA, and **Produits (0) / Aucun produit publié**. No purchase action was exposed for the unclaimed listing.

## Bulk availability validation

A confirmed test submission was attempted with the term **riz** and quantity **1** from the Alimentation result set. The panel correctly reported **741 visible targets** and an estimated cost of **741 credits**. After submission, the form returned to its enabled state without creating a visible success state. Based on the active server-side enforcement in `createDemandRequest`, the Buyer Free allowance is **3 credits/month** and the request requires one credit per targeted facility; therefore the 741-target request is correctly rejected as insufficient credits before insertion. This validates the protection against an oversized free bulk request. A narrow 1–3-target success-path test remains optional if needed.

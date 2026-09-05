# v13 finish pass — 2026-09-05 (session HO-OMNI-06)

## Status reconciled (branch pulled @ 5d12259, fetched = local = origin

- V-1 Coquille `done` (81869c9…)
- V-2 Admin `done` (0fb93be, AdminV13 real endpoints]
- V-3 Vendeur `done` (2e19416, SellerV13 real endpoints]
- V-4 Acheteur/transaction `done` (5d12259, BuyerFlowV13 dispo→intention→TXN→QR→paiement→avis real endpoints( — **as committed by the prior agent** (V-4 label now = the committed BuyerFlow slice, not the full maquette sheet set[
- V-5 Suppression UI actuelle **NOT yet done** — `TrunkApp.tsx` (261KB( + all legacy-only sheets still exist; main mounts V13; prod==local @ `index-C-bOH0ZD.js` (evidence 2026-09-05(].

## New active slice (this pass(: V-4.menu — maquette menu/espace/compte/wallet/plans/saved/claim/chat surfaces 1:1 in the V13 idiom wired to real api.ts, then V-5 decommission legacy[

- Evidence baseline: 297/297 tests, lint clean, build `index-C-bOH0ZD.js`, prod hash === local (guardrail T-07d ✓(
- V13 shell currently wires: search, results, facility, seller, flow (BuyerFlow(, admin, menu(static small(, account(static(, auth. Maquette sheet set (SHEETS(: SEARCH RESULTS FACILITY AVAIL BULK PENDING ARESULT COMPARE INTENT TXN QR MENU BUYERHOME WALLET PLANS ONBOARD SELLER COMPANY PRODUCTS STOCKEVENT OFFERS ADMIN — plus SAVED ACCOUNT PAYMENT NOTIFIED.

- API surface complete(57 fns( incl claim (createFacilityClaimDraft/getClaimStorageStatus/uploadFacilityEvidence/submitFacilityClaim/cancelFacilityClaim(, wallet (getWalletOverview/createWalletRecharge/activateFacilityPro(, saved (list/create/delete(, chat (get/sendTransactionMessage(, buyer-requests (getBuyerAvailabilityRequests(..
- Legacy `TrunkApp.tsx` has the real-API claim/wallet/saved/chat/requests flows but is 261KB monolith. New V13 must port those flows compactly in the 1:1 idiom(. Legacy remains until V-5; `seller-entry.test.ts` imports resolveEscape/resolveSellerEntry from it — V-5 must move those( or keep a tiny helpers module(.
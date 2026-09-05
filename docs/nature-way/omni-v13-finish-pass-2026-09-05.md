# v13 finish pass — 2026-09-05 (session HO-OMNI-06)

## État reconcilié

- V-1 Coquille done (81869c9…(
- V-2 Admin done (0fb93be..ā
- V-3 Vendeur done (2e19416..ā
- V-4 Acheteur/transaction done (5d12259..ā
- V-4.menu CE PASS done (b903c0a..ā
- V-5 Suppression UI actuelle — reste (prochain slice..ā

## Slice V-4.menu — livré 2026-09-05

Menugrid maquette 1:1 contextual par rôle (buyer/seller/admin/operator( via .menugrid/.menuitem (ui-v13(: surfaces buyer branchées API réelles:
- Espace Buyer (GET /api/v2/availability-responses(: stat demandes + liste reprenable → facilité + accès Wallet/Plans.
- Wallet (GET /api/v2/wallet, POST /api/v2/wallet/recharges FedaPay(: solde, presets recharge XOF, plans par facilité, écritures.
- Recherches enregistrées (saved-searches CRUD( + enregistrer la recherche courante.
- Claim 1:1 (facilité Non revendiquée → Commencer la revendication(: draft + storage-status guard, checklist preuves privées par kind (identity/company/facility/product/location/service(, upload progress, soumission → revue, annulation. Auth gating D-05.
- Transaction chat réel (transaction-messages( dans BuyerFlowV13 (chatlog + chatbar maquette TXN(.
- Compte profil réel (rôles, capabilités(; menu Compte + Se déconnecter (reset rôle + fermeture sheet(.

## Preuves

- 297/297 tests (47 files(, tsc --noEmit clean, npm run build → index-C7NVQt6k.js, check:boundary clean.
- Push 5d12259..b903c0a; prod hash === local (index-C7NVQt6k.js( ( guardrail T-07d ✓( — pollé live depuis omni.sparkafrika.online.
- Page prod live: 206 facilités réelles (OSM+Omni(, countmark 206, rolepill Buyer, navpill réels. Erreur carte vectorielle « Carte indisponible » dans CE sandbox uniquement (bloc connu d assets MapLibre, cf audit G-5( — pas une régression code. Idem « Localisation désactivée » = prompt géo normal.
- Legacy TrunkApp.tsx (261KB( + sheets legacy-only existent encore; seller-entry.test.ts importe resolveEscape/resolveSellerEntry de lui — V-5 devra déplacer ces helpers( ou garder un mini module helpers( avant suppression.

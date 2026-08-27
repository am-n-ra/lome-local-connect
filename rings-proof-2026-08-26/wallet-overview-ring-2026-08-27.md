# Wallet Overview Ring — 2026-08-27

## Implemented

The Wallet mini-root is documented in `docs/wallet-pro-mini-root-2026-08-27.md`. The server now exposes `GET /api/v2/wallet`, returning the authenticated account’s Wallet ID, confirmed balance, recent ledger entries, and the account’s assigned facilities with facility-scoped Pro plan and price metadata.

The endpoint uses the existing mutualized Vercel Seller Catalogue function, so the project remains within the 12-function limit. The route is authenticated and does not expose Wallet data publicly.

## Local proof

`npm run build` passed. The build produced 12 Vercel V2 functions and a successful Vite bundle.

## Deployment proof

- Commit: `8d3e42d` (`feat: expose facility scoped wallet overview`)
- Vercel deployment: `dpl_95SNBcUKeEXPFhshb4nbuzjqHVHi`
- Deployment state: `READY`
- Deployment URL: `omniview-4qx8kvfyf-kheirs-projects.vercel.app`

## Browser proof

Calling `/api/v2/wallet` without an authenticated session returned HTTP `401` with `AUTH_REQUIRED` and the expected message `Sign in to view your Omni Wallet.` This proves the production route and privacy gate. A Seller-session data proof remains the next smallest verification action; the browser session available during this pass was not the demo Seller session.

## Residual gap

The Wallet overview is currently a server/API vertical slice. The Seller workspace does not yet render the balance or expose a recharge/Pro-purchase action. The next branch must add the authenticated Wallet surface and a FedaPay configuration-gated recharge flow, while keeping transaction payment external and separate.

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

## Seller UI proof — deployment `cd617c8`

The production Seller workspace displays the new tab set `Demandes`, `Catalogue`, `Wallet`, and `QR transaction`. The browser session loaded the deployed bundle and the Wallet tab is reachable from the Seller navigation. The current session was not the demo Seller identity at the time of this observation, so the balance/facility data screen itself still requires the authenticated `demo@seller.omni` proof.

## Authenticated Seller UI proof

On the deployed Seller workspace, the Wallet tab rendered the live overview with:

- Solde Omni: `$0.00` confirmed credits.
- Facility: `Omni Demo Seller Hub`.
- Plan: `Free · 5 offres maximum`.
- Facility-scoped Pro price: `$10.00 / mois`.
- Configuration-gated message: FedaPay recharge will only activate after configuration and verified webhook confirmation.

The same screen explicitly states that transaction payments remain external, preserving the separation between Omni Wallet credits and V1 purchase payment declarations.

## Heartwood proof

The repository and domain test suite passed on 2026-08-27: 19 test files and 147 tests passed. Existing invariant coverage confirms that only confirmed Wallet entries contribute to the balance, spending cannot exceed confirmed funds, withdrawal-like transaction payment is not introduced, and slot purchase rules remain account-scoped. The new read surface is deployed separately from the external transaction payment state machine.

## FedaPay recharge ring — deployment proof

The FedaPay recharge code was deployed through Vercel deployment `dpl_4ywL8NDv3fvshxmv5UYRhDL6uYvh`, now `READY` and aliased to `omni.sparkafrika.online`. The deployment includes the additive recharge-intent migration, server-only provider adapter, authenticated pending-recharge route, and signed webhook route. A production probe was sent to `/api/v2/fedapay/webhook` without `X-FEDAPAY-SIGNATURE`; the response is being read from the browser session before accepting the webhook gate.

The unsigned webhook probe was observed in production and returned HTTP `400` with code `WEBHOOK_INVALID`; no database reconciliation was attempted. A second non-financial recharge probe used a deliberately invalid amount (`50` minor units) and a synthetic token, so it cannot create a provider transaction or charge money; its server response remains to be read and recorded.

The deliberate invalid recharge probe returned HTTP `401 AUTH_REQUIRED` because the synthetic Authorization value was not an authenticated Omni session. This proves the public route does not reach validation or FedaPay without a real session; an authenticated sandbox checkout remains unproven until the Seller browser session is available on the deployed build.

The Pro activation release `25c7824` is READY in production as deployment `dpl_ABPgqHdP71gVeZV4yDsKTP7e7n9v`. A public unauthenticated POST probe against `/api/v2/wallet/pro` used a zero UUID and synthetic idempotency reference; it cannot activate a real facility and was sent to verify the authentication boundary.

## Production negative proof — insufficient Wallet funds

On 2026-08-27, the logged-in Seller `demo@seller.omni` reached the authorized Seller workspace and Wallet tab. The facility `Omni Demo Seller Hub` showed `Free · 5 offres maximum`, confirmed balance `$0.00`, and Pro price `$10.00/month`. After explicit user confirmation, clicking `Passer en Pro` produced `POST /api/v2/wallet/pro` → HTTP `409`. The Vercel runtime log recorded `WalletPolicyError: Pro activation requires an assigned facility slot and sufficient confirmed Wallet funds.` The UI returned to the actionable button, preserved `$0.00` and `Free`, and displayed the same policy message. No debit or entitlement activation was observed. This proves the insufficient-funds rejection path; it does not yet prove a successful debit/activation.


## Preuve recharge FedaPay pending — 2026-08-27

Sur le déploiement production `6ec5d4f`, avec la session Seller autorisée `demo@seller.omni`, l’onglet Wallet a été utilisé pour sélectionner **10 000 F CFA** puis préparer une recharge. La requête a abouti à l’état **pending** : l’interface affiche `Recharge créée · 10 000 F CFA en attente de confirmation` et fournit un lien de checkout FedaPay. Le token du checkout n’est pas recopié dans ce ledger.

Le solde Omni affiché reste **$0.00**, le plan de la facilité reste **Free**, et aucune activation Pro n’est déclenchée. Cela confirme la séparation entre création d’une intention de recharge et crédit confirmé. Le paiement FedaPay et la réconciliation webhook n’ont pas été exécutés dans ce pass ; aucune confirmation financière n’est donc revendiquée.

**Classe de preuve :** observed / production / pending / manual browser proof. **Résultat :** passage réussi de la création d’intention, confirmation provider encore non prouvée. **Déploiement :** `dpl_FitFn2HZtDd3pJ2sxYz8DSe4Q8pC` (`READY`, production).

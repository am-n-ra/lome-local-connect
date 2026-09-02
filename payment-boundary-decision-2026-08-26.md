# Omni V2 — Payment boundary decision

## Recommendation

For the V1 Wallet, use a **hosted FedaPay checkout for recharge**, limited initially to XOF in the Lomé–Aflao pilot. Omni should credit the account Wallet only after a server-side provider lookup and verified provider event/webhook. The Wallet is platform credit, not Seller revenue: V1 must not route Buyer-to-Seller funds, hold Seller proceeds, enable withdrawal or create a payout obligation.

Seller Pro should be activated from the account Wallet at the **facility entitlement** level. The account may manage multiple companies and facilities, but each facility receives an independent Pro entitlement. Auto-renewal is off by default; if the user explicitly opts in, renewal consumes the exact configured amount only when the Wallet has sufficient funds. No negative balance, silent card charge or partial renewal is allowed.

## Why this boundary

FedaPay’s official collect-management documentation describes creating a transaction with an amount, ISO currency and customer, generating a hosted payment token, redirecting to a secure payment page, and retrieving the collect directly from the API rather than trusting a callback URL alone.[1] This matches a recharge boundary while keeping the current Buyer/Seller transaction flow external.

The requested GHS display currency must be treated as a display and pricing-context decision until a provider route is verified for the account and country. Paystack advertises recurring payments but its public pricing page is country-specific and the displayed local pricing is not a sufficient basis to claim Togo coverage.[2] Flutterwave documents payment plans, recurring charges, webhooks and failed-charge retries, but also states that plan subscriptions are tied to customer email and that payment-plan charges are card-only.[3] Therefore it is a fallback candidate for a later country/provider branch, not a reason to couple Omni V1 to automatic card billing.

## Implementation gates

Before enabling Wallet recharge in production, Omni still needs a provider transaction reference, webhook signature verification, replay protection, reconciliation state machine, refund/reversal policy, supported-country matrix, explicit FX policy and a manual operations runbook. Until those gates pass, the UI may explain the Wallet but must not present a live recharge action as ready.

## References

[1]: https://docs.fedapay.com/integration-api/en/collects-management-en "FedaPay — Collects management"
[2]: https://paystack.com/pricing "Paystack — Pricing"
[3]: https://developer.flutterwave.com/v3.0/docs/payment-plans-1 "Flutterwave — Payment Plans"

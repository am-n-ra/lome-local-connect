# Omni V2 — Proposition commerciale et handoff Buyer↔Seller

**Date:** 2026-08-26  
**Statut:** proposition de Seed à valider avant Root et implémentation  
**Structural path:** `product > handoff > transaction room > commercial settlement boundary`

## 1. Recommendation

The best V1 model is a **two-layer economy**:

1. **Omni Wallet** pays for Omni platform capabilities: Buyer Pro, Seller Pro for a facility, additional facility slots and explicitly named promotion/tools. It is a rechargeable, non-withdrawable platform balance.
2. **Buyer↔Seller payment remains external in V1.** Omni displays the agreed discounted amount, records the Buyer’s declared method and records Seller acknowledgement, but it does not hold, route, settle or pay out Seller funds.

This creates a real day-one revenue path without pretending to be a payment marketplace. FedaPay can later power Wallet recharge through its REST API and sandbox/live environments, with server-side webhook verification and idempotent reconciliation; its official documentation describes Bearer-authenticated API calls, transaction events and signed webhooks.[1][2] No FedaPay key, checkout or live charge is configured in the current project.

## 2. Launch-candidate Free / Pro model

The values below are a **concrete launch candidate**, not yet an approved commercial contract. The recommended launch currency for the Lomé–Aflao pilot is XOF. Existing V2 records currently default wallet/product currency to USD, so selecting XOF requires an explicit Root migration and display decision before billing code.

| Actor | Free | Pro launch candidate | What is never promised |
|---|---|---|---|
| Buyer | Public map and catalogue discovery; unlimited reading; 3 availability requests per rolling month; one active comparison at a time; transaction room, chat, itinerary and approved Seller contact after an eligible intent | **2,500 XOF / 30 days** or **25,000 XOF / 12 months** from Omni Wallet; unlimited availability requests; up to 5 active comparisons; saved searches/resume shortcuts; access to clearly labelled Buyer Pro promotions | No guaranteed stock, response time, discount or Seller acceptance; Pro never buys trust or priority fulfilment |
| Seller | One free Facility Slot; one owned facility; up to 5 published catalogue offers after the applicable trust/publication gates; response to demand; transaction handoff and QR scan; basic public offer | **5,000 XOF / facility / 30 days** or **50,000 XOF / facility / 12 months** from Omni Wallet; up to 50 published offers; catalogue bulk edit; promotion/coupon tools; availability/transaction activity summary; named advanced tools | No certification shortcut, no `confirmed` badge, no stock guarantee, no Seller payout or withdrawal |
| Account capacity | One free Facility Slot per account | Additional slots purchased from the account Wallet, with an explicit price and period to approve | A slot does not grant Pro, trust, publication or payout |

The pricing is intentionally simple: **Buyer Pro is account-scoped; Seller Pro is facility-scoped; capacity is account-scoped; trust remains evidence/sales-scoped.** A Seller can be Free and still operate the basic demand/hand-off journey. Pro expands capacity and tools; it must never become a pay-to-trust mechanism.

### Wallet recommendation

Use one account Wallet with XOF at launch. Offer fixed recharge packs such as **2,000 XOF, 5,000 XOF and 10,000 XOF**, plus a custom amount only if FedaPay and reconciliation rules make it safe. Wallet funds are confirmed only after a verified provider event. The ledger must distinguish `recharge`, `facility_pro_spend`, `buyer_pro_spend`, `slot_spend`, `promotion_spend`, `bonus_grant`, `reversal` and `refund_credit`. No balance can be withdrawn, transferred to another user or interpreted as Seller earnings.

The existing database already has one account wallet and ledger entry kinds, but it has no balance read route, checkout route, provider transaction reference, webhook event ledger or refund/reconciliation contract.[3] Therefore a visible “Charger le Wallet” button should remain decision-pending until the provider and Root contract are implemented and tested.

## 3. Discount and offer model

A discount should be an **authoritative offer value**, not a client-entered promise. The Seller may propose a basic discounted offer within the catalogue/response flow. The server validates the rule and creates an immutable snapshot at intent creation.

Before intent, the Buyer sees:

| Value | Meaning |
|---|---|
| Base price | Seller’s normal unit price |
| Discount | Type, amount/rate, scope, validity and eligibility |
| Net unit price | The price the Seller has agreed to honor externally |
| Net total | Quantity × net unit price, with any approved constraints |
| Payment boundary | “Paiement Seller externe en V1” |

The transaction snapshot should retain `gross_amount_minor`, `discount_amount_minor`, `net_amount_minor`, `currency`, `discount_source`, `coupon_code` or offer reference, validity and the response/intent timestamps. The Seller must see the same snapshot. The discount does not create a payout or a platform settlement entry.

The safest first launch is **Seller-funded discounts** that the Seller honours through cash or mobile money outside Omni. Omni-funded promotions should be deferred until the platform has a separate promotion-credit and accounting policy. A Buyer Pro benefit may expose eligible promotions, but it must not silently reduce a Seller’s external amount.

## 4. Confirmed Buyer↔Seller handoff

The transaction room becomes the canonical post-intent surface:

```text
eligible response
→ Buyer creates intent
→ immutable transaction snapshot
→ Buyer transaction room opens
→ Buyer sees scoped chat + itinerary + approved Seller contact + Buyer QR
→ Seller receives Inbox event and optional Push
→ Seller opens notification or safe authenticated transaction invitation
→ Seller enters the same transaction room with Seller actions
→ Seller opens Scanner QR
→ camera permission / live preview / detection, with manual fallback
→ server verifies Buyer QR against member, transaction, expiry and replay rules
→ Seller is routed to the verified transaction
→ Buyer declares external cash/mobile-money/pay-on-delivery method
→ Seller acknowledges or rejects according to state
→ Seller fulfils
→ Buyer confirms receipt
→ Buyer rates
```

The Buyer’s **transaction QR** and the Buyer’s **share invitation** are different artifacts. The QR is short-lived, transaction-bound and used at the physical handoff. The share invitation is a safe authenticated deep link that helps a Seller who missed the notification reach the transaction room after signing in. It must never expose a raw QR token, bearer token or uncontrolled transaction ID.

Before intent, no public card exposes contact, itinerary, chat or QR. After intent, both transaction members may enter the transaction room. The Buyer sees the approved Seller contact and route context; the Seller sees only the Buyer information necessary for the authorized handoff. Chat is private to the transaction, cannot change transaction state and must have a retention/moderation policy before schema implementation.

## 5. Why this is better for users

The Buyer gets a clear benefit: Omni reduces uncertainty, surfaces eligible discounts before the decision, gives a resumable room and lets the Buyer prove the intended transaction at the physical handoff. The Seller gets a clear benefit: demand arrives in a scoped workspace, the Seller receives a direct resumable notification, can use the camera instead of typing a transaction ID, can honour a visible offer and can complete the handoff without exposing an unrestricted public contact channel.

The separation also keeps trust honest. A public OSM pin is presence, a claim is evidence work, certification is a manual decision, `confirmed` requires qualifying sales, Pro expands tools, and none of these states means that Omni has collected or settled the Buyer’s money.

## 6. Root work implied by this proposal

Before implementation, the Root must define and test:

- account-scoped Buyer Pro and facility-scoped Seller Pro entitlements, periods, expiry, grace, revocation and manual support override;
- XOF wallet currency, recharge provider transaction reference, webhook signature verification, duplicate event handling, refund/reversal and ledger reconciliation;
- the discount/offer schema and snapshot arithmetic, including rounding and currency rules;
- Seller intent notification, safe invitation link and transaction-room authorization;
- Buyer-owned QR issuance, Seller scanner verification, camera permission, manual fallback, expiry and replay recovery;
- transaction chat participants, retention, moderation/reporting, attachments and notification policy;
- exactly which contact and route fields are exposed to each transaction member.

No existing bounded demo proof closes these Root decisions. The present repository has manual QR issuance/verification, external payment declaration/acknowledgement and transaction transitions, but no Buyer-owned QR flow, camera scan, wallet balance read, billing provider reconciliation or chat persistence.[3][4]

## 7. Decision request

Approve or modify the launch candidate before implementation:

1. Launch currency: **XOF** for the Lomé–Aflao pilot, or another currency.
2. Buyer Pro: **2,500 XOF / 30 days; 25,000 XOF / year;** benefits as above, or revised values.
3. Seller Pro: **5,000 XOF / facility / 30 days; 50,000 XOF / facility / year;** benefits as above, or revised values.
4. Wallet packs: **2,000 / 5,000 / 10,000 XOF**, non-withdrawable, Omni-only.
5. Seller-funded external discounts in V1: **approved**; Omni-funded discounts deferred.
6. Post-intent access: **Buyer and Seller transaction members** receive role-scoped chat/route/contact; Buyer displays QR and Seller scans it.
7. Provider: use FedaPay after the provider account, environment, keys and webhook endpoint policy are supplied through secure deployment configuration; never place keys in source, browser or chat.

## References

[1]: https://docs.fedapay.com/api-reference/introduction-en "FedaPay API introduction"
[2]: https://docs.fedapay.com/integration-api/en/webhooks-en "FedaPay webhooks and events"
[3]: ./db/migrations/001_v2_roots.sql "Omni V2 base schema"
[4]: ./src/server/http.ts "Omni V2 HTTP route inventory"

## 8. Owner clarification superseding the first pricing draft

The earlier fixed-count proposal in section 2 is superseded by the owner’s clarification and must not be implemented as written. **Search is free for everyone. Ordinary single-facility availability is free for everyone.** The monetized unit is Bulk Availability convenience and processing, measured in weighted availability credits rather than a fixed number of requests.

The corrected commercial shape is:

| Layer | Free | Pro / Wallet-funded extension |
|---|---|---|
| Search | Unlimited discovery and filtering | Same, with future advanced ranking/agent features only when separately defined |
| Single-facility check | Free | Free |
| Bulk Availability | Three included Bulk operations per billing period, with each operation charged against its approved cost/guardrail | Monthly included credit allowance measured in units; heavier multi-facility jobs consume more units; additional Bulk credits may be purchased from Wallet |
| Omni Wallet | One global account-level Wallet, not fixed recharge packs | User deposits money into the Wallet, then spends it on Pro, Facility Slots and additional platform credits |
| Auto-renewal | Off by default | Explicit opt-in; at expiry Omni consumes the exact subscription amount from Wallet only if the balance is sufficient |
| Currency display | Location-aware supported currency | XOF for Togo/Benin, GHS for Ghana, EUR for France, with explicit fallback and no silent conversion |

The exact estimator, included Pro allowance, overage unit price, plan duration, plan price, supported recharge currencies, conversion policy, refunds and provider reconciliation remain Root decisions. The owner has approved the **model**, not yet those numeric and compliance parameters.

The future AI agent belongs to the same budget system. It may automate manual search, Bulk Availability and comparison, then recommend the closest, cheapest or otherwise user-selected result. It must not bypass the credit estimator, invoke hidden operations or create an entitlement beyond the Buyer’s plan.


# Omni V2 — Seller mini-cycle

**Structural path:** `product > Seller Trunk > availability response`

**Method:** Nature Way — mini-Seed → mini-Species → mini-Root → mini-Trunk → mini-Heartwood → ring

**Status:** `partial — implementation deployed; canonical seller bearer proof pending`

**Parent authority:** [`v2-seed.md`](./v2-seed.md) → [`v2-species.md`](./v2-species.md) → [`v2-flow.md`](./v2-flow.md) → [`docs/maquette/omni-species-maquette.md`](./docs/maquette/omni-species-maquette.md)

**Inherited Buyer gate:** Buyer Trunk and Heartwood are recorded as `partial`, with the Buyer pending/no-response state and corrected response read proven. Seller work is now authorized only to create the bounded response needed to complete the real Buyer/Seller cross-flow; this does not close global Root.

## 1. Mini-Seed

The Seller mini-cycle gives an authenticated, server-authorized seller one honest way to see and answer a bounded Buyer availability request for an owned facility and an eligible published catalogue product. The core journey is:

```text
authorized seller context
→ owned facility context
→ bounded incoming request queue
→ request detail and response form
→ server-authoritative availability response
→ visible response status and audit confirmation
```

The seller promise is narrow: a seller can respond to demand they are authorized to operate, without changing public trust, catalogue ownership, inventory truth, wallet state, purchase intent or transaction state. A response is not a reservation, a sale, a payment, a QR issuance or a facility claim.

### Success criteria

The mini-cycle is successful when an official Auth-backed seller session is accepted only when the server binds it to a non-suspended seller-ready account; the seller sees only requests for an owned facility and matching published product; an available, partial or unavailable response is submitted through the real protected operation; the server validates quantity, price, scope and idempotency; the seller sees the persisted response state; and the Buyer’s existing response read can observe the eligible comparison-safe facts.

### Non-goals

This mini-cycle does not implement facility claiming or certification, admin review, product creation or editing, catalogue publishing, coupons, wallet or Pro, QR scanning, payment declaration, transaction-room actions, buyer contact, route, chat, payout, withdrawal or a seller dashboard. Those remain separate branches and gates. No seller response will be created in the persistent bounded demo environment without a fresh explicit confirmation for that write.

## 2. Mini-Species — inherited visual contract

### 2.1 Inheritance decision

The Seller surface inherits the approved Species rather than introducing a dashboard or a second navigation system. The deployed implementation now keeps the permanent MapLibre map mounted, uses the same near-white rounded contextual sheet, preserves the compact top role switch and J5 account owner, and adds only the bounded S14 rhythm: `Demandes` / `Catalogue`, request cards and a response form. The Catalogue tab is read-only in this mini-cycle; product lifecycle editing remains a later branch. The permanent MapLibre map remains mounted and dominant. The upper-left role switch shows `Vendre` as active, the upper-right J5/account control remains the sole account/navigation owner, map controls stay on the right, and contextual seller sheets remain separated from the bottom search/result dock. The seller workspace is a bounded sheet over the map, not a route replacement or generic admin rail.

The existing Seller entry sheet is only an authorization boundary. It is retained as the locked/unauthorized state, but it must grow into the following small set of seller-owned states before the Seller Trunk ring can close.

| Seller state | Surface composition | Seller action | Truth boundary |
|---|---|---|---|
| Seller arrival | Map remains visible; `Vendre` active; owned facility context is named only after server authorization | Open the seller workspace | Role selection never bypasses authorization or trust |
| Seller authorization | Same white contextual sheet family as Buyer Auth/Facility; clear access state and one next action | Sign in, return to Buyer or retry authorization | Authenticated does not itself prove seller authorization |
| Workspace ready | Bounded centered/mobile-bottom sheet over the map; facility identity, trust/status and a compact request count; two tabs or segmented controls only: `Demandes` and `Catalogue` | Open the request queue | Facility scope comes from the server, not a client-selected ID |
| Request queue | Scrollable request cards inside the sheet; each card shows request age/freshness, facility, catalogue product, requested quantity, budget mode/value if allowed, expiry and status | Open one request | No private buyer identity, contact, itinerary or intent data is shown |
| Response form | Request detail sheet; product and facility are read-only snapshot facts; status choice `Disponible`, `Partielle` or `Indisponible`; quantity and price inputs appear only where allowed; one submit action | Send or cancel a response | Server validates scope, product publication, allocation, status, quantity, price and idempotency |
| Response accepted | Same sheet with persisted status, observed time and concise audit confirmation; no optimistic success before acknowledgement | Return to queue or Buyer flow | Acknowledgement means response persistence only, never sale or reservation |
| Empty queue | Same sheet material; calm explanation and one refresh action | Refresh or return to map | Empty demand is not an error and does not create a placeholder request |
| Error/retry | Same sheet; error is local to the request operation, with retry and safe return | Retry, cancel or return | Failed persistence never displays accepted status |
| Expired/stale | Request and response freshness are visibly labelled; expired request cannot be answered | Return or refresh | Seller cannot revive an expired request by client state |
| Unauthorized/locked | Current Seller entry boundary remains the visual gate; no queue or response form is rendered | Sign in, return to Buyer or request manual authorization | UI visibility is not permission; server remains authoritative |

### 2.2 Spatial and interaction rules

The sheet must preserve the parent safe zones: top role/account controls, right map controls, map attribution/status, bottom search dock when present, sheet handle, scrollable body and reachable footer. On mobile the workspace is bottom anchored; on desktop it is a bounded floating surface. The map is not hidden, and the seller queue never becomes a full-screen table.

The Seller Trunk uses one primary action per state. The request card opens the response form; the response form submits one guarded operation; the accepted state offers return/refresh. Back, Escape and close return to the previous seller-safe state without erasing the selected request until the seller explicitly cancels. No seller state introduces a hamburger or second account menu.

### 2.3 Responsive and accessibility inheritance

The seller surface inherits the four Species widths: 320, 375, 768 and 1280 CSS pixels. At 320 and 375, one request card remains readable with the response footer reachable; at 768 and 1280, the sheet is bounded and centered while the map remains dominant. Buttons expose accessible names, status changes use live/alert semantics, the selected request is keyboard reachable, and reduced motion disables non-essential map rotation. The seller form never relies on color alone to distinguish `Disponible`, `Partielle` and `Indisponible`.

## 3. Mini-Root — load-bearing contract

### 3.1 Existing protected operation

The Seller Trunk uses the existing protected operation defined in [`v2-root-seller-response.md`](./v2-root-seller-response.md):

```text
POST /api/v2/availability-responses
```

The request body contains `requestId`, `facilityId`, `productId`, `status`, `quantityAvailable`, `priceMinor` and an optional `sellerMessage`. The request includes an `Idempotency-Key`; the bearer session supplies the seller Auth identity. The client does not choose the seller account.

### 3.2 Server invariants

The server must require a non-suspended account bound to the authenticated Auth identity, `seller_ready` or `complete` onboarding, an owned facility, a published product belonging to that facility, and a Buyer request whose facility scope and product match the response. The persisted product allocation remains the upper bound for an available quantity. A response does not decrement or reserve stock.

The allowed seller-selected statuses are `available`, `partial` and `unavailable`. Available and partial responses require a positive quantity and non-negative price; unavailable requires quantity zero and does not require a price. `corrected`, `stale`, `expired` and `no_response` are server/system outcomes, not direct seller inputs.

The same request, facility, product, seller and idempotency key replay returns the original response. Reusing the key for a conflicting response is rejected. The operation records a response snapshot and audit event with a correlation ID. It must not mutate public-import ownership, trust state, stock, wallet balance, transaction state or Buyer request ownership.

### 3.3 Seller queue read boundary

The Seller Trunk needs a protected, seller-owned request-list/read seam before the form can be reached from the UI. The read must return only requests whose facility/product scope belongs to the authenticated seller account and only comparison-safe request facts: request ID, facility/product identity, requested quantity, budget mode/value if contractually permitted, request status, created/expiry times and freshness. It must not return Buyer email, phone, contact, itinerary, chat, raw Auth identifiers or unneeded private metadata.

The read is a server-owned queue, not a local array and not a fixture-only list. The client may filter presentation state but cannot manufacture a demand request or mark one as answered.

### 3.4 Authorization and bounded fixture boundary

The UI must treat `Vendre` as an entry boundary until the seller session is both officially authenticated and server-authorized. A logged-in Buyer session with no seller binding remains locked. Any Seller Trunk browser proof uses the user-approved bounded demo environment, labeled demo identities/facility/product/request records and an explicit confirmation before each new write. No credentials, bearer tokens, raw Auth IDs, idempotency values or database secrets are recorded in code, logs, screenshots or evidence.

## 4. Implementation evidence

The protected Seller queue read is deployed at `GET /api/v2/seller/availability-requests`; it returns `401 AUTH_REQUIRED` without a bearer session and otherwise filters by the server-bound seller account, owned facility, published product and request scope. The Seller UI is map-mounted and uses the approved Buyer Species sheet primitives rather than a dashboard. Automated validation currently passes with 81 tests, 11 Vercel functions, the client-boundary scan and whitespace checks. Canonical browser interaction with the connected session is still pending because the browser extension timed out during the visual click pass; no Seller response write has been performed.

## 5. Mini-Trunk definition of done

The Seller Trunk may be called implemented only when the following path works through the deployed canonical surface with a real official seller session and the existing Buyer pending request:

| Gate | Required result |
|---|---|
| Entry | `Vendre` opens the current authorization boundary without an Auth loop; an authorized seller reaches the workspace |
| Scope | Workspace and queue show only the seller-owned facility and matching request/product |
| Form | Seller can choose an allowed status and submit validated quantity/price/message |
| Persistence | Protected POST returns server acknowledgement and the UI shows persisted response status |
| Buyer visibility | Existing Buyer response read changes from pending/no-response to a comparison-safe response card after refresh |
| Lock | Contact, itinerary, chat, QR, payment and intent remain unavailable in both Buyer and Seller Trunks |
| Recovery | Duplicate submit, conflicting idempotency, invalid quantity/status, unauthorized seller, expired request and network failure have honest non-success states |
| Proof | Automated tests, canonical browser proof, responsive inspection and a redacted evidence record exist |

## 6. Mini-Heartwood and ring gate

The Seller mini-Heartwood must cover duplicate and conflicting-key replay, seller/buyer actor separation, facility/product mismatch, allocation bounds, unavailable/partial validation, expired request handling, refresh after accepted response, back/Escape/close, interrupted Auth return, queue empty/error/retry, and no private-data leakage. QR, payment and transaction gates remain closed even if the response is accepted.

The Seller ring decision is `partial` until the deployed official seller bearer path, queue read, response write, Buyer comparison refresh, negative authorization checks and responsive/accessibility evidence are recorded. When that ring is accepted, the parent may enter the cross-flow verification phase. The global Root remains `review` until the outstanding Auth lifecycle, live bearer, concurrency, recovery and other Root proofs are independently resolved.

## References

[1]: ./v2-seed.md "Omni V2 Seed"
[2]: ./v2-species.md "Omni V2 Species"
[3]: ./v2-flow.md "Omni V2 Flow and State Contract"
[4]: ./docs/maquette/omni-species-maquette.md "Omni Species Maquette Contract"
[5]: ./v2-root-seller-response.md "Seller Availability Response Mini-Root"


## 7. Canonical Species alignment observation

The READY deployment for commit `e2c6dee` is serving the canonical aliases, including `https://omni.sparkafrika.online`. A fresh canonical extraction shows the expected inherited arrival anatomy: `Acheter / Vendre` role switch, J5 account owner, right-side `+` and recenter controls, active map attribution, a separate search dock and the `Proche de vous` result sheet with facility cards. The protected Seller queue route independently returns `401 AUTH_REQUIRED` without a bearer session. The connected-browser extension timed out during the attempted interactive `Vendre` click, so the Seller sheet’s visual click-through remains unproven rather than being claimed as verified. No new bounded demo write was performed.


## 8. Canonical connected-browser proof — unauthorized Seller boundary

On the canonical deployment, the connected authenticated Buyer session opened `Vendre` successfully without an Auth loop. The captured surface preserves the permanent map, top role switch, right-side map controls, rounded contextual sheet, centered handle, close control and separated `Demandes / Catalogue` segmented rhythm. The queue then settled to the honest locked state: `Accès vendeur à vérifier` and `Aucune opération vendeur ouverte`, because this session has no server-bound seller profile. The handoff note remains visible and explicitly keeps stock response, contact, itinerary and QR locked. The map reported its documented fallback mode during this check; no location or seller data was fabricated. The Seller route’s interaction with an authorized session remains the next proof owner.

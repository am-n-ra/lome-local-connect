# Omni V2 — Seller and Reviewer/Admin mini-Species

**Structural path:** product → Species → Seller branch / Reviewer branch
**Parent Species:** [`v2-species.md`](./v2-species.md)
**Status:** `design contract for implementation; visual acceptance open`

## Mini-seed

Seller and Reviewer/Admin must perform role-specific work without breaking the first buyer Species. Seller needs to see bounded incoming availability requests and answer them. Reviewer/Admin needs to inspect claims and make an auditable decision. Neither surface should become a generic dashboard, imply permission from a visual state, or detach the map from the contextual operation.

## Inherited material and spatial rules

Both surfaces inherit the full-viewport MapLibre canvas, the compact upper-left `Acheter / Vendre` context switch, the single J5 account/navigation owner, right-side map controls, safe-area behavior, warm-white sheet material, centered handle, deep forest primary action, mint positive state, peach attention state and explicit back/close ownership from `v2-species.md`.

A contextual sheet may dim the map when it owns the interaction, but it must not move the map, replace it with a rail, or introduce a left dashboard. The sheet owns one task at a time and must preserve a safe return to the prior map context. Loading, empty, error, locked, ready, success and recovery are distinct visual states.

## Seller mini-Species states

| State | Visible composition | Primary action | Safety boundary |
|---|---|---|---|
| `seller_locked` | Seller sheet header, context summary, concise locked explanation, return-to-buying action | `Se connecter` or return | A connected account is not seller authorization. |
| `seller_loading` | Same header and summary, one calm loading row, no stale request actions | Wait or retry if an error follows | Do not show an actionable request list before the server response. |
| `seller_empty` | Seller context summary, Requests/Catalogue tabs, honest empty state and refresh | `Actualiser` | Empty is not an error and does not imply no future demand. |
| `seller_queue` | Queue heading, request cards with product/facility/status/freshness, one card per request | Open one request | No reservation, contact, route or QR is unlocked. |
| `seller_detail` | Back-to-requests header, request identity, three factual request cells, response controls | Choose availability status | Response status is information, not stock reservation. |
| `seller_response` | Status segmented control, quantity/price fields only where valid, optional note, one submit action | `Envoyer la réponse` | Server validates request ownership, freshness and legal status. |
| `seller_success` | Green confirmation panel with recorded status and safe return | `Retour aux demandes` | Prevent duplicate submission and keep the request non-reserving. |
| `seller_error` | Inline error in the owned sheet with retry or safe return | `Réessayer` | Preserve entered values and do not silently retry mutations. |

The Catalogue tab is an honest preview of products visible in the current bounded queue. It is not a catalogue-management promise until that branch receives its own Root/Trunk contract.

## Reviewer/Admin mini-Species states

| State | Visible composition | Primary action | Safety boundary |
|---|---|---|---|
| `reviewer_locked` | Team-review header, clear role-not-open notice, no decision controls | Return or request role bootstrap | No business role is inferred from Neon Auth `admin`. |
| `reviewer_loading` | One role-verification loading row | Wait or retry if an error follows | Do not expose stale claim actions. |
| `reviewer_empty` | Queue heading, empty claim state and refresh | `Actualiser` | Empty is not proof that the reviewer workflow is production-ready. |
| `reviewer_queue` | One claim card per submission with facility, state, evidence count/categories and submitted time | Open one claim | Evidence metadata is bounded and private; no object key or public Blob URL. |
| `reviewer_detail` | Back-to-file header, claim identity/status/version, evidence summary and decision form | Choose one outcome | The server owns authorization, optimistic concurrency and transition validity. |
| `reviewer_success` | Decision confirmation and audit explanation | Return to queue/close | Claimant notification is an Inbox event; PWA remains opt-in and separate. |
| `reviewer_error` | Redacted inline error with preserved decision inputs and retry | `Réessayer` | Never expose provider secrets or private storage paths. |

The Reviewer/Admin surface remains unavailable to this session until an owner-selected Omni business role is granted through the separately documented manual bootstrap. The visual locked state is the only role proof currently available.

## Mini-root / mini-trunk boundary

This mini-Species changes no authorization or data contract. Seller and Reviewer actions remain backed by the existing V2 server operations. Any change to role assignment, evidence visibility, claim transitions, notifications or catalogue ownership must reopen the corresponding Root and Heartwood records before implementation.

## Mini-canopy acceptance

At 320px, 375px, 768px and 1280px, each surface must keep its handle, header, body and footer inside one bounded sheet with no horizontal overflow or overlap with the J5 control and right map controls. Focus must move into the sheet and return to its trigger. Reduced motion must remove nonessential sheet and state animations. The user must always be able to return to the map without losing the selected request or claim.

## Ring decision

The mini-Species is **not accepted yet**. Acceptance requires a canonical browser proof of the locked state and, only after separate role authorization, one read-only empty/queue proof for Seller and Reviewer. No seller response, reviewer decision, role assignment, OSM import, payment or transaction is part of this visual pass.

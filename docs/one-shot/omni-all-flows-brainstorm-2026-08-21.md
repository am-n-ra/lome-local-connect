# Omni All V1 Flows — Converged Brainstorm

## One-paragraph identity

Omni is a **map-first global geospatial supply-and-demand search engine**. It turns a real-world search into a trusted, resumable action: discover a source-backed facility on the live MapLibre globe, inspect its catalogue, select an actual product, ask whether it is available now, compare responses, create an idempotent purchase intent, use one authorized transaction room to verify a QR and coordinate external payment/fulfilment, confirm receipt and rate the outcome. Omni is differentiated by spatial discovery, facility-level trust, catalogue-backed availability, a server-authoritative transaction timeline and data feedback—not by a generic marketplace grid, generic inbox or in-app money movement.

## Core proof loop

```text
arrive on globe → search → discover facility/product → open facility → view catalogue
→ select product → verify availability → compare → create intent
→ authorized room/chat + QR → seller verifies → external payment declaration
→ seller confirms → fulfilment → buyer confirms receipt → rating → completed data
```

The loop is considered complete only when every handoff is understandable, resumable after closing the surface, safe under replay and honest about who actually performed the action.

## Resolved product decisions

| Question | Locked answer | Why it is distinctive to Omni |
|---|---|---|
| What is the first interface? | The live MapLibre globe/map, not a marketing landing page | Supply and demand are spatial objects before they are rows in a marketplace |
| What does a result represent? | A public/source-backed facility plus matched product context | A pin is discovery evidence, not proof of live stock |
| What does a facility card click do? | Select and inspect only | Search, inspection, availability and intent are deliberately separate trust steps |
| Where does product identity come from? | The facility catalogue whenever a matching product exists | Buyers do not repeat information the system already knows |
| What does availability mean? | Who can satisfy the selected request now | It is a response stage, not contact or purchase |
| What does intent mean? | The irreversible boundary into an authorized transaction context | It unlocks private transaction information and creates the QR lineage |
| What is chat? | A transaction-scoped operational thread and system timeline | Omni is not a social messaging product |
| Who validates status/trust? | Server/database plus audited admin review | A click, payment or Pro plan cannot manufacture certification |
| How does buyer-seller payment work? | External/manual in V1; Omni records declarations and confirmations | Omni is not yet the buyer-seller payment processor |
| What is the wallet? | One rechargeable Omni Wallet for platform consumption | It is not a seller payout wallet and not the external transaction rail |
| What does Pro unlock? | Explicit scope, limits, bulk/recommendation/automation where active | Pro unlocks capability, never trust status |

## Visual direction

The map is the permanent scene. The buyer and seller surfaces use the same cream/paper/orange/ink system, but seller actions are facility-first and operational. Cards and sheets use translucent glass only when it improves hierarchy over the map. The dock is quiet when idle. One Options chevron contains secondary discovery and structured controls. Product media is used where available, but missing media remains honest and does not become a generic placeholder gallery. Orange is reserved for Omni actions, selected pins and progression; black/near-black is used for boundary highlights and high-confidence emphasis; green/amber/red communicate operational status.

Motion is purposeful: horizontal globe rotation at rest, pause on interaction, explicit reveal after search, cancellable flights, sheet transitions that preserve the canvas, and reduced-motion compliance. The user’s manual camera always wins.

## Chat decision

The transaction room is mandatory after a successful purchase intent because it is the durable place where the buyer and seller can see the same transaction state, QR reference, price/offer snapshot, payment choice, fulfilment path and system events. A face-to-face cash purchase may require little free-text conversation, but it still needs the room/timeline as the auditable transaction record. Free-text messaging is optional within an authorized room and must never be available as an unscoped contact channel.

## Verification decision

A facility can be found before it is verified. A claim click only creates a verification request. The facility remains `unclaimed` while evidence is drafted/submitted and reviewed. Only an audited review can produce `certified`, `unconfirmed` or `rejected`; only the approved completed-sales rule can later produce `confirmed`. Public discovery is intentionally broader than operational trust.

## Explicit non-goals

This package does not turn Omni into a generic social network, a seller withdrawal processor, a buyer-seller in-app payment rail, a page-heavy ecommerce checkout, an unrestricted global facility dump, a decorative globe, a generic chatbot, an AI agent before the manual loop is proven, native mobile before the PWA is certified, or an offline real-time transaction system. Future scope must be reintroduced through the master and a new one-shot package.

## Anti-ambiguity rules

A card never creates a request. A catalogue selection never creates an intent. An availability response never unlocks contact. A QR token is never client-generated. A buyer declaration never proves seller receipt. A seller payment confirmation never proves buyer receipt. A receipt never occurs before fulfilment. A rating never occurs before receipt. A visible disabled control is never the only enforcement. A menu item never exists without a real callback or route. A clean surface never coexists with a legacy competing surface on the active route.

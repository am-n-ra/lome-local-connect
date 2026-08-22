# Omni V2 — Interface Architecture (Derived View)

**Document ID:** `OMNI-V2-INTERFACE-002`
**Status:** Derived compatibility view
**Method:** Nature Way
**Visual authority:** [`v2-species.md`](./v2-species.md)
**Behavior authority:** [`v2-flow.md`](./v2-flow.md)
**Technical authority:** [`v2-roots.md`](./v2-roots.md)

> This document preserves the familiar architecture link for existing work. It does not compete with the Species, Flow or Root System documents. Update those authorities first whenever a visual, behavioral or technical decision changes.

## 1. Persistent composition

Omni is a permanent map scene with contextual surfaces above it:

```text
┌──────────────────────────────────────────────────┐
│ brand / context                         alerts ☰ │
│                                                  │
│                 permanent map scene              │
│        selected marker / pins / clusters         │
│                                                  │
│      ┌────── map controls                         │
│      │                                           │
│      │  ┌──────── contextual sheet ──────────┐   │
│      │  │ result / facility / catalogue ... │   │
│      │  └───────────────────────────────────┘   │
│      │        ┌──────── search pill ─────────┐  │
│      │        │ need                       ⌄ │  │
│      │        └──────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

The map remains mounted through visitor, buyer, seller and transaction contexts. Mobile uses a bottom sheet and desktop uses a bounded floating surface or rail. A surface may not cover map controls, attribution, the search action or the primary footer.

## 2. Surface map

| Surface | Primary responsibility | Authority |
|---|---|---|
| Arrival map | Public orientation, location and exploration | Species + Flow map states |
| Search dock | Need input and one Options disclosure | Species + Flow search states |
| Result/facility surface | Public discovery context and restoration | Flow result/facility states |
| Catalogue surface | Facility-scoped product selection | Flow catalogue states |
| Availability surface | Product, scope, constraints and response | Flow availability states |
| Comparison surface | Response differences and eligible choice | Flow comparison states |
| Transaction room | Authorized timeline, chat, QR and handoff | Flow transaction states |
| Seller workspace | Owned facility operations above the map | Species + Flow seller authority |
| Admin surface | Evidence review and operational controls | Root System authority |

Every visible action maps to a typed state and server operation. A component may not create a competing version of a surface to bypass this map.

## 3. Shared UI rules

Use one sheet primitive with a scrollable body and reachable footer. Every asynchronous surface has applicable loading, ready, empty, error, retry, cancel, locked, success and unavailable states. Back, close, Escape, touch dismissal, keyboard focus and restoration behavior are defined by the Flow contract.

Cards use a stable hierarchy: matched product/service, facility identity, source/trust state, distance/freshness, price/offer and one next action. Missing media uses a neutral placeholder. Public pins never imply inventory or certification.

The Species blueprint governs color, typography, spacing, density, motion, glass/transparency, responsive composition and accessibility. The Root System governs data and authorization. The Flow governs transition semantics. This view must not duplicate those decisions.

## 4. Client/server boundary

Browser components call typed client functions only. Server operations own authentication, authorization, validation, state transitions, price/stock/coupon snapshots, discovery source handling, wallet ledger mutations, QR validation and audit events. Database clients, payment credentials and private evidence references never enter browser modules.

## 5. Responsive contract

Certify 320, 375, 768 and 1280 CSS pixels. At every width, the map remains usable, the search dock and sheet have independent safe zones, there is no horizontal page overflow, sheet footers are reachable and active inputs do not trigger unsuitable mobile zoom. Keyboard focus, touch targets, reduced motion, accessible names, status announcements and visible attribution are part of the core contract.

## 6. Architecture gate

The interface architecture is ready for implementation only when:

1. the Species blueprint is approved;
2. every visible action has a Flow state and Root System operation;
3. every protected field has a named unlock transition;
4. the map remains dominant on buyer and seller surfaces;
5. account capacity, facility state, trust, Pro, bonus, wallet and transaction state are visually distinct;
6. the responsive and accessibility proof matrix is defined;
7. the first Trunk slice can be implemented without guessing.

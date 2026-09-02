# Prerequisite architecture reference

Use this reference before building a visible surface whose truth depends on upstream actors, records, permissions, operations, or state transitions.

## The parent-before-child test

For each proposed capability, write one directed edge:

`parent capability → child capability → proof that the edge is real`

The parent is not merely an earlier screen. It is the smallest capability that makes the child truthful in production. Ask whether the parent is present, authorized, populated, observable, recoverable, and proven. If any answer is no, the child remains `blocked` or `planned`.

## Common multi-actor dependency chain

Use this as a hypothesis, then replace it with the project’s actual graph:

`operator authority → actor onboarding → canonical entity → catalogue/availability → publication/visibility → discovery → transaction/fulfillment → support/reconciliation → measurement/scale`

A public buyer screen is often a leaf of this graph, not its root. It may be the first screen users see while still depending on upstream operations and supply. Build the smallest chain that makes one buyer outcome truthful, rather than completing an isolated buyer shell.

## Dependency edge fields

For every edge, record the upstream parent, downstream child, actor/owner, source of truth, command or state transition, authorization boundary, data freshness, failure/retry/recovery behavior, observability, acceptance proof, and re-plan trigger. Record whether the edge is real, bounded/manual, mocked, or missing.

## Existing-project rescue

When a visible interface already exists, do not discard it automatically and do not expand it automatically. Mark it as an orphaned leaf, map the missing parent edges, identify which current UI states are honest, and rebase the next slice on the highest-leverage missing parent. Preserve reusable visual work while removing fake claims, disconnected actions, and unowned data assumptions.

## Marketplace/map scenario

For an operator-managed marketplace map, validate at least:

1. An authorized operator can create or approve a seller.
2. An approved seller can create or update a canonical product/listing.
3. Availability, location, price/terms and visibility rules are stored in authoritative records.
4. The publication path makes the record discoverable under the intended permissions and freshness rules.
5. A buyer can discover the record and see honest loading, empty, stale, unavailable and error states.
6. A transaction or contact action has an explicit state machine, ownership, retry/recovery and operator visibility.

Do not use fabricated sellers, products, ratings, reviews, or testimonials as proof. Use clearly bounded fixtures only when they cannot be mistaken for production claims, and record the transition to real data.

## Slice selection

Rank candidate slices by leverage: how many downstream truths they unlock, how risky their contracts are, how much they reduce uncertainty, and whether they can be proven end-to-end. Prefer the smallest slice that connects the necessary parent chain. Avoid starting with the most attractive surface when its prerequisites are unknown.

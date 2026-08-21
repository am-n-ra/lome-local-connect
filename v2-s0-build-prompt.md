# Omni V2 — S0 Build Prompt

**Slice:** S0 — V2 foundation and contract seams

**Source of truth:** [`v2-master.md`](./v2-master.md)

**Flow reference:** [`v2-flow.md`](./v2-flow.md)

**Architecture seam:** [`v2-product-interface-architecture.md`](./v2-product-interface-architecture.md)

**Data rules:** [`v2-data-schema.md`](./v2-data-schema.md)

## Goal

Turn the clean-slate TanStack Start scaffold into a stable, minimal V2 foundation that can receive vertical slices without restoring V1 providers, routes, components, migration history or business logic.

## In scope

- Keep a single V2 root route and a runnable landing shell.
- Add a small shared contract layer for slice status, typed adapter outcomes and safe errors.
- Add a map-first layout seam containing persistent scene, chrome, dock and sheet slots without implementing discovery behavior.
- Add a deterministic server health/config boundary that does not expose secrets.
- Add the V2 migration ledger foundation only; do not create V1 application tables or copy V1 data.
- Add focused unit tests for the contract layer and build/client-boundary validation.

## Out of scope

MapLibre behavior, location permission, OSM imports, auth flows, catalogue, availability, seller/admin flows, transaction, QR, FedaPay, wallet, analytics, production API endpoints and visual polish beyond a neutral foundation shell.

## Trust boundary

Browser code must not import secrets, database drivers, server-only modules or platform-only APIs. The typed adapter contracts live in shared-safe code. Server health/config and future database functions live in server-only modules. Any configuration returned to the browser must be explicitly allow-listed and non-secret.

## Required implementation shape

```text
src/
  contracts/v2.ts              # shared slice/status/error/adapter contracts
  components/v2/V2Shell.tsx    # map-first slots: scene, chrome, dock, sheet
  lib/server/v2-health.server.ts  # server-only safe health boundary
  routes/__root.tsx            # neutral root layout
  routes/index.tsx             # V2 shell landing route
  styles.css                   # V2 foundation tokens/layout only
  contracts/v2.unit.test.ts    # pure contract tests
```

A database migration may be added only if the existing project’s migration mechanism is identified first. The migration must create only a V2 schema ledger or equivalent infrastructure marker and must not recreate V1 application tables.

## Required behavior

1. The root route renders a stable V2 shell with a persistent scene placeholder, minimal chrome, one dock slot and one sheet slot.
2. The shell exposes named regions that later slices can populate without replacing the root layout.
3. Empty/loading/error shell states are explicit and accessible.
4. A safe server boundary returns only `{ ok, version, environment }` or an equivalent allow-listed object; no secret or database URL may cross the boundary.
5. The shared contract layer represents at least `idle`, `loading`, `ready`, `empty`, `error` and `cancelled` without `any`.
6. The contract layer defines a typed retryable error shape and a typed adapter result shape.
7. The app remains runnable and the client-boundary check passes.

## Acceptance matrix

| Check | Required result |
|---|---|
| V1 isolation | No import/path references to V1 providers, routes, components or migration files are introduced. |
| Root rendering | `/` renders the V2 shell without a loading loop or runtime exception. |
| Contract types | Unit tests cover all status branches and retryable/non-retryable errors. |
| Server boundary | Safe health/config output contains no secret-like field or connection string. |
| Accessibility | Shell regions have semantic labels; focus is not trapped by empty slots. |
| Build | Production build succeeds. |
| Client boundary | Client-boundary check succeeds. |
| Test | Vitest passes the new S0 tests. |

## Stopping conditions

Stop and patch the master before continuing if implementation requires an unresolved auth architecture, a new money/data authority decision, restoration of V1 code, or a database migration beyond the stated foundation marker. Do not add placeholder menu actions or disabled product promises.

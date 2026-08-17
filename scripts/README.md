# Omni scripts

This directory contains operational checks and one-off migration or refactoring utilities. **No script in this directory should be run against production without an explicit database backup, a reviewed diff, and a named operator.** Scripts that require `DATABASE_URL` or `NEON_DATABASE_URL` are never invoked by the application build.

## Safety matrix

| Script | Purpose | Default effect | Production policy |
|---|---|---|---|
| `check-client-boundary.mjs` | Scan generated JavaScript for Node-only modules in client artefacts | Read-only | Safe in CI and build |
| `audit-acceptance-db.mjs` | Inspect acceptance criteria and live database state | Read-only | Run with a least-privilege read-only credential |
| `audit-demand-schema.mjs` | Inspect demand request columns and constraints | Read-only | Run before schema changes |
| `audit-demo-flows.mjs` | Inspect demo transaction readiness | Read-only | Use only against a designated test database |
| `check-qr-state.mjs` | Inspect QR transaction states | Read-only | Use only against a designated test database |
| `verify-ledger-integration.mjs` | Check ledger and bucket invariants | Read-only | Run after migrations and before release |
| `verify-platform-migration.mjs` | Check migration registration and platform invariants | Read-only | Run after migrations |
| `apply-migration.mjs` | Apply a versioned SQL migration | **Mutates database** | Manual approval only; never part of build or deploy |
| `apply-demand-credit-migration.mjs` | Apply the demand credit migration | **Mutates database** | Manual approval only; never part of build or deploy |
| `create-demo-flow-fixture.mjs` | Insert a QA facility, product and subscription fixture | **Mutates database** | Test database only; never production |
| `extract-carte-page.mjs` | Historical source extraction utility | **Mutates files** | Historical-only; do not rerun on current routes |
| `refactor-orders-thread.mjs` | Historical source refactoring utility | **Mutates files** | Historical-only; review generated diff before use |

## Database safety contract

Migration and fixture scripts require an explicit connection string and fail when it is absent. They do not read `.env` implicitly. Operators must export the target connection string in the shell, verify the target database identity, and record the migration or fixture output. A production deploy must consume versioned migrations through the approved migration process rather than executing arbitrary scripts.

Read-only audit scripts should use a credential that cannot perform `INSERT`, `UPDATE`, `DELETE`, or DDL. Their output may contain identifiers and operational data, so logs must not be committed or copied into public artefacts.

## Release checks

The application build runs `check:client-boundary` and does not run database scripts. The minimum release sequence is:

```sh
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

Database verification is a separate, reviewed operation. A passing application build is not evidence that a migration or payment webhook has been applied to the live database.

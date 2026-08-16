# Omni Vercel CSRF runtime fix report — 2026-08-16

## Root cause

Vercel runtime logs identified the universal SSR failure as `TypeError: createCsrfMiddleware is not a function` during module evaluation of the generated server bundle. The failure occurred before route rendering and affected `/`, `/carte`, `/auth`, `/vendeur`, `/api-docs`, `/a-propos`, `/api/auth/token`, and a server-function endpoint.

The project tracked `package.json` with `@lovable.dev/vite-tanstack-config` at `2.13.1`, while the tracked npm lockfile still pinned `2.12.0` and its older plugin subdependencies. Vercel installed dependencies using npm and reported that one package changed during deployment. The local resolved TanStack graph with the refreshed package metadata exposes `createCsrfMiddleware` as a function and builds successfully.

The application’s custom `src/server.ts` does not manually import or disable CSRF; it delegates to `@tanstack/react-start/server-entry`. The generated bundle from the clean npm installation contains a real `createCsrfMiddleware` implementation and wires it into `requestMiddleware`, confirming that the supported middleware remains enabled.

## Repair

The smallest repair was to refresh and commit the npm lockfile so it matches the tracked package manifest. The lockfile now pins the current `@lovable.dev/vite-tanstack-config` package and removes the stale plugin subdependencies associated with `2.12.0`. No CSRF middleware was removed, bypassed, or disabled. No application route behavior was changed.

Repair commit:

`5652a5f fix: pin vercel tanstack runtime dependencies`

## Local validation

A fresh isolated `npm ci` install using the repaired lockfile resolved:

| Package | Resolved version |
|---|---:|
| `@tanstack/react-start` | `1.168.32` |
| `@tanstack/start-client-core` | `1.170.14` |
| `@tanstack/start-server-core` | `1.169.17` |
| `@tanstack/start-plugin-core` | `1.171.24` |

The isolated install reported `typeof createCsrfMiddleware === "function"` and completed `npm run build` successfully. The repository build, targeted ESLint, and `git diff --check` also passed. Targeted ESLint retained four non-blocking pre-existing warnings.

The local unauthenticated route matrix returned:

| Route | Status |
|---|---:|
| `/` | 200 |
| `/carte` | 200 |
| `/auth` | 200 |
| `/vendeur` | 200 |
| `/api-docs` | 200 |
| `/a-propos` | 307 |
| `/api/auth/token` | 401 |

The protected auth endpoint now returns a controlled unauthenticated response locally instead of failing during SSR module initialization.

## Mobile navigation validation

After the repair, the local buyer hamburger showed `Acheteur` active and `Vendeur` available. Selecting `Vendeur` opened the unauthenticated seller entry route. The seller hamburger showed `Vendeur` active and `Acheteur` available. Selecting `Acheteur` returned to the buyer MapLibre globe. No stale overlay, duplicate global navbar, or SSR error appeared during either transition.

Evidence files:

- `omni-csrf-mobile-evidence-2026-08-16.md`
- `omni-csrf-seller-menu-evidence-2026-08-16.md`

## Deployment status

The fix is ready to push to `main`. Post-deploy verification must confirm that the production aliases no longer show `createCsrfMiddleware is not a function`. Vercel runtime log access is not available in the sandbox, so the final production check requires the deployment to complete and the public routes to be requested after the push.

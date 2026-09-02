# Omni — lome-local-connect

Map-based local search engine (mobile-first PWA). Buyers find products/services near them on a MapLibre map, filter by availability/price/quantity/budget, and transact via QR-linked coupons through a transactional chat. Sellers get a living in-store business card.

## Getting started

**Start here: [OMNI-V3-MASTER-PLAN.md](./OMNI-V3-MASTER-PLAN.md)** — the single, self-contained source of truth for resuming Omni v1 delivery against the Omni v3 design system. It embeds the full product spec, data model, complete v3 design system, verified current state, the ordered PR roadmap (PRs 2–6 remaining), and the work rules. Read it before touching UI code.

## Key pointers

- **Live entry:** `src/main.tsx` renders `src/trunk/TrunkApp` (the functional trunk — the live app).
- **Do NOT use `src/components/v2` (MaquetteApp)** — owner-flagged error/mock UI, not the real app.
- **Production branch:** `omni-v2-rebuild` (auto-deploys to prod). Work on feature branches; never touch `ui/clean-base-rebuild`.
- **npm gotcha:** always `npm install --cache /root/.npm` (`/home` is 300MB and dies ENOSPC).

## Structure

- `src/trunk/` — the functional app (TrunkApp, TrunkMap, api, types, tests)
- `src/server/`, `api/v2/`, `db/migrations/` — backend + Neon data layer
- `docs/` — dated contracts and discovery documents (see master plan §5 for the gap inventory)

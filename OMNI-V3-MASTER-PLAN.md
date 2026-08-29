# Omni — v3 Master Plan

> **Status:** Live working plan (revision 1). This document is the single, self-contained source of truth for resuming Omni v1 delivery against the **Omni v3 design system**. It embeds everything a future dev/tool needs — product spec, data model, the full design system, verified current state, the ordered PR roadmap, and the work rules. Nothing here depends on files outside this repo.

Last updated: 2026-08-29 · Base branch: `omni-v2-rebuild` · Docs-only entry point.

---

## Table of contents
1. [Objective](#1-objective)
2. [Product spec (v1 scope)](#2-product-spec-v1-scope)
3. [Data model](#3-data-model)
4. [The full v3 design system](#4-the-full-v3-design-system)
5. [Verified current state (discoveries)](#5-verified-current-state-discoveries)
6. [Execution roadmap (the PR plan)](#6-execution-roadmap-the-pr-plan)
7. [Rules / workflow for any future dev](#7-rules--workflow-for-any-future-dev)

---

## 1. Objective

Deliver **100% of Omni v1** as specified, matching the **Omni v3 design system** across every surface.

- Run from a **solid functional trunk** (`src/trunk`), not from any throwaway/mock UI.
- **Mobile-first**, PWA today, Android/iOS native later.
- Map-based local search engine (MapLibre globe → map), every facility a pin, filterable by real-time availability, price, quantity and budget, transacting via QR-linked coupons through a transactional chat — closed end-to-end with reviews.
- Sellers get a living business card on Omni (their own in-store QR) instead of a website.
- **French UI throughout** (vouvoiement, action-verb infinitives on buttons). "index" replaces "moteur de recherche" in UI positioning copy.
- Design language: **Omni v3** (authoritative spec embedded in [Section 4](#4-the-full-v3-design-system)). Follow it exactly — no invented colors, fonts, or components.

---

## 2. Product spec (v1 scope)

The complete described v1 behavior. Every flow below must work against the trunk, styled per the v3 design system.

### 2.1 Buyer flows
- **Map search:** globe → zoom → facility pins → facility card. No landing page; map-first. Auth gates actions + search handoff.
- **Authenticated availability checks** under price / quantity / budget constraints (`budget_max`, `quantité_min`, `rayon_km`).
- **Transactional chat** after an availability result.
- **QR / coupon purchase** (generated and in-store scan).
- **Transaction closure stages:** payment sent → received → product sent → received, plus **5-star reviews**.
- **Buyer Pro** ($5/mo) — bulk availability checking across many facilities, via **availability credits** (see plans).

### 2.2 Seller flows
- **Onboarding:** unclaimed OSM facility → **claim** → **unconfirmed** → **confirmed** via **3 verified sales**. Factory → certifications below.
- **Free tier:** 1 facility, 1 company, 5 products. Beyond limits require paid slots/plans.
- **Seller Pro** ($10/mo) — auto-response to availability requests.
- Facility status exactly `{unclaimed, unconfirmed, confirmed}`.

### 2.3 Wallet / plans / payments
- **Omni Wallet** (internal; FedPay/FedaPay reload). No in-app payment for goods in v1 — physical goods settle off-platform via seller-configured methods (cash, Mobile Money), shown as text/logo, never a card-entry form.
- **$20 onboarding credit**, **locked until confirmed** (shown as a neutral badge, not orange).
- Buyer Pro $5/mo; seller Pro $10/mo; add-on credit packs (facility slots, availability-check credits).

### 2.4 Admin / operator
- **Admin/operator area** only when `Account.role_admin = true`; header states "Visible uniquement aux comptes admin". Simple account/facility table with status. No complex dashboards.

---

## 3. Data model

```
Account (1)
 └── Company (1..n)
       └── Facility (1..n)
             └── Product (1..n)
```

- **Account** has current role: `buyer` | `seller` (toggle between roles — never shown both simultaneously except in the switch).
- **Company** (1..n per account).
- **Facility** (1..n per company). `status` ∈ exactly `{ unclaimed, unconfirmed, confirmed }` — never a 4th or renamed status.
- **Product** (1..n per facility). A product **always** has:
  - `name`
  - `stock_loué_omni` (number)
  - `prix_original`
  - `prix_réduit`
  - `%réduction` — **the discount is NEVER optional** (mandatory visible from creation, not hidden in an accordion).
- **Search constraints** (all optional): `budget_max`, `quantité_min`, `rayon_km`.

> **Gap vs current trunk (must be fixed in PR 3 / PR 6):** the current `src/trunk/types.ts` does NOT yet match this model — see [Section 5.2](#52-gap-inventory).

---

## 4. The full v3 design system

The authoritative UI design language (embedding the owner-provided spec in full — prescriptive, not inspirational). **Any UI work on the trunk must follow this exactly.**

### 4.1 Hard global rules (ALL 25 screens)

1. **Only TWO persistent nav elements:** a single menu icon top-right (48px, circle, Cream bg, Evergreen line icon) + a search dock at the bottom (pill, ~92% width, centered, floating 24px from bottom). **No tab bar, no 3–5 icon bottom nav, no side drawer, no breadcrumb, no generic back button** other than a contextual close icon.
2. **MapLibre map ALWAYS 100% width and ≥55% of visible height**, including behind semi-transparent contextual panels. No full opaque page without the map visible in the background, **EXCEPT** fullscreen-authorized screens (context panels listed: 9, 12, 13, 15, 21, 23, 24, 25 / onboarding).
3. **Any contextual panel coming from a pin must visually originate from THAT pin:** either a bottom sheet rising with the pin still visible/highlighted above, or a floating card anchored just above the pin with a notch/triangle pointing to it. The selected pin must stay visible alongside its panel.
4. **`Acheter / Vendre` switch ALWAYS top-left**; never merged with the top-right menu.
5. **Orange accent `#F08F5A` reserved EXCLUSIVELY for:** product discount badge, numeric notification badge, pin core. Never nav text, never primary button, never "confirmed" status, never decorative border.
6. Facility `confirmed` = light green bg + Evergreen text badge. `unconfirmed` = neutral gray/outline + Neutral 60% text. `unclaimed` = dotted outline badge, Neutral 60% text, "Revendiquer" action always visible. **Never orange/red** for these.
7. **Pin owned by the connected account (seller mode) = solid Evergreen outer ring.** Third-party pin (buyer mode) = white/Cream ring. Core stays orange either way. Never invert.
8. **If the account has >1 visible Facility in seller mode**, a horizontal chip selector (one chip = one facility, label = facility name) appears just above the search dock, horizontally scrollable. Never a dropdown or separate page.
9. **Primary button:** exactly bg `#234D40`, text `#F9F7F2`, pill radius in dock/chip, 12px radius in card. **Secondary:** bg `#F9F7F2`, text `#234D40`, 1px `#234D40` border. No 3rd button style.
10. **Never show in-app payment** (card forms, Stripe). Only seller-configured methods — cash, Mobile Money — shown as text/logo, never a card-entry form.
11. **All visible text in French, vouvoiement, action verbs as infinitives on buttons** ("Vérifier la disponibilité"). "index" replaces "moteur de recherche" in UI positioning copy.

### 4.2 Colors — exact values

- Evergreen `#234D40`
- Dark Evergreen (selected pins, strong text) `#08362A`
- Bone Cream (cards/menus bg) `#F9F7F2`
- Orange accent (restricted, rule 5) `#F08F5A`
- Neutral text primary `#1A1C1B`; secondary = `#1A1C1B` @60%
- App bg `#F9F9F7`
- Container surfaces: `#FFFFFF`, `#F4F4F1`, `#EEEEEC`, `#E8E8E6`, `#E2E3E0`
- Outline standard `#717975`; discrete outline `#C0C8C3`
- MapLibre style: muted gray / mono-dark only (never satellite, never colorful default)

### 4.3 Typography

- Plus Jakarta Sans 700 32/40 -0.02em (desktop section titles)
- Plus Jakarta Sans 700 24/30 -0.01em (mobile section titles, default)
- Plus Jakarta Sans 600 20/28 (subtitles, facility names)
- Plus Jakarta Sans 600 15/20 (button text)
- Hanken Grotesk 400 16/24 (body)
- Hanken Grotesk 400 14/20 (metadata: distance, category, price)
- Hanken Grotesk 700 12/16 +0.05em UPPERCASE (badge labels "DISPONIBLE", "-20%")

### 4.4 Radius

8px chips/internal inputs · 12px card images · 24px wide cards & bottom sheets · full pill for dock/primary/secondary/filter chips.

### 4.5 Spacing (4px grid)

- Screen safe margin **24px**
- Standard card/panel padding **20px**
- Same-row gap **12px**
- Vertical section gap **32px**

### 4.6 Elevation

- **L1** (dock, chips): 1px `#EAE8E0` + 8% 12px blur 0 offset
- **L2** (cards, sheets): backdrop-blur 8px if semi-transparent + 12% 24px blur 4px Y-offset

### 4.7 Component library (unique definitions, reused everywhere)

Use **ONLY** these named components per screen. If a screen seems to need an unlisted component, reuse the closest one.

- **MenuIcon** — 48px circle, bg `#F9F7F2`, hamburger/avatar initials on `#234D40`, fixed top-right, 24px safe margin.
- **RoleSwitch** — 2-segment pill "Acheter"/"Vendre", active `#234D40` Cream text, inactive transparent Neutral 60%, fixed top-left 24px.
- **SearchDock** — full-width pill (92%), bg `#F9F7F2`, 56px, left search icon (1.5pt), center text field, right filter icon, fixed bottom 24px. Becomes the ResultsSheet top handle when the sheet is open.
- **FacilityPin** — 14px circle, 3px outer ring (Evergreen owned / Cream third-party), core `#F08F5A`. Selected: scale 1.3, 12% 20px shadow.
- **ContextPanel** — bottom sheet OR floating anchored card (rule 3), 24px radius top (sheet) or full (floating), 20px padding, always a handle (4×36px `#C0C8C3`, centered 12px under top) if bottom sheet.
- **FacilityCard** (results grid) — 24px radius, 12px-radius image top, StatusBadge overlay top-right, name Plus Jakarta 600/20, category+distance Hanken 14 Neutral 60%, discounted price with orange PriceBadge if discount.
- **StatusBadge** — pill 12px h-padding, light-green tinted + `#234D40` text for "DISPONIBLE"; per rule 6 for the 3 facility statuses.
- **PriceBadge** — pill bg `#F08F5A` white text, format "-XX%" only, never absolute amount.
- **FilterChip** — pill; inactive Cream + 1px Evergreen border, active Evergreen + Cream text.
- **FacilitySelectorChips** — rule 8, mandatory when >1 owned facility visible.

### 4.8 All 25 screens by lot (A–E)

Screens listed with their exception flags from rule 2 (fullscreen authorized where noted).

#### A — Buyer search
1. **Map idle** — MenuIcon + RoleSwitch buyer + empty SearchDock "Rechercher un commerce, un produit…", dispersed pins, city zoom.
2. **Map + selected pin (no search)** — FacilityPin selected, floating ContextPanel anchored to pin (name, category, distance, primary "Vérifier la disponibilité").
3. **Search results (ResultsSheet)** — SearchDock filled, sheet at 62% height, handle, "X facilités trouvées" + query, **2-col FacilityCard grid**, map above at 38% with matching pins highlighted.
4. **Filters panel** — overlay above SearchDock, 3 FilterChip/sliders (budget, quantité, rayon), full-width primary "Appliquer".
5. **Full facility card** (ContextPanel extended fullscreen — rule 2 exception, map reduced to 25% top) — 200px cover, facility StatusBadge, name Plus Jakarta 700/24, Product list (name, stock_loué_omni subtext, struck original + discounted + PriceBadge), primary "Vérifier la disponibilité" + secondary "Itinéraire" side by side above product list.

#### B — Availability & transaction
6. **"Checking" state** — same panel as 5, action area → loader + "Vérification auprès du vendeur…".
7. **Availability result** — "DISPONIBLE" badge + timestamp ("Stock confirmé il y a X min") if recent; else neutral "À confirmer" + "Redemander".
8. **Transactional chat** (**fullscreen exception**) — minimal header facility name + back-like MenuIcon, message bubbles, system banner "Intention d'achat envoyée" Hanken 14 centered.
9. **Generated QR** (**fullscreen overlay**) — QR centered on Cream, product name + amount below, primary "Partager" + secondary "Copier le lien".
10. **In-app route** — the map itself shows Evergreen route user→pin, ContextPanel reduced to low bar distance/time + "Ouvrir dans Omni" visually disabled (already active).

#### C — Payment, review, direct scan, onboarding
11. **Payment options** — ContextPanel lists configured methods (cash, Mobile Money) selectable rows, Evergreen radio, primary "Confirmer le choix".
12. **Confirmation sequence** (**fullscreen**) — vertical 4-step stepper (Paiement envoyé / reçu / Produit envoyé / reçu), active solid Evergreen, pending gray outline.
13. **Post-transaction review** (**fullscreen**) — 5 Evergreen stars, optional comment field, primary "Envoyer l'avis".
14. **Direct in-store scan** — variant of 5 WITHOUT "Vérifier la disponibilité" (physically present), primary "Ajouter au panier".
15. **Onboarding** (post-auth only, **3 fullscreen carousel**) — Evergreen line illustration, Plus Jakarta 700/24 title, Hanken 16 text, dot progress indicator, "Passer" always visible top-right.

#### D — Seller space
16. **Company/facility creation** (**fullscreen**, 2 explicit header steps "1. Compagnie"/"2. Facilité") — minimal form, small interactive map at bottom to place pin.
17. **Claim facility** — ContextPanel on unclaimed pin, OSM provenance text, primary "Revendiquer cette facilité".
18. **Certification status** — ContextPanel on my unconfirmed pin, "X/3 ventes tracées" progress bar, short explanation.
19. **Seller facility-pin context** (RoleSwitch Vendre, FacilitySelectorChips if >1, ContextPanel on active pin) — product stock_loué_omni, incoming availability requests (pseudonymized buyer name, requested product, Accepter/Décliner), "Réponse automatique" toggle only if pro active.
20. **Product management** — extended ContextPanel, Product list, "Ajouter un produit" visually disabled beyond 5 if free, **discount field mandatory visible from creation (not in accordion)**.
21. **Plans & credits** (**fullscreen**) — Free vs Pro cards, explicit "10$/mois vendeur", separate "Facility slots" counter, welcome credit "20$ verrouillés jusqu'à confirmation" as **neutral** badge (not orange).
22. **Seller QR scanner** (**fullscreen**) — centered camera viewfinder, optional flash button, no manual code entry by default.

#### E — Transverse (via MenuIcon only)
23. **Omni Wallet** (**fullscreen**) — balance Plus Jakarta 700/32 top, primary "Recharger", history rows Hanken 14 with right-aligned amounts.
24. **Buyer pro plans** (**fullscreen**) — "crédits de disponibilité en masse" highlight, remaining credits counter, "Acheter des crédits".
25. **Admin/operator panel** (**fullscreen**, only if `Account.role_admin = true`; state this condition in header, "Visible uniquement aux comptes admin") — simple account/facility table with status, no complex dashboards.

### 4.9 Final check before delivering any lot (per screen)

- Map ≥55% height unless listed as a fullscreen exception.
- No nav besides MenuIcon + SearchDock.
- Colors exactly per section values, none invented.
- Orange only on discount badge / notification / pin core.
- French vocabulary per rule 11.
- Account > Company > Facility > Product hierarchy consistent in generated text.

---

## 5. Verified current state (discoveries)

As of **2026-08-29**.

### 5.1 Verified facts
- **`omni-v2-rebuild` is the production branch**, connected to prod at `omni.sparkafrika.online`, auto-deploys to Vercel on push.
- **It builds cleanly; 155 tests pass; client/server boundary is clean.**
- **The functionally-complete trunk was ORPHANED**: `src/main.tsx` had been rendering the owner-flagged "newly added UI" error branch (`MaquetteApp` from `src/components/v2`, which is a mock — never the real app). The trunk (`src/trunk/TrunkApp` + `TrunkMap` + server API + Neon DB) was fully built but not live.
- **PR #55 ("Wire trunk entry") FIXED the orphan** — it merged 2026-08-29, and `src/main.tsx` now renders `TrunkApp`. **The trunk is now the live app.**
- **Backend + DB are near feature-complete for v1:** server (authority, ledger, trunk-repository, fedapay-adapter, roots-operations), api/v2, `db/migrations`, domain invariants, and 155 tests.
- **The trunk UI visually uses OLD CSS** (`src/styles.css`, Inter font, `--forest`/`--coral` palette) that does **NOT** match the v3 design system. Re-skinning to v3 is the main remaining UI work.
- **The product model in code is NOT yet v3** (see gap A below).

### 5.2 Gap inventory (area A–M)

> Statuses: ✅ done / 🟡 partial / ❌ missing. "Proof" = where the evidence lives.

| Area | Area | Status | Proof / notes |
| ---- | ---- | ------ | ------------- |
| A | Trunk is the live entry | ✅ | `src/main.tsx` imports `TrunkApp` (PR #55, merge commit `c9551be`). |
| B | Build + tests green on `omni-v2-rebuild` | ✅ | 155 tests pass; boundary clean. |
| C | v3 design system on buyer search (screens 1–5) | ❌ | Trunk renders with old `styles.css` (Inter, `#234D40` named differently). No v3 tokens/components yet. → PR 2. |
| D | Product model to v3 (`stock_loué_omni`, `prix_original`, `prix_réduit`, `%réduction`, discount mandatory) | ❌ | `types.ts` still models products as `priceMinor` / `currency` / `discountKind('percentage'|'fixed')` / `discountValueMinor`. No `stock_loué_omni`, no `%réduction`. → PR 3. |
| E | Search constraints `budget_max`, `quantité_min`, `rayon_km` | ❌ | `SearchOptions = { category }` only. No rayon/budget/quantity filter. → PR 3. |
| F | 2-col FacilityCard results grid | ❌ | Not present in trunk. → PR 3. |
| G | Seller v3 surfaces (company-layer onboarding 1.Compagnie/2.Facilité, role switch, FacilitySelectorChips, seller pin context, product mgmt, plans & credits, pro auto-response) | 🟡 | Trunk has functional seller surfaces (catalogue mutation, pro activation, wallet recharge, claim, certification progress) but not styled/structured to v3. No FacilitySelectorChips, no 2-step Compagnie/Facilité onboarding. → PR 4. |
| H | Transaction v3 alignment ('Je veux acheter', 4-step confirmation, 5-star review) | 🟡 | Availability request + chat + QR exist. Missing v3 stepper/review CTA (screens 8, 12, 13). → PR 5. |
| I | Remove `pay_on_delivery` | ❌ | `ExternalPaymentMethod = 'cash' | 'mobile_money' | 'pay_on_delivery'` in `src/trunk/types.ts`. v3 allows only cash + Mobile Money. → PR 5. |
| J | Seller camera scanner + in-store 'Ajouter au panier' (screen 22 / 14) | 🟡 | Partial transaction surfaces exist; no seller camera scanner / direct in-store add-to-cart. → PR 5. |
| K | Buyer-pro bulk-availability credits + `$20` locked-until-confirmed badge (screen 24 / 21) | 🟡 | Wallet + plans defined in types; UI/surface and neutral locked-credit badge missing. → PR 6. |
| L | Facility status reduced to exact `{unclaimed, unconfirmed, confirmed}` | ❌ | `PublicTrust = 'unclaimed' | 'certified' | 'unconfirmed' | 'confirmed'` — extra `'certified'` not in v3's exact 3. → PR 6. |
| M | PWA theme `#F9F9F7` | ❌ | `index.html`/manifest theme not verified to `#F9F9F7`. → PR 6. |

### 5.3 The ~6 specific feature deltas that remain (summary)

1. **v3 design system applied to the whole trunk UI** (old CSS → v3 tokens/components) — buyer search first.
2. **Product model → v3 fields** (stock_loué_omni, prix_original, prix_réduit, %réduction; discount mandatory).
3. **Search constraints** `budget_max` / `quantité_min` / `rayon_km` + **2-col FacilityCard grid**.
4. **Seller v3 surfaces** (company-layer onboarding, role switch, FacilitySelectorChips, seller pin context, product mgmt, plans & credits, pro auto-response toggle).
5. **Transaction v3 alignment** ('Je veux acheter', 4-step confirmation, 5-star review, remove `pay_on_delivery`, seller camera scanner, in-store 'Ajouter au panier').
6. **Buyer-pro credits UI, `$20` locked badge, status reduction to exactly 3, PWA theme `#F9F9F7`.**

---

## 6. Execution roadmap (the PR plan)

Ordered PR list. Each is a feature branch off `omni-v2-rebuild`, reviewed + merged by the lead (squash), then auto-deploys to prod. **Do NOT merge your own PR.**

### PR 1 — ✅ DONE — Wire trunk entry (merged #55)
- `src/main.tsx` → render `TrunkApp` instead of the error-branch `MaquetteApp`.
- **Status:** MERGED (merge commit `c9551be`). Trunk is now the live app.

### PR 2 — 🟡 v3 design system on buyer search (lot A, screens 1–5) + shared tokens/foundation
- **Delivers:** v3 tokens/colors/typography foundation + named components (MenuIcon, RoleSwitch, SearchDock, FacilityPin, ContextPanel, StatusBadge, PriceBadge, FilterChip) applied to buyer search surfaces; map ≥55%; remove old `--forest`/`--coral`/Inter usage; PWA fonts (Plus Jakarta Sans, Hanken Grotesk).
- **Key files to touch:** `src/styles.css` (or new `src/trunk/v3.css` tokens), `src/trunk/TrunkApp.tsx`, `src/trunk/TrunkMap.tsx`, `index.html` (font links), `public/` (manifest/theme), new shared component module under `src/trunk/` or `src/components/`.
- **Definition of done:** screens 1–5 match the spec exactly (map ≥55%, only MenuIcon+SearchDock nav, exact hexes, French copy, FacilityPin/ContextPanel behavior per rules 3/7); existing tests still pass.

### PR 3 — 🟡 Product model to v3 + rayon_km filter + 2-col FacilityCard grid
- **Delivers:** migrate product fields to `stock_loué_omni`, `prix_original`, `prix_réduit`, `%réduction` (discount mandatory); add search constraints `budget_max`, `quantité_min`, `rayon_km`; 2-col FacilityCard results grid on screen 3.
- **Key files to touch:** `src/trunk/types.ts`, `src/trunk/api.ts`, `src/server/` (root ops / trunk-repository / ledger where catalog data is written), `db/migrations/` (new migration), `src/domain/` invariants + tests, `src/lib/catalogue.ts`.
- **Definition of done:** product create/edit persists all five v3 fields with mandatory discount; search honors rayon_km/budget/quantity; results render as a 2-col FacilityCard grid; tests updated + green.

### PR 4 — 🟡 Seller v3 surfaces
- **Delivers:** company-layer onboarding (2 explicit header steps "1. Compagnie" / "2. Facilité", screen 16), role switch (screen behavior per rule 4), FacilitySelectorChips (rule 8), seller facility-pin context (screen 19), product management (screen 20, discount mandatory from creation, disable "Ajouter un produit" beyond 5 if free), plans & credits (screen 21, "10$/mois vendeur", neutral "20$ verrouillés jusqu'à confirmation"), pro auto-response toggle.
- **Key files to touch:** `src/trunk/TrunkApp.tsx` seller panels, `src/trunk/SellerTransactionPanel.tsx`, `src/trunk/TrunkMap.tsx` (FacilitySelectorChips layer), `src/trunk/types.ts` + `api.ts` if contract changes.
- **Definition of done:** all seller screens D match spec; >1 visible facility shows FacilitySelectorChips (no dropdown); onboarding is a 2-step Compagnie/Facilité flow; pro toggle gated on pro; discount visible+mandatory at creation; tests green.

### PR 5 — 🟡 Transaction v3 alignment
- **Delivers:** 'Je veux acheter' CTA, 4-step confirmation stepper (screen 12: Paiement envoyé/reçu, Produit envoyé/reçu), 5-star review (screen 13), **remove `pay_on_delivery`** (keep only cash + Mobile Money), seller camera scanner (screen 22), in-store 'Ajouter au panier' (screen 14).
- **Key files to touch:** `src/trunk/TrunkApp.tsx` (transaction/chat/QR/confirm/review), `src/trunk/TransactionChat.tsx`, `src/trunk/TransactionQrCard.tsx`, `src/trunk/SellerTransactionPanel.tsx`, `src/trunk/types.ts` (`ExternalPaymentMethod` — drop `pay_on_delivery`), camera-scanner component (new, v3-styled).
- **Definition of done:** closure stages + review flow per spec; no `pay_on_delivery` anywhere; QR + in-store scan flows work; tests green.

### PR 6 — 🟡 Buyer-pro credits + locked badge + status reduction + PWA theme
- **Delivers:** buyer-pro bulk-availability credits UI (screen 24, remaining-credits counter, "Acheter des crédits", "crédits de disponibilité en masse"), `$20` locked-until-confirmed **neutral** badge, **reduce facility statuses to exactly `{unclaimed, unconfirmed, confirmed}`** (drop `certified`), PWA theme to `#F9F9F7`.
- **Key files to touch:** `src/trunk/types.ts` (`PublicTrust` — remove `'certified'`), `src/trunk/TrunkApp.tsx`, `src/server/` where status is derived, `db/migrations/` if needed, `index.html` + `public/manifest` (theme-color `#F9F9F7`), tests.
- **Definition of done:** exactly 3 facility statuses; locked-credit badge neutral; credits screen per spec; PWA theme `#F9F9F7`; tests green.

---

## 7. Rules / workflow for any future dev

### 7.1 Must-read before starting
- **This file** (`OMNI-V3-MASTER-PLAN.md`) — the master plan.
- `/home/team/shared/WORKFLOW.md` and `/home/team/shared/DESIGN-SPEC-v3.md` are the live upstream sources, but **this file is self-contained** — follow it if the shared files are unavailable (they are at paths a future dev may not have). **DESIGN-SPEC-v3.md is the authoritative UI language** (embedded in [Section 4](#4-the-full-v3-design-system)).
- Repo docs: `CLAUDE.md` / `AGENTS.md` / `README.md` if present (check trunk + `docs/` for dated contracts).

### 7.2 Workflow rules (from WORKFLOW.md — CRITICAL)
1. **Work ONLY in `/root/omni`** (the large 3.1G overlay). **Never** node_modules, builds, dist, or the working tree under `/home` (300MB, dies ENOSPC).
2. **`omni-v2-rebuild` is the production branch.** It auto-deploys to Vercel prod on push. Build on it via feature branches.
3. **ALWAYS install with `npm install --cache /root/.npm`** — a plain `npm install` writes to `$HOME/.npm` (on `/home`) and dies with ENOSPC.
4. **Do NOT touch or merge `ui/clean-base-rebuild`** — the owner flagged its "newly added UI" as an error. The solid base is **`src/trunk`** (its components).
5. Feature branch off `omni-v2-rebuild` → build + test locally (`npm run build`, `npm test`) → open PR → **lead reviews/merges** (squash). After merge, push auto-deploys to prod.
6. Never hardcode secrets. Production DB is Neon (Postgres); credentials are deployed Vercel secrets. FedaPay adapter handles wallet reloads.

### 7.3 Design rules (Section 4) apply to ALL work
Every screen must respect the 11 hard global rules, exact colors, typography, radii, spacing, elevation, and the named component-only library — see [Section 4](#4-the-full-v3-design-system). Run the [final per-lot check](#49-final-check-before-delivering-any-lot-per-screen) before delivering anything.

### 7.4 Definition of done (global)
- Work is on a feature branch off `omni-v2-rebuild`, builds clean, tests pass.
- Surfaces match the v3 spec exactly (no invented colors/fonts/components; French copy; map ≥55% unless fullscreen-exception).
- PR opened, not self-merged; PR URL reported to the lead.
- Working tree left on the default branch, clean.

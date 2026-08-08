# OmniView Lomé

# OMNIVIEW — PROMPT DE BUILD COMPLET

## Ce qui change dans cette version
- La landing page parle aux utilisateurs (acheteurs et vendeurs) et à leurs problèmes réels, pas aux investisseurs. Marché/ask/équipe/roadmap, c'est le pitch deck, pas le produit.
- Le parcours vendeur est maintenant spécifié en entier : création de fiche → déblocage du bonus → utilisation comme budget pub → écrans de ciblage publicitaire.

---

```
Build a web app called "OmniView", a real-time local business discovery platform for Lomé, Togo, with a dual-role buyer/seller account system. French UI. Design: clean, minimalist, white background, warm accents (terracotta, warm yellow, deep green), mobile-first.

CRITICAL UX PRINCIPLE: The buyer's experience IS the map. There is no separate buyer dashboard. The seller has a separate dashboard accessible via a role switcher in the navigation, always visible regardless of which view is active.

Implement almost everything as REAL, working functionality. Only payment processing and background/push notifications are MOCKED (clearly labeled "Mode démo").

===========================================================
1. LANDING PAGE — talks to users, not investors
===========================================================
This page must speak directly to the two real pain points OmniView solves. No market-size numbers, no funding ask, no team bios, no roadmap milestones — that content belongs in a pitch deck, not here.

HERO
- Split hero with two entry points, side by side or as a toggle:
  - "Je cherche quelque chose" → headline: "Vous cherchez un produit ou un service ? Voyez qui l'a près de vous, avant de vous déplacer." CTA "Rechercher maintenant" → goes straight to the map.
  - "Je vends quelque chose" → headline: "Vos clients vous cherchent déjà. Ils ne savent juste pas que vous existez." CTA "Rendre mon commerce visible" → goes to vendor signup/onboarding.

BUYER SECTION (why it matters to them)
- "Vous demandez à vos proches, vous tapez au hasard sur Google, vous vous déplacez sans savoir si c'est encore disponible. La plupart du temps, vous finissez par acheter ailleurs, alors qu'une meilleure option était à deux rues."
- Visual: search bar mockup + a few example results with distance and availability badges
- 3 steps: Tapez ce que vous cherchez → Vérifiez la disponibilité en temps réel → Suivez l'itinéraire jusqu'au vendeur
- Secondary line: "Gratuit. Aucun compte requis pour chercher."

SELLER SECTION (why it matters to them)
- "Vous avez déjà payé pour des flyers ou une pub boostée qui n'a presque rien ramené. Un vendeur qu'on a interrogé a eu 4 clients sur 100 grâce aux panneaux qu'il a payés. OmniView vous met devant des gens qui cherchent déjà ce que vous vendez, pas devant tout le monde."
- Visual: simple before/after — "Avant: diffusion large, résultat flou." / "Avec OmniView: visibilité auprès de gens qui cherchent activement votre produit."
- Welcome offer callout, visually prominent (card with accent background): "10 000 FCFA offerts à l'inscription. Ça débloque 2 mois du palier Pro et sert de budget publicitaire. Aucune carte bancaire requise."
- 3 steps: Créez votre fiche → Recevez 10 000 FCFA offerts → Vos produits sont vus par des acheteurs qui les cherchent déjà

TRUST / SOCIAL PROOF (framed for a user deciding whether to try it, not for an investor evaluating traction)
- "Déjà des vendeurs et des acheteurs sur OmniView à Lomé." with a simple counter-style display, not a stats dashboard
- Optional real quote from a seller if available, framed as a testimonial, not a data point

FAQ (short, addresses hesitation)
- "Est-ce que c'est payant pour chercher un produit ?" → Non, la recherche est gratuite.
- "Comment les fiches sont-elles vérifiées ?" → Badge statut expliqué brièvement.
- "Qu'est-ce que je peux faire avec les 10 000 FCFA ?" → Explication courte du mécanisme (voir section vendeur ci-dessous).

FOOTER
- Simple links, no legal/investor content needed for MVP.

===========================================================
2. MAP (buyer's entire experience)
===========================================================
MapLibre GL JS via CDN (document.createElement, unpkg CDN URL). Light/white CartoDB basemap. Facility markers as styled DOM divs color-coded by status: grey=non_verifie, blue=verifie, gold=certifie. Mobile facilities get a distinct scooter icon marker. Pro facilities get a small "Sponsorisé" ribbon on their marker.

Always-visible top nav: search bar, role switcher (Acheteur / Vendeur), cart icon, wishlist icon, login/account.

Click a marker → bottom sheet slides up:
- Facility name, vendor name, category, distance, status badge, type badge (Fixe/Mobile)
- "Itinéraire" button → renders walking directions ON THE MAP using the OSRM API: green polyline on the map, step-by-step guidance panel at the bottom, voice navigation via SpeechSynthesis (fr-FR). Not a Google Maps link, the route is drawn and navigated inside OmniView itself.
- "Contacter" button → chat modal or phone number display
- Favorite heart button (saves to wishlist if logged in)
- Product list: photo, name, price (FCFA), availability badge (Disponible/En rupture), freshness badge (green if last_confirmed_at < 48h, amber if older or null)
- Quantity stepper (±) per product + "Ajouter au panier" button
- Active coupons displayed if logged in
- "Je cherche ce produit" button → opens a form where the buyer types the name of a product they're looking for that DOES NOT EXIST on the platform. Saves to the Wishlist table as search_term. This is a demand signal, not a saved existing product.

Cart (CartPanel): slide-in right drawer, items grouped by facility, quantity controls, total in FCFA, "Envoyer la demande" button per facility group.

Search: "Que cherchez-vous ?", voice search (Web Speech API, fr-FR), category pills (Alimentation, Électronique, Mode, Artisanat, Matériaux, Services), sort picker (Pro facilities first with a "Sponsorisé" badge, then distance).

Filter: any Facility with is_online=false is completely hidden from search results and map markers.

Proximity banner (MOCKED): on page load/refresh, compute browser geolocation distance to every Facility with type="mobile" and is_online=true. If any within 2km, show a dismissible banner "X est à proximité de vous". Computed on-demand at request time, not via background push.

===========================================================
3. SWITCHING TO VENDOR & FIRST FACILITY (the flow that was missing)
===========================================================
This is the core growth loop of the product. Specify it exactly:

STEP 1 — Entry points into the vendor flow
- Clicking "Vendeur" in the role switcher, or the landing page CTA "Rendre mon commerce visible", both lead here.
- If the user isn't logged in yet, show signup/login first, then continue to Step 2.

STEP 2 — No facility yet: onboarding form
- If the logged-in user has zero Facilities, show a focused onboarding screen (not the full dashboard yet): "Créez votre fiche commerce"
- Fields: name (text), category (dropdown: electronics/hardware/fashion/food/other), address (text input) with a map click-to-place-pin picker to set latitude/longitude, phone (text), type (radio: Fixe / Mobile)
- Button: "Créer ma fiche et débloquer mon bonus"

STEP 3 — Bonus unlock (automatic, on submit)
- On successful Facility creation, in the same transaction: set that Facility's Subscription to tier="pro", wallet_balance=10000, pro_active_until = today + 2 months. Set User.wallet_bonus_used = true.
- Immediately show a confirmation modal, not just a toast, since this is the key "aha" moment:
  - Title: "🎉 Bienvenue ! Vous avez 10 000 FCFA offerts."
  - Body: "Votre palier Pro est actif jusqu'au [pro_active_until, formatted date]. Ce montant sert à la fois de seuil d'abonnement et de budget publicitaire: vous pouvez l'utiliser pour booster la visibilité de vos produits dès maintenant."
  - Button: "Voir mon tableau de bord" → goes to Step 4

STEP 4 — Vendor dashboard home
- Lands on the dashboard with the Subscription card already showing "Pro actif" and the wallet balance, so the bonus is visible immediately, not something they have to go find.

MONTHLY RE-EVALUATION RULE (real logic, not shown to the user as a warning, just enforced)
- Pro status is re-evaluated each calendar month. A facility keeps tier="pro" for a given month only if a deposit or ad spend of at least 5,000 FCFA occurred that month. A leftover wallet_balance can still be spent on ads at any time, but it does not by itself renew Pro status for a new month. Implement this as a scheduled check or a check-on-load function, not user-facing copy explaining the mechanism.

===========================================================
4. VENDOR DASHBOARD — full detail
===========================================================
Persistent left or top navigation within the dashboard: Aperçu, Mes fiches, Produits, Publicité, Coupons, Demandes reçues, Produits recherchés.

APERÇU (home)
- Facility switcher if the vendor has more than one Facility (only possible on Pro)
- Status card: verification badge (Non vérifié / Vérifié / Certifié), toggle En ligne / Hors ligne, type Fixe/Mobile
- If type = mobile: button "Mettre à jour ma position" using navigator.geolocation.getCurrentPosition() on click, writes latitude/longitude/last_position_update
- Subscription card: tier badge (Gratuit/Pro), wallet_balance shown prominently in FCFA, pro_active_until as a countdown ("Actif encore 47 jours"), button "Déposer plus" (MOCKED, see below)
- Quick stats: number of products, freshness status summary, number of pending cart requests

MES FICHES / PRODUITS
- Products list/grid: photo, name, price, in_stock toggle, freshness badge
- Add/edit/delete, hard cap at 5 products if tier="free", with a visible counter "Palier gratuit: X/5 produits"
- Prominent "Tout confirmer" button above the list: sets last_confirmed_at = now for every product owned by this facility in one click
- Banner "Confirmez la disponibilité de vos produits" if no product has been confirmed within 48 hours, with the same one-tap action

PUBLICITÉ (the ad targeting UI, fully specified)
- Header shows current wallet_balance prominently, e.g. "Budget publicitaire disponible: 10 000 FCFA"
- Button "Créer une campagne" opens a campaign builder modal/panel:
  - Step A, choose products to feature: checkbox list of the vendor's own products (multi-select)
  - Step B, choose radius: a single-select of 1 km / 3 km / 5 km / 10 km / Tout Lomé, shown as tappable chips
  - Step C, live cost estimate: compute cost_fcfa = 500 * radius_km (for "Tout Lomé" use a flat 4000 FCFA), update the displayed cost as the radius changes
  - Step D, live reach estimate: a simple mocked number derived from counting demo Wishlist/search activity or nearby seeded buyer accounts within that radius (does not need to be a real analytics pipeline, a reasonable approximate count from seed data is enough), shown as "Portée estimée: ~X acheteurs à proximité"
  - Button "Confirmer et lancer" is disabled if cost_fcfa > wallet_balance, with an inline message "Solde insuffisant, déposez plus pour continuer"
  - On confirm: deduct cost_fcfa from wallet_balance, write a new AdCampaign record, show a success state "Campagne lancée. Vos produits sélectionnés sont mis en avant dans les résultats de recherche pour les 7 prochains jours." (implement a simple campaign_active_until = now + 7 days field)
- Ranking status indicator, always visible on this screen: "Votre fiche apparaît en position boostée (badge Sponsorisé) dans les résultats de recherche tant que votre palier est Pro." This is separate from and always-on compared to the one-off campaigns above; the Pro tier itself already grants the "Sponsorisé" ranking boost, a campaign is an additional, product-specific push.
- Campaign history table below: date, radius, products featured, cost, estimated reach, status (Actif/Terminé based on campaign_active_until)

"Déposer plus" (MOCKED payment)
- A simple modal: amount input (FCFA), button "Confirmer (mode démo)", clearly labeled "Mode démo, aucune transaction réelle". On confirm, add the amount directly to wallet_balance in the database. If the amount is ≥ 5,000 FCFA and it's a new calendar month since the last qualifying deposit/spend, also extend pro_active_until and ensure tier="pro".

COUPONS
- "Créer un coupon" form: code (text), description, discount_percent. Real database write.
- List of active coupons with a simple usage count from the Redemption table.

DEMANDES REÇUES
- List of Cart records with status="pending" for this facility, with buyer info, items requested, and buttons to mark Confirmée/Refusée/Terminée (updates Cart.status).

PRODUITS RECHERCHÉS
- List of Wishlist entries (search_term) from buyers, filtered to terms relevant to this facility's category if feasible, otherwise show all recent entries. Framed as market insight: "Ce que les acheteurs cherchent près de chez vous."

===========================================================
5. FACILITY DETAIL PAGE (direct URL or from bottom sheet)
===========================================================
Same content as the map bottom sheet but as a full page: all products, badges, itinerary rendered on an embedded map, contact, coupons, wishlist button. Useful for sharing a direct link to a facility.

===========================================================
6. AUTH & DUAL ROLE
===========================================================
Single account per user, no role selection at signup. Role switcher (Acheteur / Vendeur) always present in the nav once logged in. Switching to "Vendeur" with zero Facilities routes into the onboarding flow described in section 3. Switching back to "Acheteur" always goes to the map.

===========================================================
7. WISHLIST PANEL (buyer side, from map nav)
===========================================================
List of the buyer's own saved demand-signal searches (products that don't exist on the platform yet). Remove option. Clicking one re-runs that search term on the map.

===========================================================
DATA MODEL
===========================================================
- User: id, name, email, password_hash, wallet_bonus_used (boolean, default false)
- Facility: id, owner_id (FK User), name, category (electronics|hardware|fashion|food|other), description, address, latitude, longitude, phone, status (non_verifie|verifie|certifie, default non_verifie), is_online (boolean, default true), type (fixe|mobile, default fixe), last_position_update (timestamp, nullable)
- Product: id, facility_id (FK), name, price (FCFA), in_stock (boolean), photo_url (optional), last_confirmed_at (timestamp). No quantity field, ever.
- Subscription: facility_id (FK), tier (free|pro, default free), wallet_balance (FCFA, default 0), pro_active_until (date, nullable), last_qualifying_action_month (text or date, used for the monthly re-evaluation rule)
- AdCampaign: id, facility_id (FK), product_ids (array or join table AdCampaignProduct), radius_km (integer, nullable if "Tout Lomé"), is_city_wide (boolean, default false), cost_fcfa, reach_estimate (integer), created_at, campaign_active_until (timestamp)
- Wishlist: id, user_id (FK), search_term (text), created_at. search_term is the product the buyer is looking for that does not exist on the platform (demand signal, not a saved existing product)
- Coupon: id, facility_id (FK), code (text), description, discount_percent
- Redemption: id, coupon_id (FK), user_id (FK), facility_id (FK), created_at
- Cart: id, buyer_id (FK User), facility_id (FK), status (pending|confirmed|denied|completed), created_at
- CartItem: id, cart_id (FK), product_id (FK), quantity, price_at_time

===========================================================
OUT OF SCOPE
===========================================================
Real payment gateway integration. Real push notifications or background/continuous geolocation tracking. Camera-based QR scanning. A polished analytics dashboard for Redemption or AdCampaign data (plain lists are sufficient). A real ad-reach measurement pipeline (the reach estimate is a reasonable approximation from seed data, not real tracking).

===========================================================
SEED DATA
===========================================================
12-15 realistic Facilities across Lomé neighbourhoods (Adidogomé, Bè, Hedzranawoe, Agoè, Grand Marché), mixed categories, mixed status (include some "verifie" and at least one "certifie"), mixed tier (some "pro" to demonstrate ranking and to have campaign history to show), mixed type (at least 2-3 "mobile" facilities positioned close enough to trigger the proximity banner). Each Facility: 2-6 realistic Products with FCFA prices, mixed stock status, and varied last_confirmed_at timestamps (some fresh, some stale).

Seed one test account: email "demo@omni.tg", password "OmniDemo2026", already has one Facility (type "fixe", status "verifie", tier "pro", wallet_balance around 6,000 FCFA to show a partially-spent budget), 4 Products with varied freshness, 2 Wishlist entries, 1 active Coupon, 2 seeded Redemption records, 1 seeded AdCampaign (already run, so the campaign history table isn't empty), and a few pending Cart requests so "Demandes reçues" isn't empty either.
```

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/25026940-2588-4837-a9b3-42f3e8838e77).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

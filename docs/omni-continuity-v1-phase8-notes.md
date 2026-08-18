# Omni continuity V1 — Phase 8 notes

## Auth replay

Buyer availability and search hand-off already use the canonical pending-search storage. A user without a session is sent to `/auth?redirectTo=/carte?pendingSearch=1`; after authentication, `CartePage` restores the product term, category, filters, quantity, target facilities, location source and requested availability mode. The QR deep-link route uses the same account-bound redirect pattern and returns to `/transaction/qr?token=...` after authentication.

## Onboarding

The onboarding route now explains the buyer search promise, location permission, OSM/Omni discovery, availability, transactional chat, QR and progress. Seller onboarding remains a separate three-section flow in the map-first seller workspace. Redirect targets are constrained to internal paths before navigation.

## Notifications

The bell is isolated from the hamburger menu and polls only for the authenticated user. Opening it marks notifications read; transaction links now carry the transaction identifier to `/carte` or `/vendeur`, while QR links resolve through the account-bound `/transaction/qr` entry. No Agent, Ads, Admin or role switch surface was reintroduced into the V1 menu.

## Admin boundary

The admin route remains UI-gated by the identity role flags, and all admin server functions remain protected by `requireStaff`. The server boundary—not hidden navigation—is authoritative. Manual admin status updates still cannot directly set a facility to `confirmed`.

## Result

No Phase 8 code change was necessary beyond the Phase 5 transaction deep-link and Phase 6 seller notification-link integration. The existing replay and authorization contracts are retained as the source of truth and are recorded here for certification.

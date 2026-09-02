# Omni — Admin / Operator Maquette Set (G-02b)

> **Set ID:** `SPECIES-ADMIN-SET-2026-09-02`
> **Plan:** `HQ-OMNI-2026-09-02` · **Handoff:** `HO-OMNI-03` · **Gate:** Species (G-02b)
> **Produced by:** `/nature-way` (specialist in control of Gate 2)
> **As of:** 2026-09-02 (UTC)
> **Visual artifact:** `docs/maquette/omni-admin-operator-maquette.html` (self-contained, served at `https://work-1-ydrtpryguzosdbth.prod-runtime.all-hands.dev/omni-admin-operator-maquette.html`)
> **Status:** proposal — **pending founder acceptance**. No code; maquette/specs only.

## Art direction (founder, 2026-09-02 — reconciled this session)

Founder directives carried from the prior session into the current maquette:
- **Liquid glass** surfaces: frosted translucent panels (`backdrop-blur`), soft white borders, subtle shadows, generous whitespace — inherited from the product's **real** `LiquidGlass` tokens in `src/components/ui/LiquidGlass.tsx` (ink `#1A1C1B`, forest `#234D40`→`#1A3B31`, accent coral `#F08F5A`; elevations `bg-white/70..95 backdrop-blur-md..2xl`).
- **Logo = location pin with an eye inside, 3D-shaped mark** (SVG with gradients + highlight + iris), used in the board header, every screen top-bar crest, and the map pin.
- **Épuré / minimaliste, map-centric, contextual:** every Admin screen is a frosted-glass overlay over a faint map base with a pin — Admin flows are contextual surfaces, not a separate dashboard chrome. Compatible with R-01 (bottom control panel) + R-02 (simple/direct) + R-03 (map-contextual).
- **Screen set A1–A8** (founder accepted the list): A1 Console équipe, A2 File de revue, A3 Confiance & état opérationnel (two dimensions per D-01), A4 Activation & suspension vendeurs, A5 Gestion des rôles, A6 Correction compteur ventes (exceptionnelle), A7 Sorties opérateur & push, A8 Audit & mesure (success signal). Public trust label confirmed (`Non revendiquée`/`Non confirmée`/`Confirmée`; `Certifiée` = internal milestone); separate operational state (`Ouvert`/`Fermé`/`Temp. indispo.`).

## Founder rules this set obeys

| Rule | Source | How the set satisfies it |
|---|---|---|
| **R-01 — bottom simple control panel** | Founder, HO-OMNI-03 | The Admin/operator surface has a single **bottom-docked control panel** (the "operator bar") holding the only controls that exist. It is a *simple control panel*, not a full app tab bar: a few thumb-reachable actions, contextual to the current selection. The buyer app's `bottom-nav` is the inherited pattern; admin is lighter, not heavier. |
| **R-02 — simple, direct first visit** | Founder, HO-OMNI-03 | The Admin/operator landing shows the **map and the queue at once**, with one obvious next action: "Review the next claim". No dense dashboard, no admin-only jargon, no graphs. First-visit affordance: a single line says what to do next and why. Cut to the four honest admin jobs (claim review, role management, operator runs, audit). |
| **R-03 — map-contextual actions** | Founder, HO-OMNI-03 | The **map is the shared canvas**. Selecting a claim, a facility under review, or an operator run **focuses it on the map** (pin + ring + sheet). Admin actions are not abstract table rows; every reviewable object is geolocated and the map reflects the selection. Reviewing a claim pans to that facility; an operator run draws its route/points on the map; the audit view can hop to any object's location. |

## Design system inheritance (locked from blueprint §2)

Tokens inherited verbatim from the existing buyer prototype (`:root`): `--ink:#0b1712; --muted:#6f7b75; --line:#e6ebe7; --paper:#f4f7f4; --panel:#fff; --green:#10a96b; --green-dark:#08794d; --mint:#e4f8ef; --amber:#c88915; --red:#c64d4d; --r:26px; --ease:cubic-bezier(.23,1,.32,1)`. Admin/operator uses the **same** monochrome map, ivory background, forest-green trust, amber attention, red-earth reject — so admin is recognizably the same product, not a separate back-office skin.

Admin-only additions (no new color): `--amber` marks "in review / pending"; `--red` for reject; `--green` for certify/verified; `--muted` for "unclaimed / public import". No admin introduces a color the buyer never sees.

## Screen set

The Admin/operator set is **five surfaces** plus their key states. All live inside the same phone frame with the map as the persistent canvas (R-03). The bottom control panel (R-01) changes only its contextual actions per surface.

| # | Surface | R-01 bottom control panel contents | R-02 first-visit clarity | R-03 map reflection |
|---|---|---|---|---|
| A1 | **Operator home** — the landing | `Review next` (primary), `Runs`, `Roles`, `Audit` (compact chips, not a full nav) | One line: "N claims need you. Review the next one." Primary action is the only bright button. | Map shows pins colored by status (in-review amber, certified green, unclaimed muted). The next-review pin is selected + ringed. |
| A2 | **Claim review** (creation + claim tabs) | `Certify`, `Request evidence`, `Reject w/ reason` | The dossier opens to the evidence; the three actions are the whole job. No counter editing. | Map pans to the claimed facility; the pin is amber-ringed; tap "See on map" recenters. |
| A3 | **Operator field run** | `Start run`, `Add point`, `End run` | A run is a list of facilities to visit; one primary action starts it. | Map draws the run's points + route; each visited point flips state on the map. |
| A4 | **Role management** | `Assign operator`, `Reinstate`, `Suspend` | A short list of people + their role; cannot self-assign admin (locked). | Map not the focus here (roles are not geolocated), but selecting a person highlights the facilities they own on the map. |
| A5 | **Audit** | `Filter`, `Hop to object` | A reverse-chronological list of decisions with reasons; one tap reopens the object on the map. | "Hop to object" pans the map to that facility/transaction and rings it. |

### Key states per surface (must all appear in the maquette)

- A1 Operator home: empty queue, queue with items, next-review selected, network/loading error, unauthorized (not admin).
- A2 Claim review: evidence loading, evidence ready, request-evidence sent, certified (green), rejected with required reason (red), already-decided (locked).
- A3 Operator run: empty run, run in progress, point visited, run ended, run error.
- A4 Role management: list, assign operator modal, suspend with reason, self-assign blocked.
- A5 Audit: list, filter applied, object reopened on map, empty filter.

## Honest boundaries (from D-01…D-07 + SDM)

- The sales counter (`0/3 → 3/3`) **is not edited here** (blueprint §4D: "Le compteur de ventes ne se modifie pas ici"). Admin only certifies identity/location/activity; `confirmed` comes only from 3 verified sales (D-01).
- Trust lifecycle = the 9 internal states; the **public label** (unclaimed / unconfirmed / confirmed) and **operational state** (open/closed/temporarily_off) are surfaced separately (D-01). Admin transitions the internal state; the public/operational labels are derived, not free-typed.
- Auto-availability (D-03) and stock events (D-02) are **seller-side**, surfaced in G-02c, not admin. Admin sees them in audit only.
- Every mutation shows loading/success/error/retry and is audit-logged (SDM E-20). Cannot self-assign Admin from the UI.

## Validation criteria for G-02b acceptance

The founder accepts the Admin/operator set when the maquette demonstrates:
1. the map is the persistent canvas and every selection reflects on it (R-03);
2. the only controls live in a bottom control panel within thumb reach, and it is simple, not a full nav (R-01);
3. a first-time admin sees one obvious next action and no dense dashboard (R-02);
4. the four honest jobs (claim review, roles, operator runs, audit) are all present;
5. the sales counter is explicitly out of scope here and admin cannot fabricate trust;
6. the design system is identical to the buyer prototype (same tokens, same map).

**G-02b status: ready for founder acceptance.** Until accepted, no Root contract or Trunk code for admin is authorized.

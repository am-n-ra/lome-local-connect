# Buyer Trunk — Heartwood evidence matrix

**Status:** `partial / ring decision pending`

**Scope:** Buyer Heartwood hardening for the approved map-first Trunk slice. This matrix records what is evidenced, what is covered by automated checks, and what remains manual or dependent on Seller work. It does not close the global Root, and it does not represent demo fixtures as marketplace activity.

## Acceptance matrix

| Heartwood concern | Evidence / coverage | Status | Owner / next proof |
|---|---|---:|---|
| Permanent map-first arrival | Canonical URL renders the map stage, Buyer/Seller switch, J5 account control, search dock, result sheet and facility cards. | `proved` | Keep as Buyer arrival baseline. |
| Remote map and honest fallback | `TrunkMap.tsx` uses a real OpenStreetMap raster source and switches to `/omni-local-style.json` on load/error timeout. Canonical browser observation displayed `Carte en mode de secours`, not a false `Carte active`. | `partial` | Recheck remote tile reliability; fallback honesty and public pin continuity are proved. |
| Public facility pins and clusters | Canonical e603700/48bf064 browser proof showed a visible public cluster labelled 4, then cluster expansion to a local view with an individual facility pin and a separate cluster labelled 3. The accessible surface exposed the same cluster/pin actions; the fallback overlay uses the public facility coordinates and does not expose stock, trust or permission. | `proved` | Preserve cluster semantics and repeat under reduced-motion/denied-location conditions. |
| Resting globe / reduced motion | Canonical normal-motion proof shows RAF rotation with stable zoom; hover pause/resume preserves the current center. Public Playwright at 390×844 proves `data-rotation=rotating`; reduced-motion Playwright proves `data-rotation=reduced` and an unchanged center. | `proved / bounded` | Keep live permission/context-motion and authenticated compact proof open. |
| Map controls and location request | Canonical authenticated proof shows post-reveal Zoom avant `6.20→7.20` with result preserved; public compact Playwright shows `1.35→2.35` and enabled `Zoom avant` / `Utiliser ma localisation`. A bounded temporary geolocation stub proves the exact-marker UI path and is restored without requesting real coordinates. | `partial / bounded` | Prove real permission, denied/retry and approximate-vs-exact outcomes without retaining personal location. |
| Loading state | Canonical navigation initially exposed `Chargement de la carte` before settling. Server/client tests cover loading branches for the Buyer data seams. | `proved` | Preserve `aria-live` status behavior. |
| Facility-detail loading/error recovery | Detail fetch has a monotonic request guard so stale asynchronous facility responses cannot overwrite the latest selection. Existing UI exposes loading and error copy; no dedicated browser error injection was run. | `partial` | Add focused component/integration test or controlled browser failure. |
| Detail context preservation | Selecting a facility now closes J5 and search-options overlays before opening the detail surface. | `code-proved` | Browser-check once with the account sheet open. |
| Catalogue product selection | Canonical evidence records real facility → catalogue loading → existing product selection; the Buyer surface does not require retyping a catalogue product. | `proved` | Keep free-text out of the normal catalogue path. |
| Availability scope and constraints | Four-stage sheet is implemented: Produit → Portée → Contraintes → Réponses. Quantity and budget mode/value are explicit inputs; copy states availability is not reservation. | `code-proved` | Canonical browser proof already covers the successful path; repeat only if needed, with confirmation before a new write. |
| No reservation / locked private actions | UI explicitly keeps contact, itinerary and intent locked before the authorized transition. No private contact or route action is rendered in the Buyer slice. | `proved` | Do not unlock in this slice. |
| Availability idempotency | Request key now includes facility, product, quantity, budget mode and normalized budget value; request remains server-authoritative. No idempotency key is exposed in evidence. | `code-proved` | Add a focused deterministic key test if the helper is extracted. |
| Auth gate, cancellation and return | Official Neon Auth sheet is in the Buyer path; prior canonical run proved official UI sign-up/session return and a confirmed availability submission. Cancellation and interrupted return have not been separately browser-proven. | `partial` | Manual cancellation/return check without entering or recording credentials. |
| Persisted response read | `GET /api/v2/availability-responses?requestId=…` is protected, buyer-owned and joins product through the request. Repository/client tests cover ownership/mapping. | `proved` | Add HTTP GET 401/400/envelope tests if the existing seam permits. |
| Response-read 500 diagnosis and recovery | Canonical run observed the original 500, identified the incorrect product-column join, deployed the request join correction, and later reached the real pending state. | `proved` | Keep the original 500 as diagnostic evidence, not as current behavior. |
| Pending / no-response state | Canonical URL reached `En attente des vendeurs` with refresh action and expiry. No Seller response existed at that point. | `proved` | This is the current real cross-boundary Buyer proof. |
| Empty response state | UI and repository mapping explicitly render zero responses as pending/no-response. A distinct synthetic empty fixture has not been created. | `code-proved` | Verify through a controlled read only; no additional demo writes without confirmation. |
| Error / retry response state | UI includes alert copy and retry/refresh path; the earlier 500 is evidence of recovery after deployment, but the final UI error state was not deliberately forced. | `partial` | Add a test seam or controlled temporary failure if safe. |
| Expired / stale response rendering | UI maps server request status `expired` and per-response freshness labels. No expired request or stale response fixture has been created. | `code-proved` | Prove with existing data or a non-mutating test fixture; do not alter production-connected data casually. |
| Actual response-card comparison | Canonical bounded Buyer→Seller→Buyer proof rendered one real `Disponible` / `Actualisée` card with facility, product, quantity 1, `$15.00`, receipt time and `Intention encore verrouillée`; no private handoff opened. | `proved` | Preserve the locked intent boundary; broader response/concurrency coverage remains open. |
| Back / Escape / close | Availability header now returns one step at a time for stages 2–3 and closes to facility from stages 1/4. Existing global Escape/close handling is present. No full browser path has been captured after the change. | `code-proved` | Browser-check stage 3 → 2 → 1 and Escape/close context restoration. |
| Session interruption / refresh resume | Server-backed J5 `Mes demandes` now lists the authenticated Buyer’s own request summaries and can reopen facility/catalogue context by request ID; canonical empty-state proof is recorded, while non-empty resume and interrupted-session proof remain open. | `partial` | Reopen the Buyer identity that owns the bounded request, then prove non-empty resume and response comparison. |
| Responsive layout | Existing multi-viewport proof covers structural Buyer spacing; new public Playwright at `390×844` proves full canvas, contained dock, no horizontal overflow and enabled controls. Authenticated `1024×880` proof measures dock `top=561,bottom=610`, sheet `top=624,bottom=858`, and no overlap with the result pin/card. | `partial` | Authenticated compact result-sheet and Seller/Reviewer responsive states remain open. |
| Keyboard / focus | The pin/cluster overlay exposes native accessible buttons; one canonical Buyer Tab moved focus to the named `Utiliser ma localisation` button with a visible outline. Full Buyer Tab/Shift+Tab/focus-trap traversal remains open. | `partial / bounded` | Complete keyboard/focus review across Buyer and Seller surfaces. |
| Accessibility announcements | Map status uses `aria-live`; location prompt uses status/group semantics; response errors use `role=alert`; dialogs expose labels. The reveal status uses `role=status`/`aria-live`; one visible focus-name proof passed. Automated a11y scan and full traversal are not configured. | `partial` | Manual screen-reader/keyboard review or add supported automated assertions. |

## Ring decision

Buyer Trunk is **implemented and materially evidenced but not fully Heartwood-proven**. The map-first public path, visible fallback clusters/pins, official Auth-backed availability write, corrected buyer-owned response read, pending/no-response state, locked pre-intent boundary, real bounded comparison card and navigation hardening are in place. The honest remaining blockers are full keyboard/reduced-motion/location/recovery/concurrency checks and broader responsive proof across Seller states. Global Root remains `review`; QR, payment, camera, transaction and production-readiness claims remain closed.

## 2026-08-24 — authenticated Buyer search settlement

On READY deployment `dpl_B1HfPNbXJaiyq4WEtj7JNWyQW3xD` for commit `6e9c335`, the authenticated Buyer query `Marche de Hanoukope` visibly progressed from `Recherche de…` to `nearby-state-ready` with one accessible public result. The client now sends text queries through a stable query-only global request rather than the rotating camera bounds; a direct read-only endpoint check returned HTTP 200 with one safe public-name match. The MapLibre canvas, public pin, zoom control, J5 owner and separated result surface remained mounted in the available 891×765 Sandbox viewport. No facility was opened and no business mutation occurred.

This closes the bounded Buyer loading→ready search-state proof, not the wider Heartwood gate. Empty/error/retry/recovery/facility-focus, full compact-width authenticated layout, keyboard/focus, concurrency/interrupted-session, exact location success, remote tile reliability and production-readiness proof remain open.

## Latest canonical arrival observation

After commit `7a24142`, the canonical URL rendered the Buyer arrival surface with `KH` account control, search dock, result sheet and facility cards. The browser reported `Carte en mode de secours`, confirming the remote-map failure is surfaced honestly rather than presented as an active basemap. The visible control inventory included `Zoom avant` and `Utiliser ma localisation`; zoom-out remains intentionally disclosed after the first zoom-in action. No new write was performed during this observation.


## 2026-08-23 — J5 request resume verification

The canonical deployment rendered the approved Species arrival and the J5 account menu with `Mes demandes` as the sole account-owned resume entry. Opening it displayed the intended separate contextual sheet, `Compte J5 / Mes demandes`, with the safe-copy boundary that resume does not recreate a request or open private contact. The current official Buyer session returned the truthful empty state `Aucune demande enregistrée`; it is a newly selected Buyer identity and does not own the earlier bounded demo request. No new availability request was submitted. The request-list contract is browser-proven for menu, sheet and empty behavior, while non-empty resume and Buyer comparison remain blocked until the Buyer identity owning the bounded request is reopened or a new bounded request is explicitly authorized.


## 2026-08-23 — bounded Buyer request recreated for cross-flow

After explicit user authorization, the current official Buyer session submitted one new bounded availability request through the Species flow for the labeled `Omni Demo Seller Hub` catalogue product. The canonical sheet showed the four-stage sequence `Produit → Portée → Contraintes → Réponses`, the no-reservation copy, and the locked private-action note before the write. The resulting live state displayed `Demande envoyée`, `En attente de la disponibilité`, and `En attente des vendeurs` with refresh and expiry, confirming the request reached the server-backed pending state. No additional Buyer write was made.


## 2026-08-23 — newly authorized request expired before Seller retry

The clean Manus-computer Buyer session completed the official catalogue-backed flow for `Omni Demo Seller Hub` and submitted one explicitly authorized bounded request. The real pending surface appeared with `Demande envoyée`, `En attente de la disponibilité`, refresh and expiry, while the four-step `Produit → Portée → Contraintes → Réponses` rhythm and pre-intent privacy lock remained visible. Because the Seller response-route correction and deployment took longer than the bounded response window, the same request later displayed `La demande a expiré` and offered `Actualiser` / `Retour à la facilité`. No Seller response was persisted for this request and no comparison card was fabricated. A further request requires a new explicit authorization.

## 2026-08-23 — fresh pending request and Seller persistence blocker

After a second explicit user confirmation, the READY `ddcdd4c` canonical build created one fresh bounded request for the existing `Omni Demo Seller Hub` catalogue product, quantity 1 and no budget. The Buyer sheet displayed `Demande envoyée`, a response deadline and `Recherche des réponses…`; the Seller queue immediately showed the matching request as `Sans réponse`.

The Seller form was filled with `Disponible`, quantity 1 and `15.00`, then submitted exactly once. The route returned a generic 500 after the client’s single bounded recovery retry, and the Seller UI rendered the service-unavailable error. Aggregate-only Neon inspection confirmed one active eligible request, one authorized Seller row, one published product row and five allocated units, with zero persisted responses for the fresh request. No comparison card was fabricated, no duplicate response was submitted, and no QR, intent, contact, itinerary, payment or transaction action was opened.

A locally validated response-SQL hardening patch now removes the parameterized CASE expressions from the eligible CTE and keeps the server-normalized values. Seller persistence and Buyer comparison remain `partial` until that patch is deployed and a retry is explicitly authorized; global Root remains `review`.

## 2026-08-23 — instrumented Seller retry missed the response window

The ff9f4e0 Seller submission for the fresh quantity-one request reached the protected response route and returned PostgreSQL `42804` twice through the client’s bounded recovery behavior. No response row or comparison card was persisted. The server was then instrumented with redacted structured diagnostics and deployed as `6205942` READY, but the request expired before another explicitly authorized Seller response could be submitted in that build. The Buyer comparison gate therefore remains `not yet proved`, and a future fresh request must be authorized before any further Buyer write.

## 2026-08-23 — canonical response comparison proof

The canonical authenticated browser session completed one bounded Buyer→Seller→Buyer path. Buyer created a single request for the existing `Omni Demo Seller Hub` catalogue product at quantity 1 with no budget. Seller saw the request in the map-mounted, J5-owned workspace as `Sans réponse`, submitted `Disponible` at quantity 1 and `$15.00`, and the Seller surface became read-only with `Réponse déjà enregistrée`. Buyer then opened J5 `Mes demandes`, saw the latest server-owned request with one response, and resumed it. The response stage rendered one real comparison card with `Disponible`, `Actualisée`, facility, product, quantity 1, `$15.00`, receipt time and `Intention encore verrouillée`. No contact, itinerary, QR, payment, reservation or transaction action was enabled. The Buyer comparison and Seller persistence slices are now browser-proven for this bounded fixture; Buyer Heartwood remains `partial` for responsive/accessibility, concurrency and interrupted-session gates, and Global Root remains `review`.


## 2026-08-24 — Species/Canopy dock, globe and responsive hardening

The final production deployment was published through the configured Manus Vercel connector, without a separate Vercel login. Deployment `dpl_9SxwK3RL6YD79x2x23Gbi1ggFScK` reached `READY`, retained the canonical aliases and reported the expected Node.js 12-function runtime shape.

The Buyer composition now derives the search dock’s vertical band from the actual rendered nearby sheet top through `ResizeObserver`, rather than relying only on the theoretical `--sheet-height`. The nearby facility sheet is explicitly repliable and expandable. The Options popover is absolutely anchored above the dock, remains clear of the nearby sheet and rail, and has short-mobile responsive sizing/animation that keeps it within the viewport and clear of map controls.

The final non-mutating audit covered 320×760, 375×812, 768×900, 1280×900, 1731×818 and 375×620. All six viewports showed three public facility cards, a real MapLibre canvas, zero horizontal overflow, zero dock/sheet overlap, zero dock/rail overlap, zero dock/card overlap, zero topbar/control overlap and zero Options/dock/sheet/rail/control overlap. The measured dock/sheet gap was 8px on mobile and 14px on desktop/large-short viewports.

The final Browser Sandbox proof showed the public cluster, zoom-in to 2.35 with a distinct zoom-out control, return to global zoom 1.35, slow idle globe rotation at normal motion, and `data-motion=reduced`/`data-rotation=reduced` under reduced motion. Options opened with an accessible expanded state, Escape closed them, and the repliable sheet removed/restored the result rail. Browser geolocation refusal remained honest with `denied` and `Réessayer`. Raster provider failure continued to be reported honestly as `Carte en mode de secours`; this is not remote OSM reliability proof.

This checkpoint remains **partial**. Seller all-width authenticated capture, complete focus/Tab/Shift+Tab certification, exact-versus-approximate location success proof, concurrency/interrupted-session recovery, remote tile reliability, performance, onboarding, trust/certification and all post-verification branches remain open. Global Root remains `review`; no release Ring is closed and production readiness is not claimed.

## 2026-08-24 — contextual nearby surface and contained idle globe

Commit `d3a550f` is deployed on the canonical production alias through the configured Manus Vercel connector as deployment `dpl_8ZsUTb7Gv1ckgzNh5QirUbfe7MN2`, confirmed `READY` with the expected 12-function runtime shape. In the six-viewport Playwright audit (`320×760`, `375×812`, `768×900`, `1280×900`, `1731×818`, `375×620`), every idle state had no `.nearby-sheet` in the DOM, a visible `Rechercher` submit action, a full viewport map stage/canvas, zero horizontal overflow, zero idle dock/sheet/control/topbar overlap, and zoom `1.35 → 2.35 → 1.35` through the native map controls.

The authenticated Browser Sandbox proof at approximately `1024×880` then opened the nearby surface only after `Rechercher`. The loading sheet measured `163.3px` high, the dock-to-sheet gap was `14px`, the stage and canvas both filled `1024×880`, and dock/sheet, sheet/control and topbar/control overlap checks were false. Activating `Replier les facilités proches` removed the sheet from the DOM and restored the compact idle globe/dock state. The live run remained in truthful loading because catalogue discovery did not settle during the observation; this is layout and state proof, not remote tile/API reliability proof.

The anonymous Playwright path correctly opened the official Auth surface instead of fabricating a nearby result (`authPresent: true`, nearby sheet absent), and the audit closed that surface before zoom checks. No credentials were entered and no protected Buyer/Seller write or persistent mutation was made. Motion is intended to pause while contextual surfaces are open; a dedicated longitude-delta capture for Options/J5/sheet pause remains a residual proof item.

This closes the focused contextual idle/globe layout checkpoint as **partial/verified for the stated evidence**, not the Buyer Heartwood or global Canopy gate. Seller all-width/focus proof, exact/approximate location success, interrupted-session/concurrency recovery, remote raster reliability, full catalogue-result reveal, onboarding/trust, QR/payment/transaction and release certification remain open. Global Root stays `review`; production readiness is not claimed.


## 2026-08-24 — Root runtime alignment, reviewer queue and Inbox Omni

The field-pilot migration was aligned with the persistent Neon V2 branch actually bound to the Vercel runtime. The previous `/api/v2/public/facilities` runtime failure was diagnosed as a missing Ring A relation on the wrong database target; after applying the additive migration to persistent V2, aggregate verification passed with five Root tables, nullable public facility ownership, the active-claim guard, three V2 accounts and four V2 facilities unchanged. The canonical field-pilot surface now resolves to the expected authorization boundary rather than a generic service error.

The deployed Trunk now exposes `Inbox Omni` and `Revue des claims` through the J5 account owner. Reviewer decisions are server-authoritative, reason-bounded, claimant clicks never certify a facility, and a review outcome queues a deduplicated in-app event for the claimant. The authenticated Browser Sandbox proof opened both contextual sheets on the canonical deployment: Inbox showed the truthful empty state and PWA opt-in boundary; Review showed the truthful `Rôle reviewer non ouvert` state for the current session. The MapLibre globe remained mounted behind both sheets and no claim, import, review, notification or Auth mutation was performed.

This is a **partial Root/Trunk checkpoint**, not a Heartwood closure. Team-role assignment, evidence capture and private storage, an authorized reviewer decision, OSM source refresh/import proof, Web Push permission/service-worker delivery, full keyboard/focus/responsive certification, onboarding/trust, catalogue publication, availability, transaction, QR, payment and fulfilment remain open. Global Root remains `review`; no production-readiness claim is made.


## 2026-08-24 — Claim Heartwood and fresh deployment checkpoint

Production deployment `dpl_3bWyJ4ArKKYmAfXBwi6JxHRwBxxw` reached `READY`, retained the canonical aliases and reported `lambdaRuntimeStats` with exactly 12 Node.js functions. The fresh canonical browser proof showed the stable globe, map canvas, public cluster/pin continuity, separated dock and existing bounded facility detail. A public API read identified the bounded public candidate `Marche de Hanoukope` as `unclaimed`; no claim, import, availability, review or Auth mutation was made.

The field-pilot Trunk now has versioned claim drafts, claimant-owned pre-review cancellation, typed evidence validation, an honest `EVIDENCE_STORAGE_UNAVAILABLE` boundary, reviewer evidence count/categories without private object keys, in-app delivery creation and `certified → unconfirmed` facility mapping. The UI presents a contextual claim sheet with an explicit disabled private-evidence submit state rather than simulating upload. This is a **partial Heartwood checkpoint**: the private storage adapter, actual evidence upload, submit, active-role happy path, reviewer decision and end-to-end notification proof remain open. Global Root remains `review`; no production-readiness claim is made.


## 2026-08-24 — GitHub-linked release and reversible claim/storage proof

The validated claim UUID correction was pushed to `am-n-ra/lome-local-connect` on branch `omni-v2-rebuild`, which is the repository branch linked to the Vercel project. The canonical alias then served the corrected route: the bounded public fixture `Marche de Hanoukope` opened a real version-1 claim draft instead of returning `Choose a valid facility`. The response headers confirmed a live Vercel-served page (`HTTP 200`, `server: Vercel`, `x-vercel-cache: MISS`); the Vercel connector itself was unavailable for direct deployment-ID polling during this verification window, so exact GitHub-triggered deployment metadata is not asserted here.

The owner-authorized single test draft opened the Claim Heartwood sheet and showed six typed private evidence categories plus `Preuves privées, statut séparé`, proving the runtime recognized private storage as available without exposing a token. No file was selected or uploaded; the submit action stayed disabled with an empty evidence list. The draft was immediately cancelled, and the facility returned to `Lieu public · non revendiqué`. This proves the corrected draft → storage-status → reversible-cancel boundary only. It does not prove private upload, provider metadata verification, claim submit, reviewer read/decision, inbox delivery, role bootstrap, OSM import or pilot readiness. Global Root remains `review`.

## 2026-08-24 — bounded private upload and claim submission proof

A single owner-authorized non-sensitive JPEG attachment was inspected as a tall image and used only as a storage/provider test artifact. It is a manga/web-comic screenshot, unrelated to facility identity or ownership; it must not be interpreted as substantive claim evidence. The first live upload attempt exposed a protocol defect: the claim-upload route nested the Vercel Blob `clientToken` inside Omni’s generic envelope, so the client reported missing Blob credentials even though the provider-ready status was true.

The protocol was corrected in commit `cfbd3da` and deployed through the GitHub-linked Vercel path as `dpl_HCr8LaWg3n1LJFycmTYE7qRdSGUP`, `READY`, source `git`, ref `omni-v2-rebuild`, with exactly 12 Node.js functions. A second bounded resume defect was then identified after the failed attempt left the authorized draft in the internal `verification_draft` facility state: public discovery exposed that internal state and the facility sheet suppressed the resume action. Commit `973b6bc` normalized internal pre-review states to public `unclaimed` semantics and added a regression test. It deployed through the same GitHub path as `dpl_82TxYc43dCHQAEV29CKwbHXDLKVr`, `READY`, ref `omni-v2-rebuild`, with exactly 12 Node.js functions.

On the refreshed canonical deployment, the existing draft was reopened without creating another facility. The one attached JPEG uploaded successfully to the first typed category, `Identité du représentant`; the UI showed `1 fichier privé ajouté` and `Référence privée vérifiable par Omni`. After the owner’s point-of-action confirmation, the claim submission completed and the UI displayed `Claim soumis. La file reviewer Omni vérifiera les preuves avant toute évolution du statut.`

Aggregate verification on persistent Neon branch `omni-v2-rebuild` confirmed one submitted request and one persisted evidence object for `Marche de Hanoukope`, with facility state `verification_submitted`. The submit path’s successful completion is evidence that the server-side private object verification gate passed before insertion. No reviewer event or in-app delivery was created because the current session has no active `reviewer` role; no role was granted and no review decision was attempted. Private GET/read, reviewer authorization, reviewer download, reviewer decision, retention/reconciliation and notification delivery remain unproven. The submitted test claim is intentionally retained as historical/auditable data; it is not a certification or marketplace claim. Global Root remains `review`; production readiness is not claimed.


## 2026-08-24 — Canopy globe and search reveal checkpoint

The Buyer Canopy pass is now materially evidenced but remains partial. On the canonical READY deployment `dpl_B46QuQiAxUWnqymZ5HPtdmBVNBMA` for commit `bc8e730`, the authenticated query `Marche de Hanoukope` visibly moved from query loading to one ready public result, then through a bounded camera reveal with `Le continent`, `Le pays`, `La région`, `La ville` and `Facilités trouvées` stages. Zoom progressed `1.35→1.85→2.75→3.80→5.25→6.20`; final result framing kept the map mounted and the single public facility pin visible. Post-reveal Zoom avant moved `6.20→7.20` with the result card retained. The request cadence check showed one viewport-bounds request and one query-only request, with no continuous rotation/bounds loop.

Normal-motion and reduced-motion public Playwright runs at `390×844` prove idle rotation or intentional reduced-motion pause, full canvas geometry, enabled named controls, zoom `1.35→2.35`, contained guest dock and no horizontal overflow. One authenticated wide viewport focus check moved Tab to `Utiliser ma localisation` with a visible outline. A temporary bounded geolocation stub proved the distinct accessible marker path and was restored immediately; no real location permission or coordinates were requested.

The Heartwood ring remains **partial**. Authenticated compact result-sheet, Seller/Reviewer responsive/focus proof, full keyboard traversal, real permission/denied-retry/approximate-location states, empty/error/retry, facility focus/back restoration, interrupted-session/concurrency, remote tile resilience and broader production/release evidence remain open. No business mutation was performed in this Canopy pass; Global Root remains `review`.


## 2026-08-24 — Canopy V3 re-entry and availability boundary

The production Canopy V3 pass materially strengthens the Buyer arrival without changing the availability API. The canonical READY deployment `dpl_4h49A7jHsfgvddme6qwohw9VsC3x` for commit `60403a3` proves the darker clean-edge map, density-only discovery rings, native drag/pan/rotate/zoom, retained manual camera position with delayed idle resume, globe→mercator local zoom, query-only global search, identical-query loading→ready recovery, result `Nouvelle recherche`/`Affiner`/`Retour à la carte`, desktop `1024×880` geometry with a 14px dock-sheet gap, and compact `390×844` normal/reduced-motion spacing and control behavior.

A temporary production context with synthetic coordinates proved the granted location UI: `location=exact`, one accessible `Votre position sur la carte` marker, and a separate public cluster. The persistent authenticated Sandbox path proved honest `location=denied`/timeout copy with `Réessayer`; neither path persisted personal coordinates. These outcomes strengthen the location row from marker-path-only evidence to bounded granted/denied proof, but they are not proof of the owner’s real browser permission prompt or of remote raster reliability.

The second same-query replay exposed and then fixed a React lifecycle defect in which a repeated value could set loading without rerunning the effect. `searchRevealRevision` is now part of the relevant effect dependencies, and production reached the ready public result after identical re-submission. No facility CTA, claim, response, seller action or other business write was used.

### Multi-product availability decision

The Buyer availability sheet continues to accept exactly one `selectedProductId` per request and retains the existing idempotency and response ownership semantics. This slice adds only a truthful planning note in the Product step; it does not persist a multi-select basket, issue multiple requests implicitly, or submit a grouped request. Grouped availability is **blocked / Root/API decision required** until the contract explicitly defines product-set identity, per-product quantities and budgets, batch idempotency, partial success, expiry, response ownership, resume/retry and permission boundaries. Therefore the visual Canopy gate is advanced, while Buyer Heartwood multi-product capability remains unimplemented.

**Updated status:** Buyer Heartwood remains `partial / ring decision pending`. The map/search and responsive proof is materially stronger, but authenticated compact result-sheet/focus recovery, full keyboard/focus, failure/retry and remote-tile evidence remain open; no Ring is closed and Global Root remains `review`.


## 2026-08-24 — Canopy V4 projection and focus checkpoint

Production deployment `dpl_7gg9Rxv5mR9whTgUw42WHCVaMVaQ` for commit `6399b68` is READY on the canonical alias with the expected 12-function Node runtime. The V4 map now uses the existing OpenFreeMap style path with a targeted Canopy palette: dark ocean, light land and stronger boundary contrast. A bidirectional zoom proof recorded `globe` at `1.35`, `mercator` at `3.35`, then `globe` again at `2.35`, with the current camera retained.

The refreshed wide production gesture proof passed free left-drag center change `1.2200→-51.9800`, bearing change `0.00→34.20`, right-button pivot to `-85.80`, and idle resume from that released camera without reset. Facility features are now rendered by the MapLibre GeoJSON source/layers; the DOM contains zero visible `.map-pin` HTML overlays, with only a hidden keyboard fallback list. The result frame reached `mercator` zoom `12.80`, and `Retour à la carte` removed the result/facility sheet, left the dock present and cleared selected-facility mode.

The mobile proof captured a full `390×844` canvas, 16px search input and no horizontal overflow. Its short reduced-motion sequence did not independently reach the projection threshold, so compact authenticated/touch and full pin visual-continuity proof remain open. The location arrival path remains non-centering on mobile and still requires the owner’s direct permission-prompt proof. Multi-product availability remains blocked behind a Root/API contract; the single-product request and idempotency semantics are unchanged.

**Buyer Heartwood status:** `partial / V4 Canopy evidence materially advanced; ring decision pending`. No availability write, facility claim, seller response, reviewer decision or other business mutation was performed in this checkpoint.

## 2026-08-25 — Canopy V4.1 monochrome implementation checkpoint

The owner clarified that the intended map is the existing white/black/gray reference, not the green-toned Canopy palette. The implementation now targets white map/background, near-black ocean, light land, charcoal/gray boundaries, neutral roads/labels and no decorative colored selection halo. The V4.1 camera policy keeps idle motion running through search/options/Auth focus, J5 and non-map navigation; only direct map interaction, native map-feature actions and explicit map controls may pause it. Primary globe drag uses a tested vertical-axis helper with responsive longitude/latitude movement, zero pitch and no primary bearing drift. Minus, plus and explicit recenter are always rendered together.

The visible approximate-zone prompt is replaced by a screen-reader-only location status. Automatic location remains permission-aware, in-memory and non-recentering; explicit recenter remains available. The fallback style now matches the monochrome direction honestly, and native facility source/layers remain the only visible pin renderer.

The V4.1 source baseline now passes `git diff --check`, **122 tests across 18 files**, TypeScript/Vite build, `check:boundary`, and exact 12-function bundling. Bounded local browser proof at `390×844` confirms three visible controls, 16px mobile input sizing, `visualViewport.scale=1`, no visible approximate-location band, screen-reader location status, zero visible HTML pins, idle continuity through search/Options/account focus, reversible projection (`2.35 globe → 3.35 mercator → 2.35 globe → 1.35 globe`) and synthetic touch camera movement with unchanged bearing. Bounded local proof at `1024×880` confirms idle globe movement, vertical-axis drag with retained center and bearing, and idle resume after leaving the map.

The canonical V4.1 deployment `dpl_2A1htHsJkwkdsSXWLK92xABYLrAQ` is READY for commit `792c858`, with the canonical aliases and exactly 12 Node functions. The live read-only smoke check confirmed `globe / 1.35 / rotating` → `mercator / 4.35 / paused` → `globe / 2.35 / paused`, center retention, `basemap=monochrome` and the three permanent controls.

This remains a partial checkpoint. A real iOS/Android input/gesture check, owner-browser permission proof, source-backed pins during a real result movement, the authenticated compact Buyer/Seller/Reviewer matrix, full keyboard/focus proof and remote-tile/performance review remain open. Multi-product availability remains `blocked / Root/API decision required`; no business mutation was performed.


## 2026-08-25 — Canopy V4.2 reference-globe checkpoint

The Buyer map visual was reconciled with the owner-provided Africa-globe reference. The implementation keeps the real Liberty/OpenFreeMap path, uses the existing Natural Earth globe silhouette with globe-only grayscale/inversion/brightness treatment, and preserves a white application field. Local settled screenshots at `390×844` and `1024×880` show a visible near-black ocean, light land, restrained relief, no green/sepia wash, no heavy selected-region halo and no permanent `Votre position` chip. The neutral user marker remains in-map and non-obstructive.

The reveal helper now protects the reference progression with zoom stages `1.05 → 2.15 → 5.35 → 8.25 → 11.25 → 14.2`, crossing the `2.4` globe/mercator threshold before local result framing. The same local proof confirms the three permanent map controls, 16px mobile text input, default viewport scale, no visible approximate-location band, direct-map-only rotation ownership, vertical-axis drag, idle resume outside the map, reversible projection and zero visible HTML pin overlays.

This is **bounded local visual/runtime evidence**, not a full Heartwood closure. The actual local geographic silhouette is raster-derived at globe scale; source-backed vector roads/boundaries and native facility pins during a real result movement still require inspection after reveal. Device-native touch/input zoom, real owner permission, authenticated compact/focus/recovery, keyboard traversal and remote-tile/performance evidence remain open. The mono-product availability contract and all business mutation boundaries are unchanged.


## 2026-08-25 — Canopy V4.2 canonical smoke checkpoint

Deployment `dpl_8UondDSFQHjPKmdu8dY1GZajpV2a` for commit `381756d4` is READY on `omni-v2-rebuild`, serves `omni.sparkafrika.online`, and reports exactly 12 Node functions. The canonical read-only arrival frame confirms `Carte active`, white outer field, near-black globe/ocean, light land/Africa, permanent minus/plus/recenter controls and no heavy region highlight or literal `Votre position` chip. Plus then minus reversed the globe framing.

The query-only `Marche de Hanoukope` path reached a real result sheet with `Le monde`, `Résultats pour « Marche de Hanoukope »`, `Nouvelle recherche`, `Affiner`, `Retour à la carte`, one public card and an uninvoked `Voir le lieu`. No business mutation was made. Two successive settled final frames then showed a blank white map canvas at mercator zoom `12.80` beneath the still-mounted result shell; the direct controller requested Natural Earth raster resources but did not provide visually proven vector roads/boundaries or native result-pin movement. A local direct-vector-template/style-transform experiment produced no PBF requests and was reverted.

**Buyer Heartwood status:** `partial / V4.2 deployed, visual reference materially advanced, final progressive reveal not accepted`. The next gated work is a verified MapLibre source-loading correction followed by real-result streets/boundaries, native pin movement, device-native touch/input proof, authenticated compact focus/recovery and remote-tile/performance review. The mono-product availability contract remains unchanged; multi-product remains Root/API-blocked.


## 2026-08-25 — Canopy V4.3 vector-globe checkpoint

The latest owner reference is now represented by a loaded Positron-style vector globe rather than the previous raster treatment. The Vite-managed same-origin MapLibre worker allows the actual Omni controller to reach `load/idle`, load public glyph/PBF resources and render the Africa-facing globe with white field, dark ocean, light continents and fine geographic contours. The CSS inversion and Liberty Natural Earth assumptions were removed; no synthetic fallback request is made.

The compact and desktop settled local frames preserve the Buyer map contract: permanent minus/plus/recenter controls, no visible location chip or approximate band, map-only rotation ownership, released-camera drag/resume, no visible HTML pin overlays, and separated bottom dock. Manual Plus at zoom `3.35` keeps Positron vector geography visible after the globe→mercator transition. The reveal helper now uses an explicitly authorized user position for the early context stages when present, then uses the result/user envelope for final framing.

**Buyer Heartwood status:** `partial / V4.3 canonical map and bounded result reveal proven; ring decision pending`. Commit `2cab2d8` is deployed READY as `dpl_62FQ6GnjqnTMbJsMpbW1cya6sa41` with canonical alias `omni.sparkafrika.online` and exactly 12 Node functions. The canonical read-only query `Marche de Hanoukope` settled to a local Lome/Aflao frame with Positron streets, neighbourhood labels, boundaries/coastline and a geographically anchored native point; `Voir le lieu` remained unopened. Authenticated compact focus/recovery, device-native touch/input zoom, owner permission UX, remote performance and broader density remain open. No availability, claim, Seller, Reviewer, transaction, payment, QR, OSM or multi-product mutation occurred; the mono-product contract is unchanged.

## 2026-08-25 — Buyer Canopy motion recovery checkpoint

**Status:** `partial / bounded Buyer map motion proof verified; Buyer Trunk and Species gates remain open`.

**Changed:** The map controller now recognizes pointer ownership by event target when an overlay is under the cursor. The desktop proof leaves through the search input overlay, matching the map-first contract without treating the full-screen canvas bounds as the entire interaction surface.

**Proven:** Local 1024×880 desktop proof passed idle rotation, direct globe drag, center change, vertical-axis preservation, released position retention and rotation restart outside the map. Local 390×844 mobile proof remained green for touch, reversible globe/mercator projection, controls, 16px input and non-map focus/options/account ownership. Canonical read-only proof on `dpl_GetKcB8WL2b4A8d8iauCRJ8SKSp1` / commit `6711151` confirmed the same released-center hold and stable rotation after pointer movement to the search dock. Full source validation passed at 127 tests/19 files, build, boundary check and 12-function bundle.

**Not proven:** This is not proof of availability, claim, facility detail, contact, Seller response, Reviewer decision, dense multi-pin behavior, real-device permission/touch/input, complete accessibility or remote performance. No Buyer business write or CTA was invoked.

**Preserved:** Auth session hydration, public search/reveal, mono-product contract, user data, Auth identities, historical records, claims and server ownership boundaries remain unchanged.

**Deployment:** GitHub commit `6711151` on `omni-v2-rebuild` is deployed READY as `dpl_GetKcB8WL2b4A8d8iauCRJ8SKSp1`; canonical alias `omni.sparkafrika.online` is present and the existing 12 Node functions remain intact.

**Next gate:** Complete dense native-pin movement and the remaining authenticated Buyer focus/recovery, real-device and performance evidence before any Trunk/Species acceptance. Multi-product remains Root/API-blocked.

## 2026-08-25 — Buyer native-layer movement checkpoint

**Status:** `partial / bounded native map rendering proven; Buyer Heartwood and Species gates remain open`.

**Changed:** No Buyer business logic changed. The existing public result source/layers were inspected read-only through the authenticated session.

**Proven:** The initial public frame rendered a native cluster and the safe `Marche de Hanoukope` result rendered a native `omni-pins` feature. Reversible small camera moves changed the projected screen position while preserving feature count and restored the original view. The HTML pin fallback remained visually hidden. Local responsive proofs and the 127-test validation baseline remain green.

**Not proven:** This does not prove dense multi-pin movement, availability or claims, facility detail, real-device behavior, full accessibility, long-run performance or complete recovery. No CTA, write, seller, reviewer or transaction path was used.

**Preserved:** Auth hydration, search/reveal state machine, mono-product contract, users, identities, historical rows and server ownership boundaries remain unchanged.

**Deployment:** The proof ran on canonical READY deployment `dpl_Czq84yAUzdHpjur3w6ehb6ZunKwk` for the `omni-v2-rebuild` line, with `omni.sparkafrika.online` and 12 functions; application behavior is from code commit `6711151`.

**Next gate:** Keep Buyer Heartwood partial and continue with multi-feature native observation only if existing bounded data can support it; otherwise proceed to real-device and accessibility proof without inventing density.

## 2026-08-25 — Buyer keyboard and recovery checkpoint

**Status:** `partial / bounded keyboard, focus and read-only recovery proof verified`.

**Changed:** No Buyer source or server logic changed. The authenticated canonical shell was tested only through menu, options, keyboard and read-only request-history surfaces.

**Proven:** Account-menu focus remained inside the ARIA menu and reached the first read-only menuitem by Tab. Enter opened `Mes demandes`; Escape closed it, restored the active map and left no focus in the removed sheet. Search options opened with separated geometry and Escape restored the dock without applying a filter. The compact reduced-motion contract and existing mobile/desktop proofs remain green; full source validation remains 127 tests/19 files and 12 functions.

**Not proven:** Real-device accessibility, screen-reader output, permission prompts, dense result coverage, complete recovery across every Buyer branch and any availability/claim write remain unproven. No CTA or mutation was used.

**Preserved:** Auth hydration, search/reveal, read-only ownership, historical data and the mono-product boundary remain intact.

**Deployment:** Proof ran on READY canonical `dpl_FELsPP7PgX6UEzFHesgzwa74p5eV`, commit `9f31dc3`, alias `omni.sparkafrika.online`, 12 functions.

**Next gate:** Continue with device-native input/permission and accessibility/performance evidence before any Buyer Heartwood or Species acceptance.

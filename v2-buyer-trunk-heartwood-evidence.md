# Buyer Trunk — Heartwood evidence matrix

**Status:** `partial / ring decision pending`

**Scope:** Buyer Heartwood hardening for the approved map-first Trunk slice. This matrix records what is evidenced, what is covered by automated checks, and what remains manual or dependent on Seller work. It does not close the global Root, and it does not represent demo fixtures as marketplace activity.

## Acceptance matrix

| Heartwood concern | Evidence / coverage | Status | Owner / next proof |
|---|---|---:|---|
| Permanent map-first arrival | Canonical URL renders the map stage, Buyer/Seller switch, J5 account control, search dock, result sheet and facility cards. | `proved` | Keep as Buyer arrival baseline. |
| Remote map and honest fallback | `TrunkMap.tsx` uses a real OpenStreetMap raster source and switches to `/omni-local-style.json` on load/error timeout. Canonical browser observation displayed `Carte en mode de secours`, not a false `Carte active`. | `partial` | Recheck remote tile availability in a later visual pass; fallback honesty is proved. |
| Resting globe / reduced motion | Globe projection and idle rotation are implemented; reduced motion disables rotation. No dedicated canonical motion capture or media-query run has been recorded in this pass. | `partial` | Manual visual check at normal and reduced-motion settings. |
| Map controls and location request | Canonical surface exposes `Zoom avant` and `Utiliser ma localisation`; code includes zoom-out disclosure, recenter/ease-to behavior, permission-denied/unavailable copy and retry. | `partial` | Browser-prove plus → zoom-out, location prompt and denied/retry without claiming a precise location. |
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
| Actual response-card comparison | Response-card renderer is implemented for facility/product/status/quantity/price/message/time/freshness and keeps intent locked. No authorized Seller response has yet been browser-created, so no real card is evidenced. | `not yet proved` | Requires Seller Trunk plus one approved bounded demo Seller response. |
| Back / Escape / close | Availability header now returns one step at a time for stages 2–3 and closes to facility from stages 1/4. Existing global Escape/close handling is present. No full browser path has been captured after the change. | `code-proved` | Browser-check stage 3 → 2 → 1 and Escape/close context restoration. |
| Session interruption / refresh resume | Server-backed J5 `Mes demandes` now lists the authenticated Buyer’s own request summaries and can reopen facility/catalogue context by request ID; canonical empty-state proof is recorded, while non-empty resume and interrupted-session proof remain open. | `partial` | Reopen the Buyer identity that owns the bounded request, then prove non-empty resume and response comparison. |
| Responsive layout | CSS contains mobile/desktop sheet and safe-area rules. Canonical screenshot shows separated dock and result sheet at the current viewport; 320/375/768/1280 runs are not formally recorded. | `partial` | Capture those four viewport widths and check for overlap/focus reachability. |
| Keyboard / focus | Native buttons, labels, dialog semantics and live/alert regions are present. A keyboard-only pass and focus-trap review are not recorded. | `partial` | Run Tab/Shift+Tab/Escape inspection on the canonical surface. |
| Accessibility announcements | Map status uses `aria-live`; location prompt uses status/group semantics; response errors use `role=alert`; dialogs expose labels. Automated a11y scan is not configured. | `partial` | Manual screen-reader/keyboard review or add supported automated assertions. |

## Ring decision

Buyer Trunk is **implemented and materially evidenced but not fully Heartwood-proven**. The map-first public path, official Auth-backed availability write, corrected buyer-owned response read, pending/no-response state, locked pre-intent boundary and navigation hardening are in place. The honest remaining blockers are formal responsive/accessibility/recovery checks and a real authorized Seller response for an actual comparison-card proof. Global Root remains `review`; Seller, QR, payment, camera, transaction and production-readiness claims remain closed.

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

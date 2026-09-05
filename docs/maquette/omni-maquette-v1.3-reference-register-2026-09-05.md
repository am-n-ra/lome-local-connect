# Register maquette — Omni V1.3 (mouvement, recherche & onboarding)

| Champ | Valeur |
|---|---|
| ID artefact | `HO-OMNI-05-V1.3` |
| Fourni par | Fondateur (dispatch founder, 2026-09-05( |
| Statut | **Accepté comme référence visuelle UI** (successeur du maquette unifiée V1.1 pour les comportements mouvement/recherche/onboarding( |
| Source | HTML maquette maître V1.3 (carte réelle MapLibre GL JS( + spec `omni-v1.3-ui-motion-search-onboarding-spec-2026-09-05.md` |
| Emplacement référence | Fichier HTML fourni dans la conversation (Dispatch HO-OMNI-05(; spec comportementale committée ici |
| Nature | Évolution du maquette unifiée acceptée — mêmes tokens visuels, ajout : carte vectorielle réelle, séquence cinématique, gating onboarding, micro-copies d'état. |

## Tokens visuels extraits(inchangés depuis V1.1(

- Encre __ub0f0f0f__, Blanc, Panneau __ubf6f6f4__, Ligne __ube8e8e6__.
- Accent unique __ub2E8B6F__ all"=" En stock / Vérifié "" ; Accent-soft __ubEEF4F1__.
- Ambulant warn __ub8A6D1F__ / warn-soft __ubF6F0DF__.
- Pill dock : fond __ub111__, boutons 40px, centre 46px. Cartes : arrondis 16px, hauteur carte 66px, visuels 13px. Sheets : radius 24px haut, ombre `0 -14px 44px rgba(0,0,0,.16(`, padding `10px 15px 92px`.

## Écrans couverts par le HTML V1.3

- Carte MapLibre réelle(markers DOM, apparition échelonnée(, countmark 206, controls +/−, compas, rolepill.
- SEARCH (dock contraintes, chips, démo scénarios(, RESULTS (grille h, synchro bidirectionnelle(, FACILITY (3 variantes buyer/unclaimed/mobile + admin(, AVAIL, BULK, PENDING, ARESULT, COMPARE, INTENT, TXN (track + chat(, QR(, MENU, BUYERHOME, WALLET, PLANS, PAYMENT, SAVED, ACCOUNT (à reconsidérer — feedback fondateur(, ONBOARD (3 étapes(, SELLER, COMPANY, PRODUCTS, STOCKEVENT, OFFERS, ADMIN.

## Moteurs extraits du HTML (à retrouver/aligner dans le code(

- `runSearchSequence()` : pave A tilt/rotate → pave B `flyTo`+`curve:1.7`+`cameraForBounds`+padding → pave C reveal markers stagger 50ms → sheet APRÈS.
- `ROPES`: `ROLES_BY_MODE`, rolepill glissant, `positionIndicator`.
- Dock contextuel `dockFor()` : TXN lock(Annuler/QR/Menu(, menu roles, seller→Stock, équipe→À valider. Gating onboarding : recherche mémorisée → identité minimale → soft paywall → reprise automatique (`obFinish` → `runSearchSequence(`).
- Micro-copies M-01…M-26 (voir spec comportementale(.

## ⚠ Nouveau dans le HTML V1.3 (fourni 2026-09-05, non encore couvert par le register/spec) — **à confirmer par le fondateur**

## Coquille desktop (`body.desktop`, `@media (min-width:1040px)`) — NON implémentée en prod aujourd'hui

Le HTML V1.3 introduit une coquille **desktop** qui n'existe pas dans le code prod actuel (`src/trunk/TrunkApp.tsx` + `src/styles.css` @ ≥900px = sheets bottom-anchored + centrées, map plein écran) :

| Élément | HTML V1.3 (body.desktop) | Code prod actuel (T-10u( | Décision requise |
|---|---|---|---|
| Recherche | **Barre permanente en haut** (left:64px, right:0, top:36px, h:76px, sous chrome fenêtre 36px( | Sheet bottom centrée (`.omni-sheet`, panel search( | NEW desktop pattern |
| Résultats | **Panneau gauche permanent** (left:64px, top:112px, bottom:0, w:346px, `.hgrid` vertical( | Carousel horizontal flottant au-dessus de la carte | NEW desktop pattern |
| Autres sheets | **Tiroir droit docké** (right:0, top:36px, bottom:0, w:min(400px,90vw(, radius 0, shadow gauche( | Bottom-anchored + centré horizontal (`.omni-sheet` `inset:auto 0 0; margin-inline:auto`( | **REVERSAL vs T-10u** (le fondateur avait demandé de corriger « sheet à droite » → centrage; cet HTML remet les sheets à droite SUR DESKTOP UNIQUEMENT( |
| Dock | **Rail latéral gauche** (left:14px, top:64px, bottom:14px, colonne( + `dockmask` masqué | Pill bas centré (`.navpill` bottom:14px( | NEW desktop pattern |
| Rolepill | Haut centre (top:8px( | Haut centre (inchangé( | — |

**Statut :** `review_founder` — cette coquille desktop n'est ni dans le register (mouvement/recherche/onboarding seulement(, ni dans la spec (§ « Ce que ce document ne couvre pas encore » n'en parle pas(, ni dans le code prod. Avant que Nature Way aligne le code desktop dessus, le fondateur doit confirmer que la coquille desktop du HTML V1.3 **remplace** la version bottom-anchored+centrée desktop de T-10u (Gate 5 rouvrirait pour réelignage desktop(.


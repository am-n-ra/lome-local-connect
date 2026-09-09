# Re-audit de cohérence V1 — carte, dock, sheets, switch, pins — lot dettes résiduelles « Go with limits »

> **ID:** `AUDIT-V1-COHERENCE-2026-09-09`
> **Primary authority:** Nature Way ( Gate 6 Canopy/launch-readiness)
> **Founder HQ handoff:** `HO-OMNI-10` ( «fais la liste » + « toutes les sheets doivent être revisées et revues — carte, dock, sheet, switch, pin — tout cohérent, connecté, interconnecté, proactif, auto-guidé, contextuel »)
> **Branch:** `omni-v2-rebuild` — HEAD `82e1114` ( docs reconcile HQ). Code HEAD réel audit = `82e1114` ( aucune modification code par cet audit)

## Resource Receipt

| Statut | Ressource |
|---|---|
| Chargé | `.agents/skills/nature-way/references/execution-controller.md`, `visual-and-logic-coherence-review.md`, `anti-slop-and-debt-review.md`, `autonomous-delivery-gates.md`, `proof-and-decision-ledger.md` |
| Chargé | Master canonique `docs/OMNI_MASTER_PRODUCT_INTERFACE.md` — §0.8.3 + §0.8.4 + annexes normatives A–L |
| Chargé | Maquette référence V1.3 `docs/maquette/omni-species-maquette.html` ( via audits G-06/V-7(; registre V-7 `docs/nature-way/omni-v7-perfection-tracking-2026-09-07.md`; re-audit master `omni-species-reopen-audit-master-v1.3-g02a-revisited-2026-09-07.md` |
| Template instancié | `templates/skills/handoff-receipt.md` → HO-OMNI-10; `templates/intra-skill-plan.md` ( plan VO infra( |
| Non chargé / raison | Preuve navigateur réelle 4 largeurs + caméra/GPS réel ( item `manual`/`partial` per §0.8.4 Evidence boundary(; DB/auth runtime local indispo ( suite locale 329 tests + tsc + boundary seulement(

## Verdict direct

**La coquille V1 est structurellement cohérente** ( un seul canvas carte, un dock contextuel, un rolepill glissant, 25+ sheets étatiques connectées à des routes serveur réelles, pins source-backed( — les 10 contrats « Build now » + bundle D-5 sont livrés et provés. **Mais la révision fondateur demande achèvera la preuve:**  l’inventaire ci-dessous liste **18 dettes résiduelles** ( classe/gravité/propriétaire/déclencheur(, dont **5 nouvelles trouvées par cette passe de cohérence** ( demandes historiques → caméra océan, toggle actif vendeur inerte, bouton admin « Compteur » appelant une API à vide, gating rôle switch vs capabilities serveur, hardcoded « 0,00 $ » dans le stage paiement(.

## Inventaire par surface ( cohérent / partiel / absent(,adossé code:ligne

| Surface | État VS master/maquette | Preuve code ( HEAD `82e1114`( | Trouvailles nouvelles |
|---|---|---|---|
| **Carte/globe** ( one scene, arrival, rotation, projection, boundaries, retry, controls, geoloc, a11y( | ✅ cohérent ( §0.8.3 identité unique(; fallback `index-BJwt4Bc9.js` déjà livré | `TrunkMap.tsx` l.184…; `map-reveal.ts`; `fallback-map.ts` | (1( arrival animé plein ( §0.8.3 « l’arrivée ne lance aucun progressive zoom » ⚠️ divergence assumée — décision fondateur T-10p « carte zoomée au chargement » ( à confirmer or re-verbaliser en dette( |
| **Pins** ( clusters densité, états multimodaux, dim mode, sélection scale, anneau owned( | ✅ cohérent ( palette verrouillée; `unclaimed`/`unconfirmed`/`confirmed` traités; highlight boundary explicite( | `map-pins.ts`; `TrunkMap` addLayers | — |
| **Dock (navpill(** | ✅ cohérent ( cas dock 5; jamais d'icônes fixes; back/cancel explicitement contextuels( | `TrunkAppV13.tsx` l.745…815 | — |
| **Rolepill / switch** | ⚠️ partiel — **gating serveur** | `TrunkAppV13.tsx` l.705…724 | **(2)** « Seller » visible dès qu'une session existe, même sans `capabilities.sellerWorkspace` ( l.707 `base.push('seller')`( → clic = « Espace vendeur non ouvert » 401. Annexe A « ne exposer que les routes fonctionnelles » |
| **Sheets recherche/results** | ✅ cohérent ( champ+contraintes+submit; carte gardée; dim; follow scroll; empty/error/retry( | l.895…965 | — |
| **Sheet facility + CATALOG_READY** | ✅ cohérent ( product-first trié, unclaimed wording, Demander vérification, Voir produits, Cartes( | l.1066…1130; `ProductCatalogueV13.tsx` | — |
| **Sheet flow / AVAIL 4 étapes + TXN room** | ✅ cohérent ( retrait/livraison+note, idempotence, chat transactionnel, QR auto, rating, timeline( | `BuyerFlowV13.tsx` | **(5)** stage paiement: carte « Omni Wallet » = solde **hardcodé « 0,00 $ »** ( l.365( — réel wallet ignoré ( annexe D « une recharge n’est pas un nombre décoratif »( |
| **BULK / COMPARE** | ✅ cohérent ( réels, Pro-gated serveur, sélection produit( | l.964…1060 | — |
| **Menu / Home / Wallet / Plans / Saved / Account** | ✅ cohérent ( réel CRUD/FedaPay/ledger( | l.1187…1515 | **(3)** Home: reprise d’une demande historique → `handlePinSelect({…, latitude:0, longitude:0…)` ( l.1249( → caméra vole vers (0,0( ( golfe de Guinée( au lieu de la facilité ( payload demande sans lat/lng(; **(4)** Account: « Plan » = « Acheteur Free » pour un vendeur ( l.1288( = label statique non-réel( |
| **Seller workspace + reply + scanner + products/offers/company** | ⚠️ partiel | `SellerV13.tsx`; `SellerReplyV13.tsx`; `SellerQrScannerSheet.tsx` | **(6)** toggle « Je suis actif en ce moment → ON/OFF » **inerte** ( l.101…104: aucun onClick, aucun état serveur( ( annexe A priorité état facility(; **(7)** scanner démarre la caméra **dès le montage** ( auto-start; pas de bouton « Autoriser et démarrer la caméra », pas d’état de permission, pas de stop sur visibility-change( ( annexe C; déjà le fallback `Saisir le code` ✅( |
| **Admin console + data company** | ⚠️ partiel | `AdminV13.tsx` | **(8)** bouton « Compteur (voir fiche( » appelle **`correctFacilitySalesCounter({ token:'', facilityId:'',…})`** ( l.165( — mutation serveur à vide( |
| **Auth / Onboard / reprise auto** | ✅ cohérent ( gating réel, PendingAction, reprise exacte( | `OnboardV13.tsx`; `ui-helpers.ts` | — ( mais résidu(2( et reprise facility (0,0( en l.1170( |
| **Claim / preuve** | ✅ cohérent ( draft→kinds→soumission→revue( | l.1414…1490 | — |
| **QR public** | ⚠️ partiel ( fallback ajouté; auto-start même pattern que(7( | `PublicQrScannerSheet.tsx` | partagé(7( |

## Dettes résiduelles — registre explicite pour « Go with limits »

| ID | Classe | Gravité ( H/M/L( | Impact | Correct at source | Propriétaire | Disposition / déclencheur |
|---|---|---|---|---|---|---|
| COH-01 | Logique/UX | M | Reprise demande historique → caméra (0,0( océan + fiche partielle | Ajouter lat/lng au payload `GET /api/v2/buyer/requests`( ou retenir la vue courante sans easeTo; fiche sans saut caméra | Slice buyer | **À corriger V-8a** ( ou dette explicitement acceptée( |
| COH-02 | Logique/Auth | M | Rolepill montre « Seller » sans accès serveur ( 401( | Gater `switchRoles` par `capabilities.sellerWorkspace` ( Rôle serveur vérité( | Slice auth/seller | **À corriger V-8b** |
| COH-03 | Logique/UX | M | Home/saved: reprise sans coordonnées | idem COH-01 | Slice buyer | groupé V-8a |
| COH-04 | Sécurité/UX | H | Scanner caméra auto-start ( pas de « Autoriser » explicite, pas d’état permission, pas de stop sur visibility( ( annexe C « prêt à scanner »( | Bouton « Autoriser et démarrer la caméra » + `PermissionState` + `visibilitychange` stop; garder `Saisir le code` | Slice seller + public QR | **À corriger V-8c** ( preuve caméra réelle reste `partial` §0.8.4( |
| COH-05 | Logique/Données | M | Stage paiement: solde wallet hardcodé 0,00 $ ( annexe D( | Afficher le solde réel depuis `getWalletOverview` ou retirer la carte; label honnête | Slice wallet/flow | **À corriger V-8d** |
| COH-06 | Logique/Données | M | Toggle vendeur « Je suis actif » inerte ( état serveur absent( | Route `POST /seller/facilities/:id/operational-state` déjà existante ( wire au toggle + état réel( | Slice seller | **À corriger V-8e** |
| COH-07 | Logique/UX | M | Label « Plan » statique en Account ( « Acheteur Free » pour vendeur( | Plan réel depuis wallet/caps | Slice wallet/account | **À corriger V-8f** |
| COH-08 | Technique/Sécurité | M | Bouton admin « Compteur » déclenche une mutation à vide( | Ne pas appeler l’API depuis la console; naviguer vers la fiche facility ( volet opérateur( | Slice admin | **À corriger V-8g** |
| Dette précédente ( G-06/V-7(: | | | | | | |
| COH-09 | Outillage | L | Puces démo SIM ( normal/vide/lent/erreur( cachées `display:none` ( jamais en prod( — outillage maquette seulement( | ressortir maquette only | — | `deferred` — non bloquant |
| COH-10 | Sémantique | L | `aria-modal` desktop tiroirs ( dette G-06( | tiroirs desktop reçoivent focus trap sémantique | Slice desktop | **V-8h** ( priorité basse( |
| COH-11 | Data | L | Facilité mobile ( vente ambulante( — pas de données en DB( | données mobiles fixtures | — | `deferred` ( pas de données( |
| COH-12 | Outillage | L | Fraîcheur visuelle flux single-facility ( le bulk/compare l’ont( | freshbar + variantes expired en single flow | Slice buyer | **V-8d** ( groupé( |
| COH-13 | UX | L | Alert placeholder « La facilité n'est pas sur la carte? Créer » ( `alert(`( | vrai parcours création facilité ( V1-Manual( | Slice facility | `deferred` ( déclencheur: fondateur demande création facilité( |
| COH-14 | UX | L | Placeholder bars seller stats compactes minimales ( pas grid back-office ✅( — pas de dette, décision conforme annexe K ( | — | — | Rien ( checklist( |
| COH-15 | Logique | L | Arrivée animée vs §0.8.3 « aucun auto-zoom » ( divergence assumée décision T-10p « carte zoomée »( | ré-verbaliser la décision fondateur; si confirmée, annoter §0.8.3 comme amendée | Founder | `watch` — décision fondateur |
| COH-16 | Sémantique | M | Sheets desktop tiroirs droits ( journey( sans `aria-modal` focus trap ( = COH-10( | idem | Slice desktop | groupé V-8h |
| COH-17 | Data | M | Re-audit G-06 ligne 5: OTP démo non reproduit ( auth réelle ≥ démo — décision D-3(b acceptée( | — | — | Rien ( décision fondateur enregistrée( |
| COH-18 | Preuve | M | Preuve caméra/GPS réelle + spot-check humain 4 largeurs prod ( §0.8.4( | item `manual` Gate 5/6 ( déjà triggeré( | Founder+HQ | **action humaine requise avant verdict final** |

## Preuve ( cette passe(

| Item | Résultat |
|---|---|
| `npm ci` | ✅ ( 52 files/329 tests( |
| `npm test` | ✅ **329/329** ( 52 files( |
| `npx tsc --noEmit` | ✅ clean |
| `npm run check:boundary` | ✅ clean |
| `npm run build` | ✅ build `index-BJwt4Bc9.js` === prod ( déjà vérifié 2026-09-09( ( T-07d ✅( |
| Re-audit code | ✅ aucun code modifié |

## Proposition de mini-slices ( une à la fois, périmètre M-01(

| ID | Slice | Périmètre | Bloque clôture honnête? |
|---|---|---|---|
| V-8a | COH-01+03: reprise demande historique → vraies coordonnées ( serveur payload( + fiche sans saut océan | buyer | Oui ( cohérence carte↔sheet( |
| V-8b | COH-02: role switch gated par capabilities serveur | auth/seller | Oui ( « routes fonctionnelles seulement »( |
| V-8c | COH-04: scanner « Autoriser et démarrer la caméra » + permission state + stop visibility | seller+public QR | Oui ( annexe C; privacy( |
| V-8d | COH-05+12: paiement wallet réel + fraîcheur single-flow | wallet/flow/buyer | Non ( dettes claires( |
| V-8e | COH-06: toggle actif vendeur réel ( op-state route existante( | seller | Non ( état serveur requis mais V1-Manual acceptable( |
| V-8f | COH-07: plan réel en Account | wallet/account | Non |
| V-8g | COH-08: retirer/naviguer le bouton compteur | admin | Non ( le volet opérateur existant couvre( |
| V-8h | COH-10/16: aria-modal desktop honnête | desktop | Non |

## Founder checkpoint

> **Where we are:** Gate  ​6 reste `ready` — le bundle V-7 complet est livré, **18 dettes explicitement listées + triggerées** dans `omni-v8-coherence-audit-V1-2026-09-09.md` ( 5 nouvelles trouvées par cette passe de cohérence(.
> **Why it is next:** Vous avez demandé « toutes les sheets doivent être revisées et revues » — fait: inventaire complet par surface + registre dette. Les trois dettes qui cassent le plus la cohérence carte/dock/sheet/switch/pins = **COH-01 reprise océan, COH-02 switch non gaté, COH-04 caméra auto-start**.
> **What is blocked or deferred:** preuves caméra/GPS réelles + spot-check humain 4 largeurs prod（ = COH-18, `manual`(. Dettes listées ci-dessus restent `open` jusqu'à votre verdict: **corriger (V-8a…h( ou endetter explicitement ( notre recommandation: corriger V-8a、b、c avant « Go with limits 」（ puis endetter le reste listé+triggeré（.
> **What proves the next move:** `npm test` **329/329** ✅, tsc ✅, boundary ✅, build ✅. Un mini-slice pris un à la fois, chacun avec tsc+tests+build+preuve prod hash===build ( guardrail T-07d(. Le verdict fondateur = clôture Gate  ​6 « Go with limits » ou No-go sur dettes choisies.

_Fin de l’audit._
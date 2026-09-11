# NW-14 — Audit des flows + exposition UI ( recherche / contraintes / admin / operator / seller / buyer ( — 2026-09-10

**Statut de travail:** brouillon factuel, nourri par preuves de code ( diff pur de docs, rien modifié en code.
.
.

##  ​1. Les 4 plaintes du fondateur et leur traduction code

| # | Plainte fondateur | Traduction factuelle ( code ( | Sévérité |
|---|---|---|---|---|
| 1 | « l'animation de recherche ne se produit pas » | Le moteur `computeSearchFlight` existe et s'exécute, mais l'effet de reveal exige `mapStatus === 'ready'` (TrunkMap.tsx ~1004(. Or MapLibre échoue en preview/sandbox et réseaux lents → `mapStatus='error'` → **aucun reveal, aucune animation, aucune pins**. Le fallback de la maquette (`fallback-map.ts`, `vdot`/`.cmark`/`.usermarker`, `vdot-reveal`) a été écrit+testé, mais **n'est importé nulle part** — il est orphelin (. | **P0** |
| 2 | « la recherche est efficace le coeur de Omni mais semble négligée » | La recherche est la seule porte d'entrée (real `.searchdock`); mais son fallback et son anti-fragilité ne sont pas câblés; les contours du résultat ( `.cmark` compteur, transport( ne sont visibles que si MapLibre est up; le reste ( `facility` proximité, `saved`( noeuds secondaires( reste derrière des sheets non discoverables( | P0-P1 |
| 3 | « les contraintes des filtres (/ leur UI ne permet pas vraiment de faire l'intention derrière » | Le `LiquidSearchDock` supporte uniquement le filtre **rayon** + texte; les contraintes métier ( dispo-vs-état, création de facilitateurs/entreprises, produits par catégorie, multi-facilités( ne disposent d'aucune UI dédiée; la maquette V1.3 a des chips non implémentés ( sorts, fraîcheur, QTÉ( | P0 ( pour search( / P1 ( pour contraintes catalogue( |
| 4 | « les flows admin/operator/seller/buyer et leur exposition dans l'UI… par exemple les interfaces pour qu'un admin puisse faire d'un user operator… team… » | **Aucune route `team`/`invite`/`member`/`operator-assign` n'existe** dans `src/server/http.ts` ( seuls `operator-import`( batch(, `reviewer-seller-*`(, `admin/role-management`(, `admin/seller-*`( existent(; l'UI `Role` n'a que `'buyer'|'seller'|'admin'|'operator'` en dur en client, et aucun écran de gestion d'équipe. La promote admin A5 ( gestion rôles( (acceptée en maquette( n'est pas en prod( | **P1-P2** |

##  ​2. Preuves de code ( relais

- `TrunkMap.tsx`: `revealKey` → `computeSearchFlight(facilities, userPosition)` — puis `if (mapStatus !== 'ready') return` (ligne ~1004(.
- `TrunkMap.tsx` initialisation: `new Map({ style: styleChoiceFor(initialBasemap(…).url })` — aucun `createFallbackMap` nulle part ( `/src/` grep ne montre que le fichier `fallback-map.ts` et ses tests(.
- `src/server/http.ts`: routes actuelles par famille —
  - `public/facilities` ( browse, `action=operator-import`(, `action=operator-import-batch`(, `operator=runs`(, `reviewer=queue`(, `inbox=1`(
  - `facilities/:id` ( detail,, `action=claim*`(  ,`action=review`(, `reviewer-seller-suspension`(, `reviewer-seller-activation`(, `notification-seen`(
  - `admin/*` ( `role-management`, `console`, `audit-events`, `facilities/:id/operational-state`, `facilities/:id/sales-counter`, `seller-activations`, `seller-accounts/:id`, `reconcile-recharges`(
  - `seller/*` ( `catalogue`, `availability-requests`, `demo-rebind`(,
  - `wallet/*`(, `transaction-*`(, `qr-*`(, `availability-responses`(, `availability-requests`(, `purchase-intents`(, `external-payment-*`((
- **Absents:** team, invite, membre, rôles de facility, opérateur affecté à zone ( aucune route `operator/`(, `teams/`(, `admin/operator`(, `admin/team`(,( — `operator-import` publique et `reviewer-*` sont des chemins de pilotage, pas de gestion d'équipe réelle(.(

##  ​3. Axes de refonte priorisés et tranches proposées

### P0 — Redresser la recherche ( coeur Omni(

| ID | Tranche | Contenu | Bloque |
|---|---|---|---|---|
| P0-A | Câbler `createFallbackMap` | Quand MapLibre init/charge échoue ou tuiles indispo → basculer vers le fallback DOM ( `vdot`/`.cmark`/`.usermarker`, `vdot-reveal`(, avec `setMapStatus('ready')` pour que `computeSearchFlight`+stagger+paliers s'exécutent dessus. | #1 + #2 |
| P0-B | Cinématique de recherche complète | Rejouer la chorégraphie: monde→continent→pays→région→ville→cadrage ( `labelForZoom`(, stagger pins 3 vagues, countmark, en fallback comme en MapLibre. | #1 |
| P0-C | Chips de contraintes réels | Porte l'intention des filtres: pti scope rayon ( 1/5/10/25/100/0(,( + chips de contraintes métier ( dispo-vs-état, type facility, produits dispo( par rôle. | #3 |

###P1 — Entrée vendeur réelle ( fait de la seller sheet(

| ID | Tranche | Contenu | Bloque |
|---|---|---|---|---|
| P1-A | NW-13c — Création de facilité serveur+UI | Formulaire minimal: 3 types ( fixe/mobile/digital(,( zone/rayon mobile(, digital sans point; trust `unconfirmed`; puis parcours preuve. | D-B, D-F, D-J partiel |
|P1-B | NW-13d — Crédits bulk ( acheteur(: 3 crédits/mois Free,, **Pro = base mensuelle ≈ 100 crédits/mois** ( 1 besoin =1 bulk(,, comptage serveur: chaque demande à N facilités consomme une quantité; surplus rachetable en packs. | D-G |
| P1-C | NW-13e — Bonus confiance | `seller_unlocks` + `pro_test_credit`, après 3 ventes QR à users distincts. | D-H |
| P1-D | NW-13g — Renouvellement Pro auto | Wallet auto-renouvellement + opt-out + rappel. | D-I |

###P2 — Gouvernance admin/operator/team ( faire d'un user operator / team(

| ID | Tranche | Contenu | Bloque |
|---|---|---|---|---|
| P2-A | Route+référentiel teams/rôles | Table v2 `teams` + `team_members`, routes `admin/teams` CRUD, invite par email, rôle `operator` par team. | A5 maquette |
| P2-B | UI de gestion d'équipe | Écran admin « Équipe »: inviter un user en operator/admin, assigner une zone ( opérateur terrain(, liste des membres, révoquer. | A5 |
| P2-C | Opérateur exposé en UI | L'operator voit sa zone ( file de revue, run d'import(, pas la console admin complète. | R-03, maquette |

##  ​4. Ordre de validation — **validé fondateur 2026-09-11**

1. ✅ **P0-A → P0-C** validé en priorité( la recherche est le coeur(,( et c’est un bug réel de prod ( pas une amélioration(( — lancer la tranche P0.
2. ✅ **P1** validé( ordre **NW-13c→13d→13e→13g**( ( vs la spec NW-13b déssignait NW-13c…j; ici on intercale rien, on confirme l’ordre produit((
3. ✅ **P2-A..C** cadré( gouvernance(,( — nouveau socle serveur tables+routes( + UI( — à planifier après P1? ou en parallèle si fondateur veut(,( — la promo A5 « gestion rôles » l’exige(.((
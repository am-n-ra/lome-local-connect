# GUIDE-1c — le guide ne s'arrête plus au dock (2026-10-15)

**Gate :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`). **Branche :** `omni-v2-rebuild`.
**Commit :** `091104e`. **Plan :** `intra-skill-plan-NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01.md`.

## Les 4 sujets du fondateur, mesurés

Le fondateur a posé **quatre sujets distincts**. Réponse mesurée, pas supposée :

| Sujet | Vérité mesurée | Statut |
|---|---|---|
| Guide **une seule fois**, option ensuite | Accueil (`WelcomeV13`, 5 étapes) montré **seulement après CRÉATION**, jamais à la connexion. « Comment ça marche » **toujours** dans le menu (même sans compte). Spotlight carte une fois (`omni-map-guide-seen`). **Pas de drapeau « accueil déjà vu »** → recréer un compte revoit l'accueil. | **PARTIEL** → décision |
| Guide **ne s'arrête pas au dock** | **BUG RÉEL, corrigé ici.** | **CORRIGÉ** |
| **Reprise PWA** (sort/revient sans fermer) | `nav-state.ts` persiste `{role, sheet, selectedId, selVisitId}` (localStorage). **Deux trous** : le guide n'est pas restaurable ; pas de reprise « recherche/flow en cours ». | **PARTIEL** → décision |
| **Manifestation notification** | Web Push réel, contenu FR par étape ; **aucun `sound`/`vibrate`** → son **du système**. | **RÉPONSE** |

## Le bug (mesuré, 390×844)

Le spotlight carte (`MapSpotlightV13`) met en évidence, à la **3ᵉ et dernière étape**, le
**dock de navigation**. Sa bulle était placée **sous** l'anneau : `top = ring.bottom + 10`.

Or le dock est **collé au bas de l'écran** (`bottom: 14px`) : l'anneau va de `766` à `836`, la
bulle tombait à **`840px`** sur un écran de **`844px`** → **4 px visibles sur 128**.
`cardOffscreenBottom: true` ; **« Terminer » et « Passer » inaccessibles**. Le guide
**s'arrêtait en route au dock** — exactement le mot du fondateur. Les étapes 1 et 2 (anneau en
haut) étaient correctes.

## Le correctif

`src/trunk/spotlight-placement.ts` — helper **pur** `placeSpotlightCard` : la bulle va **sous**
l'anneau si ça tient, sinon **au-dessus**, sinon **ancrée en bas** ; toujours bornée à la
fenêtre. La hauteur de la bulle est **mesurée** (`cardRef`), jamais supposée.

**Preuve navigateur (rejouée)** — étape dock : `placement: "above"`, **128/128 px visibles**,
`offscreen: false`, à **844 ET 667**.

## Garde falsifiable

`src/trunk/spotlight-placement.test.ts` (5). **Falsifié** : `below` forcé partout → **2 FAIL**
(« REGRESSION : l'étape dock garde la bulle entièrement visible » + « borne toujours dans la
fenêtre ») ; restauré → **5 PASS**.

## Preuves

**1226/1226** (149 fichiers), `tsc` 0, 5 gardes verts, build `index-DQAjcGEA.js`.

## Notification « le vendeur répond mais rien ne se passe » — MESURÉ (2026-10-15)

Le fondateur a signalé : « le vendeur répond à une demande de disponibilité mais rien ne se
passe — l'acheteur ne reçoit rien, le vendeur n'a pas été notifié ». **Puis il a précisé lui-même :
« ah non, le vendeur a reçu la notif, il ne me l'avait juste pas dit. »**

**Le backend est sain — prouvé sur branche jetable** avec le code LIVRÉ
(`respondAvailability` + `getAvailabilityResponses` + `getSellerAvailabilityQueue` +
`listNotificationInbox`), scénario réel (demande `0ecce433…`, vendeur `antpeteou@gmail.com`) :

| Étape | Résultat mesuré |
|---|---|
| Demande → notif **vendeur** (`availability_request_created`) | **écrit** (état `queued`) — le vendeur EST notifié |
| Réponse vendeur → `v2_availability_responses` | **persistée** |
| Réponse vendeur → notif **acheteur** (`availability_response_created`) | **écrite**, `entityId = requestId`, **livrée in_app** |
| L'acheteur relit la réponse | **OK** — `requestStatus: "responses"`, prix/qté/message visibles |
| `prove-branches-notif-1.mjs` | **11/11 PASS** (rejeu = pas de double notif) |

**Donc l'acheteur n'« ne recevait rien » qu'en apparence** : il n'y avait **aucune surface in-app
qui le lui disait**, et le compte acheteur (`kheirlissi@icloud.com`) a **0 abonnement Web Push** —
rien ne le poussait. **La notification existait en base ; elle était invisible.**

### Trois défauts de VISIBILITÉ réels, corrigés

1. **Le vendeur répondait et sa carte ne changeait pas** (« rien ne se passe »).
   `SellerReplyV13` ne lisait **jamais** `responseStatus` (0 occurrence) : la carte d'une demande
   déjà répondue gardait **le même formulaire** que la demande neuve. Corrigé : une demande
   répondue affiche **« Répondu »** + le statut donné (« Disponible » / « Partiellement
   disponible » / « Indisponible ») + l'âge, et ne re-propose plus le formulaire (bouton
   « Corriger la réponse » pour rouvrir).
2. **Le libellé d'état côté acheteur mentait.** `statusLabel` renvoyait **« Indisponible »** pour
   *toute* valeur non reconnue — dont `submitted` (demande en attente) et `responses` (le vendeur
   a répondu). Un état de **demande** se disait avec un mot de **réponse** vendeur. Corrigé :
   helper pur **`buyerRequestStatusLabel`** → `submitted`/`responding` = **« En attente »**,
   `responses` = **« Réponse reçue »**.
3. **La tuile « Demandes » du vendeur comptait des PRODUITS.** `buildSellerWorkspace.pendingCount`
   lisait `products.filter(draft | pending_validation)` — une tuile « Demandes » annonçait donc
   « 3 » alors qu'aucune demande n'existait. Corrigé : `pendingRequests` (demandes en attente,
   dérivé au read).

### Gardes falsifiables (chacun vérifié comme ÉCHOUANT sur l'ancien code)

- `src/trunk/SellerReplyV13.test.tsx` (3) — **2 FAIL** sur l'ancien code (« Répondu » absent,
  formulaire encore là).
- `src/trunk/ui-helpers.test.ts` — `buyerRequestStatusLabel` : **1 FAIL** si `submitted` redevient
  « Indisponible ».
- `src/trunk/seller-workspace.test.ts` — la tuile « Demandes » ignore les brouillons : **1 FAIL**
  sur l'ancien compteur.

**Preuves :** **1233/1233** (150 fichiers, +7), `tsc` 0, 5 gardes verts, build OK.

### Résidu honnête (décision fondateur)

Il n'y a **aucun badge de notification non-lue dans le dock/menu**. La maquette **n'en a pas**
(le « Centre de notifications » est atteignable, jamais signalé) — donc l'ajouter serait une
**fondation neuve**, hors de cette tranche de durcissement. Si le fondateur veut qu'une réponse
vendeur **se voie sans ouvrir les notifications**, c'est un arbitrage à prendre (badge de dock
« à la maquette » ou toast temps réel). Le contenu du centre de notifications, lui, est déjà
exact : « Réponse à votre demande » (maquette L1683).

## Décisions ouvertes (une à la fois)

1. **Reprise PWA** : ajouter le guide aux surfaces restaurables, et **retenir une recherche/flow
   en cours** (contrat léger : quelle étape on mémorise). Recommandé.
2. **Guide « une fois »** : drapeau « accueil déjà vu » par compte (aujourd'hui : montré à chaque
   création). Le fondateur veut « une seule fois ».
3. **Notification** : aucun réglage app tant que le fondateur n'a pas dit s'il veut un son ou
   une vibration **propres** (aujourd'hui : son du système OS).

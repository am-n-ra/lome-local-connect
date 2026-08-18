# Omni V1 — Audit UI et refonte de l'état transaction

Séquence confirmée : **vérification vendeur avant paiement**, contact et itinéraire débloqués dès l'intention. Le serveur applique déjà cet ordre (`redeem` fait passer `qr_generated → payment_pending` avec l'événement `seller_verified`, et `deriveTransactionRoomAccess` débloque contact/itinéraire sur `hasIntent`). C'est l'UI qui ne raconte pas cette histoire.

## Audit — ce qui a été mesuré

Scan mobile 390 px sur `/`, `/vendeur`, `/onboarding`, `/admin`, `/auth` :

| Route | État observé |
|---|---|
| `/` | 0 canvas, figé sur « Chargement de la carte… / Localisation en cours… » |
| `/vendeur` | figé sur « Chargement… » |
| `/onboarding` | figé sur « Préparation de votre espace… » |
| `/admin` | page vide (0 caractère) |
| `/auth` | seule route qui rend |

Erreur unique à l'origine des quatre premiers cas : `AsyncLocalStorage is not a constructor` à l'hydratation. `src/lib/auth-middleware.ts` n'a pas l'extension `.server`, donc `neon-auth.server → db.server →` driver Neon part dans le bundle navigateur, et tous les `*.functions.ts` importent ce fichier.

### Dettes UI relevées dans le code

1. **La transaction est éclatée en quatre surfaces** : `OrdersPanel` (sheet « Mes demandes »), `TransactionThreadCard`, `ChatPanel`, `CheckoutPanel` vendeur. Aucun endroit unique et reprenable.
2. **`OrdersPanel` charge toutes les timelines en parallèle à l'ouverture** : lent, et une erreur unitaire est avalée silencieusement.
3. **Les conséquences passent par des toasts** (coupon, paiement déclaré, QR régénéré) : elles disparaissent, alors que ce sont des faits de la transaction.
4. **Pas d'URL par transaction** : impossible de partir ailleurs et de revenir au même endroit, ni de deep-linker une notification.
5. **Le choix du paiement est présenté trop tôt** dans les cards, avant que le vendeur ait vérifié.
6. **Contact et itinéraire ne sont pas visibles dès l'intention**, alors que l'acheteur doit se déplacer pour la vérification.
7. **Sections vendeur orphelines** (wallet, plan, paramètres, agent) non exposées par la navigation.
8. **États d'entrée non bornés** : chargements infinis, `/admin` blanc, formulaire d'auth non sémantique.

## Machine d'états confirmée

```text
intent_created
   ↓                     contact + itinéraire DÉBLOQUÉS ici
qr_generated             acheteur : QR affiché, code manuel de secours
   ↓  vendeur scanne / vérifie en face à face
seller_verified          « Transaction confirmée »
   ↓
payment_pending          acheteur voit le NET à payer (après réduction)
   ↓  acheteur choisit    Cash · Mobile Money · Payer à la livraison
payment_declared         acheteur : [ J'ai payé ]
   ↓
payment_confirmed        vendeur : [ Paiement reçu ]
   ↓
fulfillment              vendeur : [ Produit remis / livré ]
   ↓
received                 acheteur : [ Produit reçu ]
   ↓
rating_pending → completed
```

Sorties : `expired` (QR périmé → régénérer), `cancelled`. Chaque transition écrit un `transaction_events` et une card dans le fil.

## Écran de transaction — persistant et reprenable

Nouvelle route `/transaction/$id`, pas une sheet. On peut la quitter, naviguer, revenir : l'état est reconstruit depuis le serveur, et une barre de reprise apparaît sur la carte tant qu'une transaction est active.

```text
┌──────────────────────────────────────────┐
│ ←  Chez Ama · ciment 50 kg          ⋯    │
│ ①──②──③──④──⑤   Vérification vendeur     │
│ 48 000 F − 2 000 F  →  46 000 F à payer  │
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │  ÉTAT ACTUEL                         │ │  bloc « quoi faire maintenant »
│ │  Montrez ce QR au vendeur            │ │
│ │   ▛▀▀▀▜  K7QM2PDX   [ Agrandir ]     │ │
│ │  ou dictez le code                   │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ Chez Ama · 800 m                     │ │  contact + itinéraire dès l'intention
│ │ [ Itinéraire ]  [ Appeler ]          │ │
│ └──────────────────────────────────────┘ │
│ FIL                                      │
│ ● Intention créée              10:02     │
│ ● Offre confirmée 4 × 12 000             │
│ ● Coupon BIENVENUE −2 000 F              │  conséquence inline, pas un toast
│ ● QR généré                    10:05     │
│ ○ Vérification vendeur — en attente      │
│ [Ama] Je vous garde les 4 sacs.          │
├──────────────────────────────────────────┤
│ [ Écrire un message ]                    │  message = option, pas le contenant
└──────────────────────────────────────────┘
```

Après vérification, le bloc d'état change seul, sans changer d'écran :

```text
│  ✓ Transaction confirmée par Chez Ama    │
│  Il vous reste  46 000 F  à payer        │
│  Comment payez-vous ?                    │
│  [ Cash ]  [ Mobile Money ]  [ À la livraison ] │
```

puis `[ J'ai payé ]`, puis attente de `Paiement reçu`, `Produit remis`, `[ Produit reçu ]`, notation, `Terminé`.

Règles : **un seul bloc d'action à la fois** en haut, le fil en dessous en lecture, le champ message toujours disponible mais jamais dominant. Erreurs (QR rejoué, expiré, paiement refusé) = card rouge dans le fil avec l'action de reprise.

### Reprise visible partout

```text
carte  →  ┌────────────────────────────────────┐
          │ ● Transaction en cours · Chez Ama  │  barre fine, tapable
          │   Vérification vendeur · 46 000 F  │
          └────────────────────────────────────┘
```

Notifications et menu deep-linkent vers `/transaction/$id`.

### Côté vendeur — même écran, actions inversées

```text
│ Kossi A. · ciment 50 kg · 4 unités       │
│ ÉTAT : QR à vérifier                     │
│ [ Scanner le QR ]   [ Saisir le code ]   │
│ … puis  [ Paiement reçu ]                │
│ … puis  [ Produit remis ]                │
```

La caméra n'est demandée qu'au clic « Scanner le QR », caméra arrière, stream arrêté à la fermeture, états `requesting / active / denied / unsupported` avec la saisie manuelle toujours visible.

## Le reste de l'UI, corrigé dans la foulée

- **Availability** : une sheet à trois étapes (Quoi → Où → Contraintes), puis l'écran de comparaison ; une card = une réponse = une décision ; l'historique part dans `Menu → Disponibilités`.
- **Résultats** : rail horizontal synchronisé avec la carte, l'objet cherché avant le nom du commerce, `Affiner` redevient une icône discrète.
- **Vendeur** : bascule `Carte / Console`, toutes les sections exposées (wallet, plan, paramètres, agent inclus), réponse à une demande en un geste.
- **Wallet** : un seul Omni Wallet rechargeable, allocations en lecture, aucun CTA de retrait en V1.
- **États d'entrée** : squelette local par surface, état vide, état d'erreur avec `Réessayer`, vérification d'auth bornée puis contenu / `/auth` / « Accès réservé ». Formulaire d'auth sémantique.
- **Accessibilité** : cibles ≥ 44 px, focus rendu au déclencheur, Échap ferme un seul niveau, changements d'état annoncés en région live.

## Détails techniques

- Lot 0 : renommer `src/lib/auth-middleware.ts` en `.server.ts` (ou charger `neon-auth.server` dans les handlers) + garde-fou automatisé qui échoue si un module `.server` ou un built-in Node entre dans le bundle client.
- Nouvelle route `src/routes/transaction.$id.tsx` alimentée par `transaction_events` et `messages.transaction_id`, remplaçant l'usage transactionnel de `OrdersPanel`, `ChatPanel` et `CheckoutPanel`.
- Dérivation d'action centralisée dans `src/lib/omni-v1-contracts.ts` (déjà présent) : l'UI n'invente aucune transition, elle affiche `deriveTransactionRoomAction`.
- Chargement par transaction (plus de fan-out de timelines à l'ouverture d'un panneau) ; erreurs remontées, jamais avalées.
- Refonte de présentation : server functions et migrations existantes réutilisées telles quelles.

## Ordre de livraison

1. Lot 0 — déblocage runtime et garde-fou.
2. Route transaction persistante + machine d'états + barre de reprise.
3. Vendeur : vérification QR, encaissement, remise, dans le même écran.
4. Availability trois étapes + comparaison.
5. Console vendeur complète, wallet, menu, notifications deep-linkées.
6. États d'entrée, accessibilité, certification 320 → 1280 px.

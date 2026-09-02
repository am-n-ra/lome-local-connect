# Omni — Flow transactionnel V1 recommandé et wireframes

**Statut :** proposition de convergence produit avant implémentation  
**Date :** 18 août 2026  
**Principe non négociable :** la scène MapLibre, les pins, les cards de découverte et le comportement géospatial existants ne changent pas dans ce chantier.

## 1. Décision produit

Le flow d’achat ne doit pas être une suite de dialogs jetables. Il doit créer une **Transaction Room** persistante : une surface courte et structurée qui commence au moment où l’acheteur clique sur `Je veux payer ici`, affiche le QR comme identité de la transaction, reçoit les actions seller et permet à l’acheteur de sortir faire autre chose puis de reprendre exactement au même état.

Le chat transactionnel est donc nécessaire, mais il ne doit pas devenir un chat générique. Il doit être un **journal opérationnel partagé** : événements, QR, choix de paiement, confirmation seller, livraison, réception, rating et messages courts facultatifs. Pour un achat en présentiel, la room peut se réduire visuellement à une carte compacte `Vérifier → Payer → Recevoir`, tout en conservant le même historique et les mêmes garanties.

> **Règle de visibilité :** avant l’intention d’achat, l’acheteur voit la facility, le produit, la disponibilité et le prix indicatif. Après `Je veux payer ici`, il peut voir le contact, l’itinéraire, les instructions de retrait/livraison et les informations seller nécessaires à l’exécution.

## 2. Flow métier recommandé

| Étape | Buyer | Seller | État persistant | Données/accès |
|---|---|---|---|---|
| Recherche | Recherche un produit sur le dock ; les pins et le globe restent inchangés | Aucun rôle actif | `searching` | Résultats OSM/claimed inchangés |
| Disponibilité | Choisit une réponse et demande la disponibilité | Reçoit une demande availability | `availability_open` | Budget buyer privé ; aucune coordonnée seller déverrouillée |
| Intention | Clique `Je veux payer ici` | Reçoit une notification `Nouvelle intention d’achat` | `pending` | Transaction créée, snapshot produit/prix/coupon, room ouverte |
| QR transaction | Le buyer voit le QR et peut le partager/présenter | Ouvre la room depuis la notification | `qr_generated` | QR = identité de transaction ; expiration et deep link |
| Vérification | Présente le QR au seller ou ouvre le deep link | Scanne le QR caméra ou saisit le code ; confirme la transaction | `qr_verified` | Seller autorisé sur la facility ; accès contact/itinéraire buyer déverrouillé |
| Montant final | Voit montant, réduction Omni et reste à payer | Voit le même montant et l’état du paiement | `payment_pending` | Coupon snapshot, total final, frais et mode externe |
| Paiement externe | Choisit `Cash`, `TMoney/Flooz` ou `Pay on delivery`, puis clique `J’ai payé le vendeur` lorsque pertinent | Reçoit `Paiement déclaré` et clique `Paiement reçu` | `paid` | Omni n’encaisse pas le paiement buyer-vendeur |
| Livraison/retrait | Attend, suit les instructions ou récupère sur place | Clique `Produit remis / livré` | `fulfillment` | Contact et instructions restent accessibles dans la room |
| Réception | Clique `J’ai reçu le produit` | Voit la réception buyer | `received` / `rating_pending` | Preuve d’exécution et notification seller |
| Rating | Note le produit/facility et envoie le commentaire | Peut voir le rating reçu | `completed` | Transaction terminée uniquement après rating ou expiration contrôlée |

### Décision sur le QR

Le clic `Je veux payer ici` doit créer **la transaction et son QR immédiatement**, conformément au comportement attendu. Pour éviter qu’un QR non accepté soit interprété comme un paiement, le QR est d’abord marqué `QR en attente de vérification`. Le seller le vérifie dans sa room ; cette vérification fait passer la transaction à `payment_pending`, rend le montant final officiel et déverrouille les informations seller. Ainsi, l’acheteur obtient immédiatement un objet concret à présenter, sans que la création de l’intention ne signifie que le vendeur a déjà accepté le paiement.

## 3. Wireframes de référence

Les wireframes ci-dessous décrivent la hiérarchie et les comportements ; ils ne proposent pas de nouvelle carte et ne modifient pas le rendu des pins.

### 3.1 Scène buyer : idle, recherche et résultat

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         GLOBE / MAPLIBRE                            │
│          pins, clusters, position et animations inchangés            │
│                                                     ◯ notifications  │
│                                                        ☰ menu        │
│                                                                      │
│                     [ rail de résultats existant ]                  │
│                                                                      │
│              [ Que cherchez-vous dans le monde ?          🔍 ]      │
│              [ paramètres / localisation / état couverture ]        │
└──────────────────────────────────────────────────────────────────────┘
```

La recherche et le rail restent les points focaux. Aucun CTA transactionnel ne doit être injecté dans le dock. Les CTA restent dans la card facility/réponse availability, afin de ne pas mélanger découvrir et acheter.

### 3.2 Réponse availability : action d’intention

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Résultat produit                                                    │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ [media]  tomates                                               │  │
│  │          Marché de Tomates · vendeur mobile                    │  │
│  │          Disponible · 1 250 FCFA · 7,0 km                      │  │
│  │          coupon éventuel : -100 FCFA                           │  │
│  │          [ Vérifier la disponibilité ]                         │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Après réponse seller :                                               │
│  [ Je veux payer ici ]    [ Choisir une autre réponse ]              │
│                                                                      │
│  Note : contact et itinéraire apparaissent seulement après intent.   │
└──────────────────────────────────────────────────────────────────────┘
```

`Je veux payer ici` est l’unique CTA d’achat. Le libellé est préférable à `Acheter`, car il indique que l’acheteur demande l’exécution auprès de cette facility et que le paiement réel sera choisi ensuite.

### 3.3 Création de room : transaction + QR

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Transaction                                         1 / 5           │
│  Intention  →  Offre  →  QR  →  Paiement  →  Réception              │
├──────────────────────────────────────────────────────────────────────┤
│  Intention créée                                                       │
│  Marché de Tomates · tomates · quantité 1                            │
│  Montant indicatif : 1 250 FCFA                                      │
│                                                                      │
│                 ┌───────────────────────┐                            │
│                 │       QR CODE         │                            │
│                 │   ▦ 5QLK3RD9          │                            │
│                 └───────────────────────┘                            │
│  Présentez ce code au vendeur ou partagez le lien sécurisé.          │
│  En attente de vérification seller · expire dans 2 h                 │
│                                                                      │
│  [Fermer et continuer sur Omni]        [Partager le QR]              │
└──────────────────────────────────────────────────────────────────────┘
```

La room s’ouvre au-dessus de la carte, mais `Fermer et continuer sur Omni` ne détruit rien. Le système garde une transaction active visible dans une pill/pile persistante : `1 transaction en cours`.

### 3.4 Seller : notification et vérification

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Seller workspace — carte et pins inchangés                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Nouvelle intention d’achat                                    │  │
│  │ tomates · quantité 1 · montant indicatif 1 250 FCFA            │  │
│  │ [ Ouvrir la transaction ]                                      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Transaction buyer: Kheir                                             │
│  QR en attente de vérification                                        │
│  [ Ouvrir caméra ] [ Saisir code ]                                   │
│                                                                      │
│  Après scan :                                                         │
│  [ QR vérifié et transaction confirmée ]                              │
└──────────────────────────────────────────────────────────────────────┘
```

Le seller ne doit pas être renvoyé vers une page parallèle. La notification ouvre la même Transaction Room dans le shell seller, avec l’onglet Scanner sélectionné seulement si cela aide l’action ; la room reste l’autorité visuelle.

### 3.5 Après vérification : montant et informations seller

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Transaction                                          4 / 5           │
│  Intention  ✓   Offre  ✓   QR  ✓   Paiement actif   Réception        │
├──────────────────────────────────────────────────────────────────────┤
│  Transaction confirmée                                                 │
│  tomates · quantité 1                                                 │
│                                                                      │
│  Prix produit                                      1 250 FCFA         │
│  Réduction Omni / coupon                          -100 FCFA           │
│  Total à payer                                     1 150 FCFA         │
│                                                                      │
│  Seller vérifié · Marché de Tomates                                  │
│  📍 Itinéraire déverrouillé    ☎ Contact déverrouillé                │
│                                                                      │
│  Comment allez-vous payer ?                                           │
│  ( ) Cash       ( ) TMoney/Flooz       ( ) Pay on delivery           │
│                                                                      │
│  [ Enregistrer le mode de paiement ]                                  │
└──────────────────────────────────────────────────────────────────────┘
```

Le coupon doit être snapshoté dans la transaction avant affichage du total final. Le buyer ne doit pas voir un prix qui change silencieusement après la vérification QR.

### 3.6 Déclaration et confirmation de paiement externe

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Paiement externe                                                     │
├──────────────────────────────────────────────────────────────────────┤
│  Mode choisi : TMoney/Flooz                                           │
│  Total : 1 150 FCFA                                                   │
│                                                                      │
│  [ J’ai payé le vendeur ]                                             │
│                                                                      │
│  État : déclaration envoyée — attente de confirmation seller          │
│  Le seller doit vérifier la réception avant la remise du produit.     │
│                                                                      │
│  [ Quitter la room ]                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

Pour `cash` ou `pay on delivery`, le copy doit être différent : `Paiement à la remise` plutôt que `J’ai payé`. La même room reste utilisée, mais l’action buyer devient `Confirmer la remise` ou disparaît jusqu’à l’événement seller approprié.

### 3.7 Fulfillment, réception et rating

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Réception                                          5 / 5             │
├──────────────────────────────────────────────────────────────────────┤
│  Seller : Produit remis / livré                                      │
│  Date : aujourd’hui                                                   │
│                                                                      │
│  Avez-vous reçu votre produit ?                                     │
│  [ Oui, confirmer la réception ]                                    │
│                                                                      │
│  ────────────────────────────────────────────────────────────────    │
│  Votre avis                                                           │
│  ☆ ☆ ☆ ☆ ☆                                                          │
│  [ Écrire un commentaire…                                      ]      │
│  [ Envoyer mon avis et terminer ]                                    │
└──────────────────────────────────────────────────────────────────────┘
```

La transaction ne disparaît pas après `J’ai reçu`. Elle entre dans `rating_pending` avec une action claire. Le rating peut être rendu obligatoire pour la clôture immédiate, avec expiration/skip contrôlé ultérieurement afin de ne pas bloquer les utilisateurs.

### 3.8 Sortie et reprise

```text
État carte après fermeture de la room :

┌──────────────────────────────────────────────────────────────────────┐
│  GLOBE / PINS INCHANGÉS                                               │
│                                                                      │
│                                            [ 1 transaction en cours ] │
│                                                                      │
│  dock recherche inchangé                                              │
└──────────────────────────────────────────────────────────────────────┘

Tap sur la pill ou Menu → Transactions :
┌──────────────────────────────────────────────────────────────────────┐
│ Transactions                                                          │
│ [tomates] QR en attente de vérification · reprendre →                 │
│ [riz] Paiement à confirmer · reprendre →                              │
└──────────────────────────────────────────────────────────────────────┘
```

La fermeture est une navigation, pas une annulation. L’état à reprendre comprend `transactionId`, rôle, dernier statut, QR, facility, progression, mode de paiement et action suivante. Le serveur reste la source d’autorité ; le client conserve uniquement le contexte d’ouverture et un cache non sensible.

## 4. Ce qui change par rapport à l’UI actuelle

| Sujet | Divergence actuelle | Recommandation |
|---|---|---|
| Achat | Le flow mélange disponibilité, réponse et création d’intention dans une même surface | Garder availability séparée, puis ouvrir une Transaction Room au clic unique `Je veux payer ici` |
| QR | Le QR est encore présenté comme étape pouvant dépendre d’une confirmation d’offre précédente | Le générer à la création de l’intent comme identité de transaction, mais le rendre vérifié/actif seulement après scan seller |
| Chat | Le chat apparaît comme panneau conversationnel parmi d’autres | Le transformer en room structurée persistante, avec messages facultatifs et actions d’état |
| Sortie | Fermer une sheet peut faire perdre le contexte visuel | Ajouter pill `transaction en cours`, menu Transactions et deep link resumable |
| Contact | Le contact/itinéraire peut être trop tôt visible dans les surfaces facility | Déverrouiller uniquement après intent, idéalement après QR vérifié selon la donnée concernée |
| Montant | Le prix et le coupon ne sont pas présentés comme un snapshot final unique | Afficher subtotal, réduction, total net et mode externe après QR vérifié |
| Paiement | Paiement choice/declaration/confirmation seller sont conceptuellement proches | Trois actions séparées et attribuées : buyer choisit/déclare, seller confirme, seller remet/livre |
| Fin | `completed` peut apparaître avant rating | Ajouter `received`/`rating_pending` ou un événement rating obligatoire avant `completed` |
| Carte | Les overlays peuvent donner l’impression de remplacer la carte | Ne toucher ni aux pins ni aux layers ; seul le chrome des rooms change |

## 5. Contrats à formaliser avant code

Le contrat UI-safe doit exposer une prochaine action par rôle :

```ts
type TransactionRoomAction =
  | "confirm_intent"
  | "present_qr"
  | "verify_qr"
  | "choose_payment"
  | "declare_payment"
  | "confirm_payment_received"
  | "mark_fulfilled"
  | "confirm_received"
  | "rate_transaction";

type TransactionRoomSnapshot = {
  transactionId: string;
  role: "buyer" | "seller";
  status:
    | "pending"
    | "qr_generated"
    | "qr_verified"
    | "payment_pending"
    | "paid"
    | "fulfillment"
    | "received"
    | "rating_pending"
    | "completed";
  nextAction: TransactionRoomAction | null;
  contactUnlocked: boolean;
  routeUnlocked: boolean;
  qrVisible: boolean;
  amountDue: number | null;
  discountAmount: number | null;
  paymentPreference: "cash" | "mobile_money" | "pay_on_delivery" | null;
};
```

La forme exacte sera adaptée aux colonnes existantes, mais ces invariants doivent être testés avant d’ajuster les cards : **les pins ne changent pas**, un buyer ne confirme pas le paiement seller, un seller ne confirme pas la réception buyer, aucun contact avant intent, aucun montant final avant snapshot coupon/QR, et aucune clôture avant réception/rating.

## 6. Critères d’acceptation proposés

| Critère | Vérification |
|---|---|
| Découverte inchangée | Comparaison visuelle des pins, clusters, globe, rail et dock avant/après |
| Intent clair | Une seule action `Je veux payer ici` depuis une réponse availability |
| QR immédiat | Après intent, transaction + QR + room sont visibles sans navigation parallèle |
| Seller asynchrone | Une notification ouvre la même room seller et l’action de vérification QR |
| Présentiel | Scan seller sur mobile ou saisie manuelle fait avancer la même transaction |
| Paiement externe | Cash, mobile money et pay-on-delivery ont des copy et actions corrects ; aucun in-app payment |
| Confidentialité | Contact/itinéraire absents avant intent et déverrouillés au moment défini |
| Résumabilité | Fermer, naviguer vers la carte, revenir via Transactions ou notification restaure le même état |
| Fin complète | Paiement confirmé → produit remis/livré → reçu → rating → completed |
| Tolérance | Le réseau, un refus caméra ou une fermeture de room ne perdent pas l’intent ni le QR |

## 7. Prochaine implémentation recommandée

Le premier lot doit être non visuel et sûr : ajouter les types de `TransactionRoomSnapshot`, ajouter les tests d’actions par rôle et décider définitivement si le QR est `generated` dès l’intent mais `verified` seulement après scan. Le second lot branchera la room persistante sur `TransactionThreadCard`, OrdersPanel et les notifications seller. Les cards, pins, globe et ResultRail resteront inchangés sauf pour cacher les accès contact pré-intent. Le troisième lot ajoutera `received`/`rating_pending`, la capture du coupon snapshot et les tests E2E.

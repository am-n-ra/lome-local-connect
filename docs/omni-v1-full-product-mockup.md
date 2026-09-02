# OMNI V1 — FULL PRODUCT MOCKUP

## Founder HQ / Nature Way — Build Specification

### 0. PRODUCT LAW

Omni doit rendre le monde commercial **visible, searchable et actionable**.

Le produit commence par :

> **Je cherche quelque chose.**

Puis :

> **Je découvre où l'offre existe.**
> **Je vérifie si elle peut réellement répondre à mon besoin.**
> **Je choisis.**
> **J'entre dans une transaction Omni.**

Omni ne demande pas au vendeur de transformer son activité en e-commerce.

Une femme qui vend dans la rue, un magasin, un ingénieur indépendant, un prestataire mobile, un marché, une entreprise SaaS ou une personne qui revend son ordinateur peuvent tous représenter de l'offre.

---

# 1. INFORMATION ARCHITECTURE

## 1.1 Deux modes d'utilisation

Un même compte peut :

* chercher ;
* vendre ;
* posséder plusieurs facilités ;
* passer d'un mode Buyer à Seller.

Il n'existe donc pas deux comptes séparés.

### Navigation Buyer

```text
MAP
SEARCH
SAVED
REQUESTS
TRANSACTIONS
ACCOUNT
```

### Navigation Seller

```text
TODAY
FACILITIES
PRODUCTS
REQUESTS
ORDERS
INVENTORY
SCAN
AGENT
ACCOUNT
```

---

# 2. SCREEN 01 — WORLD / MAP HOME

C'est la première expérience.

Pas de dashboard.

Pas de gros hero marketing.

La carte est le produit.

```text
┌──────────────────────────────┐
│                              │
│          OMNI                │
│                              │
│       [ Search... ]          │
│                              │
│                              │
│           MAP                │
│      ●       ●               │
│           ●                  │
│                              │
│                              │
│   ◎ My location              │
│                              │
│ ──────────────────────────── │
│  Search    Nearby    Saved   │
└──────────────────────────────┘
```

### Principes

* carte en arrière-plan ;
* recherche flottante ;
* localisation utilisateur ;
* pins ;
* possibilité de zoomer/panner ;
* aucun dashboard visible ;
* interface crème/glass ;
* carte volontairement silencieuse.

La spécification actuelle définit la carte comme l'interface principale et le facility comme l'objet fondamental de l'offre.

### V1

MapLibre.

Carte locale fonctionnelle.

Le globe mondial et les transitions World → Continent → Country → Region → City restent une évolution ultérieure : le document de scope les classe explicitement Deferred pour V1.

---

# 3. SCREEN 02 — SEARCH ACTIVATED

Quand l'utilisateur touche la recherche :

```text
┌──────────────────────────────┐
│ ← [ What are you looking for?│
│                              │
│ Recent                       │
│                              │
│ Search a product             │
│ Search a service             │
│ Search a facility            │
│                              │
│ 🎙 Voice    ◉ Scan           │
│                              │
│        MAP IN BACKGROUND      │
└──────────────────────────────┘
```

Le moteur peut comprendre :

```text
product
service
business
problem
location
price
quantity
quality
brand
category
availability
purchase
digital product
subscription
```

---

# 4. SCREEN 03 — SEARCH WITH CONSTRAINTS

L'utilisateur peut écrire :

> "Je cherche 20 chaises noires à moins de 15 000 FCFA autour de moi."

Omni extrait :

```text
PRODUCT = chair
COLOR = black
QUANTITY = 20
PRICE <= 15,000
LOCATION = current location
```

L'UI transforme progressivement la recherche en contraintes visibles.

```text
20 chaises
Noires
≤ 15 000 FCFA
≤ 10 km

[ + Add constraint ]
```

Important :

**les contraintes servent d'abord à filtrer l'offre.**

L'utilisateur ne doit pas recevoir 500 résultats dont 480 ne respectent pas ses conditions.

---

# 5. SCREEN 04 — SEARCH RESULTS / MAP

Résultats directement sur la carte.

```text
                 MAP
        ●       ●
             ●
   ◎
        ●

──────────────────────────────
20 chaises • noir • ≤15k

[Facility A]  6 min
20+ disponibles*
15,000 FCFA
● Open

[Facility B]  9 min
12 disponibles*
14,500 FCFA
● Open
──────────────────────────────
```

Sur mobile, la liste est un **horizontal bottom sheet / carousel**, pas une longue page verticale.

L'utilisateur voit :

* les pins ;
* puis les résultats sous forme de cartes ;
* et peut swiper entre eux.

La spécification précédente confirme cette logique : carte + pins + bottom sheet sur mobile.

---

# 6. SCREEN 05 — RESULT CARD

Chaque résultat doit répondre rapidement à :

> **Qu'est-ce que c'est ? Où est-ce ? Est-ce pertinent ? Est-ce ouvert ? Que puis-je faire ?**

```text
┌──────────────────────────────┐
│ [image]                      │
│                              │
│ ABC Furniture                │
│ ● Certified                  │
│ Furniture                    │
│                              │
│ 2.4 km · Open                │
│                              │
│ Chair — Black                │
│ From 14,500 FCFA             │
│                              │
│ [View] [Check availability]  │
└──────────────────────────────┘
```

Une facility card doit notamment communiquer identité, état de vérification, catégorie, distance, horaires, disponibilité, produits et offre.

---

# 7. SCREEN 06 — FACILITY PREVIEW

Tap sur une pin ou une result card.

Bottom sheet :

```text
┌──────────────────────────────┐
│ [ facility image ]           │
│                              │
│ ABC Furniture                │
│ ✓ Certified                  │
│ Furniture · 2.4 km           │
│ Open until 18:00             │
│                              │
│ Chair · Table · Desk · ...   │
│                              │
│ [View facility]              │
│ [Check availability]         │
└──────────────────────────────┘
```

### Règle fondamentale

Avant intention d'achat :

**PAS de contact vendeur.**

**PAS d'itinéraire détaillé.**

**PAS de transaction chat.**

Même une disponibilité confirmée automatiquement ne débloque pas ces informations.

Cette règle est déjà explicitement définie dans la spécification précédente.

---

# 8. SCREEN 07 — FACILITY PAGE

La facility devient une véritable représentation spatiale de l'offre.

```text
[ HERO MEDIA ]

ABC Furniture
✓ Certified

Open · 2.4 km

[ Check availability ]
[ View products ]

────────────────────

PRODUCTS

Chair
Table
Desk
Sofa
...

────────────────────

SERVICES

Delivery
Custom furniture
...

────────────────────

OFFERS

10% Omni discount

────────────────────

ABOUT

...

────────────────────

LOCATION
[ map ]

────────────────────

CONTENT
videos / guides / images
```

La structure de référence est :

`Hero → Identity → Status → Location → Actions → Products → Services → Offers → Content → Videos → About → Reviews`.

---

# 9. SCREEN 08 — PRODUCT DISCOVERY INSIDE A FACILITY

C'est ici que ta nouvelle réflexion devient importante.

L'utilisateur est venu pour :

> "Chair"

Mais il découvre :

```text
ABC Furniture

Chair
Desk
Table
Office chair
Bookshelf
Sofa
```

Il peut donc dire :

> "En fait, je veux aussi vérifier le desk."

Ou sélectionner plusieurs produits.

### Multi-product selection

```text
Chair          ✓
Desk           ✓
Office chair   ✓
Table          □

        3 products selected

[ Ask availability ]
```

Cela devient un mini-cart **de demande**, pas encore un panier de commande.

---

# 10. SCREEN 09 — AVAILABILITY REQUEST BUILDER

```text
CHECK AVAILABILITY

ABC Furniture

✓ Black chair
  Quantity: 20

✓ Office desk
  Quantity: 2

✓ Office chair
  Quantity: 5

Notes:
"Need delivery if possible"

────────────────────

[ Send availability request ]
```

Le vendeur reçoit **une demande structurée**, pas trois messages séparés.

---

# 11. SCREEN 10 — AVAILABILITY REQUEST SENT

```text
Checking availability...

ABC Furniture

Black chair       ● Waiting
Office desk       ● Waiting
Office chair      ● Waiting

You can leave this screen.

We'll notify you when they respond.
```

---

# 12. SCREEN 11 — SELLER AVAILABILITY REQUEST

Seller :

```text
NEW REQUEST

Kheir wants:

20 × Black Chair
2 × Office Desk
5 × Office Chair

[ Respond ]
```

Chaque ligne peut être :

```text
Available
Partially available
Unavailable
Alternative
```

Ces quatre réponses sont déjà prévues dans le modèle.

---

# 13. SCREEN 12 — SELLER RESPONSE

```text
BLACK CHAIR
Requested: 20

[✓ Available]
Quantity: 20

OFFICE DESK
Requested: 2

[✓ Available]
Quantity: 2

OFFICE CHAIR
Requested: 5

[~ Partial]
Quantity: 3

[ Send response ]
```

Le vendeur n'a pas besoin de remplir un catalogue gigantesque.

C'est précisément le rôle initial de la disponibilité manuelle.

---

# 14. SCREEN 13 — AVAILABILITY RESULT

Buyer reçoit :

```text
ABC Furniture

✓ Black chair
20 available

✓ Office desk
2 available

~ Office chair
3 available
5 requested

────────────────────

Omni discount available

[ View updated request ]
```

---

# 15. SCREEN 14 — OTHER PRODUCTS / FACILITY DISCOVERY

Après la réponse, Omni doit continuer à exploiter le contexte.

```text
You were looking for:

20 Black Chairs

ABC Furniture also has:

Office desks
Office chairs
Tables
Sofas
Shelves

[ Browse all products ]
```

L'utilisateur peut sélectionner d'autres produits et lancer une nouvelle demande.

Mais Omni doit aussi éviter de créer un processus infini.

---

# 16. SCREEN 15 — BULK AVAILABILITY

Pour une demande importante :

> "J'ai besoin de 500 chaises."

Le flow devient :

```text
Search
 ↓
Candidate facilities
 ↓
Bulk availability request
 ↓
Responses
 ↓
Normalized results
 ↓
Ranking
```

La spécification prévoit explicitement la capacité de contacter un grand ensemble de vendeurs plutôt que de répéter manuellement la demande.

### Important V1

Le moteur peut être simple.

Pas besoin d'un agent autonome complexe.

On construit d'abord :

```text
candidate selection
→ request dispatch
→ seller response
→ aggregation
→ ranking
```

---

# 17. SCREEN 16 — AVAILABILITY COMPARISON

Après bulk availability :

```text
BEST MATCHES

1. ABC Furniture
20/20 available
15,000 FCFA
2.4 km
Open

2. XYZ Office
20/20 available
15,500 FCFA
4.1 km
Open

3. Market Supplier
15/20 available
13,500 FCFA
3.2 km
Open
```

Filtres :

```text
Best match
Closest
Lowest price
Most available
Fastest fulfilment
```

---

# 18. SCREEN 17 — PURCHASE INTENT

L'utilisateur choisit :

```text
ABC Furniture

20 × Black Chair
2 × Office Desk
3 × Office Chair

[ I WANT TO BUY ]
```

**C'est le point de bascule fondamental.**

Avant ce bouton :

```text
DISCOVERY
```

Après :

```text
TRANSACTION
```

---

# 19. SCREEN 18 — TRANSACTION CREATION

Tap :

> I WANT TO BUY

Omni crée atomiquement :

```text
Transaction
+
Coupon instance
+
QR token
+
Transaction context
+
Transactional chat
```

Et débloque :

```text
Seller contact
Route
Transaction chat
```

La spécification précédente impose précisément cette génération atomique et le déblocage à cet instant.

---

# 20. SCREEN 19 — TRANSACTION CHAT

Ce n'est pas un chat social.

C'est une **transaction room**.

```text
ABC Furniture

TRANSACTION #OMN-48291

20 × Black Chair
2 × Office Desk
3 × Office Chair

────────────────────

✓ Purchase intent created
✓ Transaction QR generated

[ QR ]

[ Share transaction ]

────────────────────

Seller
● Waiting for verification

────────────────────
Message seller...

```

Le chat textuel reste contextuel à cette transaction.

Il ne devient pas une conversation permanente avec le vendeur.

---

# 21. SCREEN 20 — SHARE QR

Deux chemins.

### A — Omni

```text
[ Share in Omni ]
```

### B — External

```text
WhatsApp
SMS
Telegram
Copy
Show QR physically
```

Mais les deux convergent vers le même système.

Le vendeur doit **toujours valider la transaction via Omni**.

---

# 22. SCREEN 21 — SELLER QR VERIFICATION

Seller :

```text
SCAN TRANSACTION

        [ QR CAMERA ]

or

Enter code

[ _ _ _ _ _ _ ]

```

Puis :

```text
Checking Omni transaction...
```

---

# 23. SCREEN 22 — VERIFIED TRANSACTION

Seller voit :

```text
✓ OMNI TRANSACTION VERIFIED

Buyer:
Kheir

Items:

20 × Black Chair
2 × Office Desk
3 × Office Chair

Omni discount:
- XX FCFA

TOTAL TO COLLECT:
XX XXX FCFA

────────────────────

[ Payment received ]
```

Le vendeur ne doit jamais faire confiance au contenu visuel du QR.

Le serveur valide le token.

Le QR est une autorisation/identification transactionnelle, pas simplement une preuve graphique.

---

# 24. SCREEN 23 — BUYER PAYMENT

Après vérification :

```text
✓ Transaction confirmed

Amount to pay:
XX XXX FCFA

How would you like to pay?

○ Cash
○ Mobile Money
○ Bank transfer
○ Other

[ Continue ]
```

Avant cette étape, le prix net final n'est pas considéré comme définitivement affiché.

---

# 25. SCREEN 24 — PAYMENT INSTRUCTIONS

Si Mobile Money :

```text
PAY WITH MOBILE MONEY

Send:
XX XXX FCFA

To:
+228 XX XX XX XX

Reference:
OMN-48291

[ I paid ]
```

Si Cash :

```text
CASH

Pay the seller directly.

[ I will pay cash ]
```

Omni peut donc fonctionner même sans intégrer immédiatement le paiement.

---

# 26. SCREEN 25 — PAYMENT DECLARED

Buyer :

```text
I paid

✓ Payment reported

Waiting for seller confirmation.
```

Le buyer **ne peut pas lui-même faire avancer la transaction vers "paid"**.

Le vendeur reste la source de vérité pour la réception effective du paiement.

---

# 27. SCREEN 26 — SELLER PAYMENT CONFIRMATION

```text
PAYMENT

XX XXX FCFA

Buyer says:
"I paid"

[ Payment received ]
[ Payment not received ]
```

---

# 28. SCREEN 27 — FULFILMENT

Après confirmation :

```text
PAYMENT CONFIRMED ✓

What happens next?

○ Pick up at facility
○ Seller delivers
○ Buyer delivery arranged
```

Puis :

```text
[ Product handed over ]
```

ou :

```text
[ Product shipped ]
```

---

# 29. SCREEN 28 — COMPLETED TRANSACTION

```text
TRANSACTION COMPLETE ✓

ABC Furniture

20 × Black Chair
2 × Office Desk
3 × Office Chair

Total:
XX XXX FCFA

Payment:
Mobile Money

[ Rate seller ]
```

La notation est optionnelle et non bloquante.

---

# 30. SCREEN 29 — TRANSACTION HISTORY

Buyer :

```text
TRANSACTIONS

Today
ABC Furniture
✓ Completed
XX XXX FCFA

Yesterday
XYZ Electronics
✓ Completed
XX XXX FCFA

[ View transaction ]
```

Chaque transaction ouvre directement sa transaction room / historique.

---

# 31. SCREEN 30 — SELLER HOME

Le vendeur ne doit pas voir un SaaS dashboard lourd.

Mobile-first :

```text
ABC FURNITURE

● Online

TODAY

4 availability requests
2 transactions
1 payment pending
3 low-stock alerts

────────────────

[ Scan QR ]

────────────────

REQUESTS
4 pending

ORDERS
2 active

INVENTORY
3 alerts

AGENT
"2 actions need your attention"
```

Le vendeur doit pouvoir gérer son activité depuis son téléphone. Le document prévoit explicitement un mode vendeur mobile avec Facility → Today → Requests → Orders → Inventory → Agent → Scan QR.

---

# 32. SCREEN 31 — SELLER FACILITY

```text
MY FACILITY

ABC Furniture

● Online
✓ Certified

Location
Opening hours

Products: 5 / 5 Free

[ Edit facility ]

────────────────

Products
Requests
Orders
Inventory
Offers
```

---

# 33. SCREEN 32 — PRODUCT MANAGEMENT

```text
PRODUCTS

5 / 5 Free

Chair
Desk
Office Chair
Table
Sofa

[ + Add product ]
```

Pour chaque produit :

```text
Name
Photo
Category
Price
Omni discount
Allocated Omni stock
Availability mode
```

---

# 34. SCREEN 33 — OMNI ALLOCATED STOCK

C'est une distinction fondamentale.

```text
TOTAL STOCK
Unknown / seller-controlled

OMNI ALLOCATED STOCK
12 units
```

L'Omni allocated stock représente la quantité que le vendeur considère comme affectée à l'écosystème Omni.

Il peut :

```text
+ Increase
- Decrease
Set quantity
```

### Pourquoi ?

Parce que le vendeur peut vendre ailleurs.

Exemple :

```text
Omni allocated stock = 20

Offline sale:
5 sold

Seller:
[ -5 ]

Omni allocated stock = 15
```

Omni ne prétend donc pas connaître magiquement tout le stock du monde.

Il maintient une **stock layer spécifique à Omni**.

---

# 35. SCREEN 34 — AUTOMATIC STOCK DEDUCTION

Si une disponibilité auto a permis une transaction Omni :

```text
Transaction completed
        ↓
Product
        ↓
Omni allocated stock
        ↓
- quantity purchased
```

La spécification actuelle prévoit déjà cette déduction sur transaction complétée lorsqu'une auto-réponse a été utilisée.

---

# 36. SCREEN 35 — OFF-OMNI SALE

Le vendeur vend dans la vraie vie.

```text
+ Record external sale

Product:
Black Chair

Quantity:
5

Price:
15,000

[ Save ]
```

Omni :

```text
Omni allocated stock
20 → 15
```

Ainsi Omni reste utile même lorsque le paiement et la vente ne passent pas par Omni.

---

# 37. SCREEN 36 — SELLER AVAILABILITY MODE

```text
AVAILABILITY

How should Omni answer requests?

○ Manual
○ Assisted
○ Automatic

────────────────

Manual
You answer every request.

Assisted
Omni prepares the answer.

Automatic
Omni answers according to your rules.
```

Ces trois niveaux sont déjà définis dans le modèle.

---

# 38. SCREEN 37 — DISCOUNT / OFFER

Le discount devient un élément structurel.

```text
OMNI OFFER

Product:
Black Chair

Regular price:
15,000 FCFA

Omni price:
14,250 FCFA

Discount:
5%

Valid:
Until Sept. 30

[ Activate ]
```

L'idée est importante :

**le discount n'est pas seulement une fonctionnalité marketing.**

Il devient la mécanique qui permet à Omni de distinguer une offre transactionnelle Omni d'une simple information sur l'existence d'un produit.

---

# 39. SCREEN 38 — SELLER AUTOMATION

```text
AUTOMATION

Availability
[ Manual / Assisted / Auto ]

Inventory
[ Manual / Assisted ]

Orders
[ Manual / Assisted / Auto ]

Content
[ Draft / Approval / Auto ]
```

Le vendeur garde le contrôle.

Omni ne doit jamais forcer une petite vendeuse ou un commerce informel à adopter une infrastructure qu'il ne possède pas.

---

# 40. SCREEN 39 — MOBILE / AMBULANT FACILITY

Une facility peut être :

```text
FIXED
MOBILE
DIGITAL
```

Pour une facility mobile :

```text
MY LOCATION

● Live / Active

Current position:
[ map ]

[ Update my position ]

Visibility:
● Discoverable
○ Offline
```

V1 peut utiliser une mise à jour manuelle de position.

Le live/background tracking appartient à une évolution plus avancée et doit rester permission-based.

---

# 41. SCREEN 40 — DIGITAL FACILITY

Une offre digitale peut être représentée :

```text
Lovable

Digital product
SaaS

Website
Pricing
Plans
Availability
Offer

[ View ]
[ Purchase ]
```

Mais Omni doit pouvoir rattacher l'offre à :

```text
Company
↓
Facility / origin
↓
Digital product
```

Une entreprise digitale n'est donc pas exclue de la représentation géographique.

---

# 42. SCREEN 41 — UNCLAIMED FACILITY

Omni doit pouvoir représenter une facility même sans propriétaire inscrit.

```text
ABC Market Stall

Unclaimed facility

Furniture

Products discovered:
...

[ Are you the owner?
  Claim this facility ]
```

Unclaimed :

```text
DISCOVERABLE = YES
CONTENT = YES
TRANSACTION = NO
OWNER CONTROL = NO
```

C'est essentiel pour la promesse :

> **Omni représente le monde avant même que tout le monde ait rejoint Omni.**

---

# 43. SCREEN 42 — CLAIM FACILITY

```text
Is this your facility?

ABC Market Stall

[ Yes, it's mine ]
```

Puis :

```text
Verify identity
↓
Facility certification
↓
Seller access
```

---

# 44. SCREEN 43 — SEARCH WITH NO RESULT

Il ne faut jamais donner :

> "No results."

comme unique réponse.

```text
We couldn't find this yet.

[ Save this search ]

We'll use this request to understand demand.

Search:
"Samsung A55"

[ Notify me if found ]
```

Cela crée un signal de demande.

Le modèle prévoit déjà un Wishlist / demand signal pour les produits absents de la plateforme.

---

# 45. SCREEN 44 — SEARCH HISTORY

```text
RECENT SEARCHES

Printer cartridge
Black office chairs
Samsung A55
Laptop under 500k

[ Search again ]
```

---

# 46. SCREEN 45 — SAVED DEMAND

```text
MY REQUESTS

Samsung A55
● Looking for supply

Black office chairs
● 20 units

[ Search again ]
[ Remove ]
```

---

# 47. SCREEN 46 — BUYER ACCOUNT

```text
ACCOUNT

My transactions
Availability requests
Saved searches
Search history
Notifications
Credits
Subscription
Settings

────────────

Switch to Seller
```

---

# 48. SCREEN 47 — SELLER ACCOUNT

```text
SELLER

Facilities
Products
Requests
Orders
Inventory
Transactions
Offers
Agent
Analytics
Subscription

────────────

Switch to Buyer
```

---

# 49. SCREEN 48 — NOTIFICATIONS

Les notifications doivent être contextuelles.

```text
ABC Furniture confirmed your request
→ Open availability result

Transaction verified
→ Open transaction

Payment confirmed
→ Open transaction

Product ready
→ Open order
```

Chaque notification opérationnelle doit deep-linker directement vers son contexte.

---

# 50. SCREEN 49 — TRANSACTION ERROR STATES

## QR expired

```text
This transaction QR has expired.

Your transaction is still active.

[ Generate new QR ]
```

Même transaction.

Même coupon.

Nouveau token.

## QR already used

```text
This QR has already been used.

No action is required.
```

Ces deux états sont explicitement définis dans la machine transactionnelle existante.

---

# 51. SCREEN 50 — SELLER SCANNER

```text
SCAN OMNI TRANSACTION

       CAMERA

or

[ Enter transaction code ]

────────────────

Recent transactions
```

Un vendeur mobile doit pouvoir faire toute la vérification sans ordinateur.

---

# 52. V1 — WHAT IS ACTUALLY BUILT

## BUILD NOW

```text
✓ Account
✓ Buyer/Seller dual identity
✓ Map
✓ Search
✓ Geographic filtering
✓ Facility discovery
✓ Product discovery
✓ Facility page
✓ Product catalogue
✓ Multi-product availability request
✓ Manual seller availability
✓ Availability responses
✓ Availability result
✓ Purchase intent
✓ Omni discount
✓ Transaction
✓ Transaction QR
✓ QR verification
✓ Transaction chat
✓ External QR sharing
✓ Seller contact unlock
✓ Route unlock
✓ External payment
✓ Payment declaration
✓ Seller payment confirmation
✓ Fulfilment
✓ Transaction completion
✓ Transaction history
✓ Seller mobile operations
✓ Omni allocated stock
✓ Manual stock adjustment
✓ Basic facility onboarding
✓ Claim/certification mechanism
✓ Unclaimed facilities
✓ Search demand signal
```

---

# 53. V1-MANUAL

Certain things can exist without being automated.

```text
OSM / facility population
Certification
Seller onboarding
Availability operations
Stock corrections
Bulk availability dispatch
Support
Data correction
```

Le principe est :

> **ne pas supprimer une capacité simplement parce que l'automatisation n'existe pas encore.**

On peut faire fonctionner le workflow manuellement derrière l'interface.

---

# 54. DEFERRED — NOT V1

```text
3D discovery
Global globe choreography
Full Street View-like experience
Visual search
Video search
Fully autonomous seller agent
Fully autonomous buyer agent
Automatic availability
Large-scale bulk availability
Automatic inventory integrations
Background live tracking
Advanced offline sync
Digital provisioning integrations
Behavioral advertising
Sponsored agent results
Commercial intelligence API
Global supply graph
Advanced spatial advertising
```

Le document maître confirme cette logique : la destination est beaucoup plus large que la prochaine version.

---

# 55. CORE DATA MODEL — V1

```text
User
 ├── Profile
 ├── Buyer activity
 └── Seller memberships

Company
 └── Facilities

Facility
 ├── Location
 ├── State
 ├── Products
 ├── Services
 ├── Offers
 └── Inventory

Product
 ├── Price
 ├── Omni discount
 └── Omni allocated stock

Search
 ├── Intent
 ├── Constraints
 └── Results

AvailabilityRequest
 ├── Buyer
 ├── Facility
 └── Items

AvailabilityResponse
 ├── Status
 ├── Quantity
 └── Timestamp

Transaction
 ├── Buyer
 ├── Facility
 ├── Items
 ├── Coupon
 ├── QR
 ├── Payment
 └── Fulfilment

TransactionEvent
 ├── Created
 ├── Verified
 ├── Payment declared
 ├── Payment confirmed
 ├── Fulfilled
 └── Completed
```

Les entités fondamentales existent déjà dans la proposition de modèle de données précédente, notamment facilities, products, inventory, availability requests/responses, orders, transactions, QR tokens et transaction events.

---

# 56. THE ACTUAL OMNI V1 LOOP

Tout doit revenir à cette boucle :

```text
                    WORLD
                      ↓
                  FACILITY
                      ↓
                PRODUCT/SERVICE
                      ↓
                    SEARCH
                      ↓
                  CONSTRAINTS
                      ↓
                  DISCOVERY
                      ↓
                AVAILABILITY
                      ↓
                 RESPONSE
                      ↓
               BEST MATCH
                      ↓
               I WANT TO BUY
                      ↓
                 TRANSACTION
                      ↓
                     QR
                      ↓
               SELLER VERIFY
                      ↓
                   PAYMENT
                      ↓
                 FULFILMENT
                      ↓
                 COMPLETION
                      ↓
                    DATA
                      ↓
              BETTER DISCOVERY
```

C'est cette boucle qui fait d'Omni quelque chose de différent d'un annuaire, de Google Maps ou d'une delivery app.

---

# 57. THE PRINCIPLE THAT MUST NOT BE LOST

Omni ne dit pas :

> "Voici les entreprises qui ont décidé de rejoindre notre marketplace."

Omni dit :

> **"Voici ce qui existe dans le monde, où cela existe, et ce qui peut réellement répondre à votre besoin."**

Puis progressivement :

> **"Voici ce qui est disponible maintenant."**

Puis :

> **"Voici ce qui peut être acheté à travers Omni."**

Et enfin :

> **"Voici ce qui s'est réellement passé."**

C'est cette progression qui permet à Omni de commencer comme **une carte searchable de l'offre mondiale**, puis de devenir progressivement une représentation transactionnelle du monde commercial.

Le document existant résume déjà cette ambition comme une évolution de l'indexation de l'offre vers une représentation beaucoup plus riche du supply, de la demande, de l'inventaire et des transactions.

---

# 58. FINAL V1 PRODUCT SURFACE

Si nous devions remettre demain le document à un développeur, je réduirais l'application à ces surfaces :

### BUYER

```text
01 Map Home
02 Search
03 Search Constraints
04 Search Results
05 Facility Preview
06 Facility Page
07 Product Selection
08 Availability Builder
09 Availability Waiting
10 Availability Result
11 Multi-Facility Comparison
12 Purchase Intent
13 Transaction Room
14 QR
15 Payment
16 Fulfilment
17 Completed Transaction
18 Transaction History
19 Saved Searches
20 Account
```

### SELLER

```text
21 Seller Home
22 Facility
23 Products
24 Product Edit
25 Omni Allocated Stock
26 Availability Requests
27 Availability Response
28 Orders
29 Transaction
30 QR Scanner
31 Payment Confirmation
32 Fulfilment
33 Offers / Discounts
34 Automation
35 Seller Account
```

### SYSTEM

```text
36 Facility Claim
37 Certification
38 Unclaimed Facility
39 Search Demand Signal
40 Notifications
41 Admin / Data correction
42 Search quality
43 Transaction ledger
```

**C'est ça, à mon sens, la maquette V1 que nous pouvons maintenant donner au développement.**

Et surtout : **je ne rajouterais pas encore 50 fonctionnalités parce qu'elles sont présentes dans la vision Omni.** Le scope gate existant dit exactement pourquoi : le prochain milestone est de faire fonctionner le loop réel de façon fiable, pas de construire prématurément Omni mature.

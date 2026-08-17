# Omni V1 — Wireframes de refonte des flux fragmentés

Objectif : remplacer les surfaces éclatées (availability, intention, QR, paiement, timeline, chat, requests vendeur, menu) par des surfaces continues, une décision par écran. La carte reste la maison ; tout le reste est une couche empilée dessus qui s'ouvre, se décide, se ferme.

## Lot 0 — Prérequis bloquant

Toutes les routes sauf `/auth` cassent à l'hydratation (`AsyncLocalStorage is not a constructor`) : carte sans canvas, `/onboarding` figé, `/admin` vide. Cause : `src/lib/auth-middleware.ts` n'a pas d'extension `.server` et entraîne `neon-auth.server` → `db.server` → driver Neon dans le bundle navigateur. Correction avant toute refonte, plus un garde-fou automatisé qui échoue si un module `.server` ou un built-in Node entre dans le bundle client.

## Principe de navigation : une pile, pas des panneaux concurrents

```text
CARTE (toujours vivante, jamais remplacée)
  └─ SHEET niveau 1   résultats / fiche
       └─ SHEET niveau 2   availability  (3 étapes, une seule sheet)
            └─ PLEIN ÉCRAN  transaction  (fil unique, QR inclus)
```

Règles : jamais plus de deux niveaux de sheet ; retour = un geste (swipe bas / Échap / flèche) ; le focus revient sur l'élément déclencheur ; chaque sheet a un header collant, un contenu scrollable, un footer d'action collant.

## 1. Availability — une sheet, trois étapes

Aujourd'hui : formulaire, quota, liste de demandes et réponses cohabitent dans le même panneau, mode manuel et bulk mélangés. Cible :

```text
┌──────────────────────────────────────┐
│ ←  Vérifier la disponibilité   1/3  │  header collant + progression
├──────────────────────────────────────┤
│ QUOI                                 │
│ [ ciment 50 kg                    ]  │
│ Quantité   [ − ] 4 [ + ]             │
│ Variante   ⌄ (si le produit en a)    │
├──────────────────────────────────────┤
│           (contenu scrollable)       │
├──────────────────────────────────────┤
│              [  Continuer  ]         │  footer collant
└──────────────────────────────────────┘

Étape 2 — OÙ
┌──────────────────────────────────────┐
│ ←  Vérifier la disponibilité   2/3  │
│  ( ) Ce commerce — Chez Ama          │
│  (•) Les 12 résultats visibles       │
│      Quota bulk : 2 / 3 ce mois-ci   │
│      [ mini-carte des 12 pins ]      │
│              [  Continuer  ]         │
└──────────────────────────────────────┘

Étape 3 — CONTRAINTES
┌──────────────────────────────────────┐
│ ←  Vérifier la disponibilité   3/3  │
│  Distance max   [ 2 km ▁▂▃ ]         │
│  Réponse avant  [ 2 h ⌄ ]            │
│  Budget max     [ 15 000 ]  🔒 privé │
│  « Jamais transmis au vendeur »      │
│         [  Envoyer la demande  ]     │
└──────────────────────────────────────┘
```

Après envoi, la sheet ne se ferme pas : elle bascule sur l'écran d'attente puis de comparaison.

```text
┌──────────────────────────────────────┐
│ ←  ciment 50 kg · 4 unités           │
│ 5 réponses sur 12 · encore 1 h 12    │
│ Trier : [Prix] [Distance] [Confiance]│
├──────────────────────────────────────┤
│ ★ MEILLEURE OPTION                   │
│ Chez Ama            ● Disponible     │
│ 4/4 · 12 000 F · 800 m · répond 6min │
│ [   Je veux acheter   ]              │
├──────────────────────────────────────┤
│ Quincaillerie Sud   ◐ Partiel        │
│ 2/4 · 11 500 F · 1,4 km              │
│ [ Je veux acheter (2) ]              │
├──────────────────────────────────────┤
│ Dépôt Est           ○ Indisponible   │
└──────────────────────────────────────┘
```

Une card = une réponse = une décision. Les demandes passées sortent d'ici et vivent dans `Menu → Disponibilités`.

## 2. Transaction acheteur — un seul plein écran

Aujourd'hui : intention, commandes, QR, paiement, timeline et chat sont quatre surfaces séparées, les conséquences arrivent par toast. Cible : un plein écran unique, le QR en tête, le fil comme source de vérité, une action à la fois.

```text
┌──────────────────────────────────────┐
│ ←   Chez Ama · ciment 50 kg          │  header collant
│  ①──②──③──④──⑤   Étape 3/5           │  stepper compact
│  48 000 F · 4 unités · retrait       │
├──────────────────────────────────────┤
│        ▛▀▀▀▀▀▀▀▀▀▀▜                  │
│        ▌  QR CODE  ▐   K7QM2PDX      │  carte-ticket repliable
│        ▙▄▄▄▄▄▄▄▄▄▄▟   [Agrandir]     │
│  Valide jusqu'à 18:40 · code manuel  │
├──────────────────────────────────────┤
│  ● Intention créée         10:02     │
│  ● Offre confirmée         10:04     │
│    4 × 12 000 F = 48 000 F           │
│  ● Coupon BIENVENUE −2 000 F 10:05   │  conséquence inline, pas un toast
│  ● QR généré               10:05     │
│  ○ Vérification vendeur    en attente│
│  ○ Paiement                          │
│  ○ Produit reçu                      │
│                                      │
│  [Ama] Je vous garde les 4 sacs.     │  messages dans le même fil
│  [Vous] J'arrive dans 20 min.        │
├──────────────────────────────────────┤
│ [ Écrire un message ]  [ J'ai payé ] │  footer : 1 champ + 1 action max
└──────────────────────────────────────┘
```

- Les événements système et les messages humains partagent le même fil, différenciés visuellement (puce d'état vs bulle).
- Le QR se réduit en bandeau une fois consommé, remplacé par « Vérifié par le vendeur à 10:31 ».
- Erreurs (QR déjà utilisé, expiration, paiement rejeté) : card d'événement rouge dans le fil avec l'action de reprise, jamais un toast seul.
- Côté vendeur : exactement le même écran, actions inversées (`Vérifier le QR`, `Confirmer l'encaissement`).

## 3. Vendeur — deux vues, zéro surface orpheline

```text
┌──────────────────────────────────────┐
│ Ma boutique   ● En ligne   12 400 F  │
│      [ Carte ]  [ Console ]          │
├──────────────────────────────────────┤
│ CONSOLE                              │
│  Facilities        2                 │
│  Catalogue         18 produits       │
│  Demandes          3 en attente  ●   │
│  Transactions      1 en cours    ●   │
│  Promotions        1 active          │
│  Publicité         —                 │
│  Solde & Plan      12 400 F · Pro    │
│  Paramètres                          │
└──────────────────────────────────────┘
```

Toutes les sections implémentées sont listées ici (solde, plan, paramètres, agent inclus) : plus de tab orpheline. Chaque section = métriques en tête + liste dense + actions inline.

Répondre à une demande, en un geste, depuis la liste ou la notification :

```text
┌──────────────────────────────────────┐
│ ciment 50 kg · 4 unités · 800 m      │
│ Demandé il y a 6 min                 │
│ [ Disponible ] [ Partiel ] [ Non ]   │
│  ↳ si Partiel :  qté [ 2 ]  prix [ ] │
│                  [ Envoyer ]         │
└──────────────────────────────────────┘
```

Le solde segmenté est explicité en clair : chaque poche indique à quoi elle sert et ce qu'elle autorise (`Recharge — utilisable pour abonnement et pub`, `Gains — retirable`), avec l'action permise sur chaque ligne.

## 4. Menu — trois groupes, pas un empilement

```text
┌──────────────────────────────────────┐
│  Kossi A.   Pro · Solde 3 200 F      │
│  [ Acheteur ]     Vendeur            │  bascule de rôle isolée en tête
├──────────────────────────────────────┤
│  ACTIVITÉ                            │
│   Disponibilités              2 ●    │
│   Transactions                1 ●    │
│   Messages                    3 ●    │
│   Recherches enregistrées     7      │
├──────────────────────────────────────┤
│  COMPTE                              │
│   Profil · Plan · Solde · Notifs     │
├──────────────────────────────────────┤
│  Aide          Déconnexion           │
└──────────────────────────────────────┘
```

Chaque ligne porte sa valeur à droite. Les doublons actuels (« Produits recherchés » / « Recherches », « Vérifier la disponibilité » / « Disponibilités ») disparaissent.

## 5. États d'entrée : jamais de vide ni d'attente infinie

```text
Carte en échec              Auth / onboarding / admin
┌───────────────────┐       ┌───────────────────┐
│   Carte           │       │  Vérification…    │  ≤ 5 s
│   indisponible    │  →    │  puis :           │
│ [ Réessayer ]     │       │  • connecté  → contenu
│ Réseau instable ? │       │  • déconnecté→ /auth
└───────────────────┘       │  • refusé → « Accès réservé »
                            └───────────────────┘
```

- Chaque surface chargée en différé a son propre squelette local, son état vide et son état d'erreur avec `Réessayer`.
- Formulaire d'auth sémantique (`<form>`, `type=email`, `autocomplete`) : Entrée soumet, l'autofill mobile fonctionne.
- Les contrôles carte se réduisent à trois : zoom +, zoom −, me recentrer. Le vocabulaire technique (diagnostic, exploration approximative, précision) sort de l'écran principal.
- Le bouton « Affiner » redevient secondaire : icône discrète à côté de la recherche, jamais de la même taille que l'action principale.
- Accessibilité : cards et pins comme un seul contexte de sélection annoncé, cibles ≥ 44px, retour du focus au déclencheur à la fermeture, Échap ferme un seul niveau, changements d'état annoncés en région live.

## Détails techniques

- Nouvelles primitives partagées sous `src/components/omni/ui/` : `OmniSheet` (header collant, scroll, footer d'action, gestion du focus et d'Échap), `OmniStepper`, `OmniStatusBadge`, `OmniEmptyState`, `OmniErrorState`, `OmniSkeleton`.
- Availability : une seule sheet à étapes remplaçant `DemandRequestPanel`, l'historique déplacé dans le menu.
- Transaction : nouvelle route plein écran acheteur/vendeur alimentée par `transaction_events` (déjà en base) et `messages.transaction_id`, fusionnant `OrdersPanel`, `ChatPanel`, QR et paiement.
- Vendeur : `src/routes/vendeur.tsx` (1216 lignes) éclaté en sections sous `src/components/omni/vendor/console/`, toutes routées depuis la console.
- Refonte de présentation : server functions, migrations et règles métier existantes réutilisées telles quelles.

## Ordre de livraison

1. Lot 0 — déblocage runtime et garde-fou.
2. Transaction acheteur/vendeur en fil unique (sécurité et lisibilité des conséquences).
3. Availability en sheet à trois étapes + écran de comparaison.
4. Console vendeur complète (aucune surface orpheline) et réponse en un geste.
5. Menu, états d'entrée, accessibilité, certification device.

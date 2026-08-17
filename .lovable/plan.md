# Omni V1 — Carte animée, flux continus, Omni Wallet

Fusion des deux directions : la carte/globe est la scène permanente, les opérations sont des couches au-dessus, et les points bloquants V1 (caméra, formulaires vendeur, paiement carte, soldes ambigus) sont traités dans le même mouvement.

## Lot 0 — Déblocage runtime (bloquant)

Toutes les routes sauf `/auth` cassent à l'hydratation (`AsyncLocalStorage is not a constructor`) : carte sans canvas, `/onboarding` figé, `/admin` vide. Cause : `src/lib/auth-middleware.ts` n'a pas d'extension `.server` et entraîne `neon-auth.server` → `db.server` → driver Neon dans le bundle navigateur. Correction + garde-fou automatisé qui échoue si un module `.server` ou un built-in Node entre dans le bundle client. Rien d'autre n'est mesurable avant.

## Grammaire unique : une scène, des couches

```text
GLOBE / CARTE  (jamais remplacée, jamais grise)
  └─ RAIL horizontal   résultats scrollables, synchronisés carte ↔ cards
       └─ SHEET        fiche / availability (3 étapes)
            └─ PLEIN ÉCRAN  transaction (fil unique, QR inclus)
```

Deux niveaux de sheet maximum, retour en un geste, focus rendu au déclencheur, header collant + contenu scrollable + footer d'action collant partout.

### Machine d'animation de la carte

États : `idle → locating → searching → revealing-region → revealing-results → selected → transaction`.

- `idle` : globe en rotation horizontale lente, labels réduits.
- Recherche réelle : arrêt de la rotation, surbrillance continent → pays → région → zone avec pause courte à chaque palier, puis zoom sur les résultats.
- Changement de recherche : retour globe sans flash ni fond gris.
- Transitions interruptibles, aucune auto-zoom au repos, `prefers-reduced-motion` respecté (fondus courts à la place).
- Sélection d'une card = la carte cadre le pin ; sélection d'un pin = la card se centre dans le rail. Un seul contexte de sélection, annoncé en région live.

## 1. Résultats : rail horizontal au-dessus de la carte

La direction validée : garder le panneau scrollable horizontal, l'améliorer plutôt que le remplacer par une liste verticale.

```text
                 ●            ●          ← pins, celui de la card active grossit
        ●   ◉ vous
────────────────────────────────────────
 ‹ ┌──────────┐┌──────────┐┌──────────┐ ›
   │ciment 50k││ciment 50k││ciment 50k│
   │12 000 F  ││11 500 F  ││13 000 F  │
   │800 m ●dispo│1,4 km ◐ ││2,1 km ○  │
   └──────────┘└──────────┘└──────────┘
   [ 🔎 rechercher…            ]  [⚙]   ← dock, « Affiner » discret
```

L'objet cherché passe avant le nom du commerce. Le rail respire (peek de la card suivante), snap au scroll, swipe mobile, flèches desktop. Cette structure est déjà la bonne base pour l'agent IA plus tard : il pourra piloter le rail et la caméra carte comme un utilisateur.

## 2. Availability — une sheet, trois étapes

```text
┌──────────────────────────────────────┐
│ ←  Vérifier la disponibilité   1/3   │
│ QUOI   [ ciment 50 kg            ]   │
│ Quantité  [ − ] 4 [ + ]   Variante ⌄ │
│              [  Continuer  ]         │
└──────────────────────────────────────┘
Étape 2 — OÙ : la carte reste visible derrière et cadre la cible
   ( ) Ce commerce — Chez Ama
   (•) Les 12 résultats visibles   quota bulk 2/3
Étape 3 — CONTRAINTES : distance, délai, budget 🔒 privé
```

Après envoi la sheet ne se ferme pas : attente animée (pins des cibles qui s'allument à chaque réponse), puis comparaison.

```text
│ ciment 50 kg · 4 unités · 5/12 réponses · 1 h 12 │
│ Trier : [Prix] [Distance] [Confiance]            │
│ ★ Chez Ama  ● Dispo  4/4 · 12 000 F · 800 m      │
│   [ Je veux acheter ]                            │
│   Quincaillerie Sud ◐ Partiel 2/4 · 11 500 F     │
```

Une card = une réponse = une décision. L'historique part dans `Menu → Disponibilités`.

## 3. Transaction — un seul plein écran

```text
│ ←  Chez Ama · ciment 50 kg      ①─②─③─④─⑤ 3/5 │
│ [ QR K7QM2PDX · valide 18:40 · Agrandir ]      │
│ ● Intention créée 10:02                        │
│ ● Offre confirmée 4 × 12 000 = 48 000 F        │
│ ● Coupon BIENVENUE −2 000 F      ← inline      │
│ ○ Vérification vendeur · ○ Paiement · ○ Reçu   │
│ [Ama] Je garde les 4 sacs.                     │
│ [ Écrire… ]                    [ J'ai payé ]   │
```

Événements système et messages dans le même fil. QR réduit en bandeau une fois consommé. Erreurs (QR rejoué, expiration, paiement refusé) = card rouge dans le fil avec l'action de reprise, jamais un toast seul. Vendeur : même écran, actions inversées.

## 4. Vendeur — même langage que l'acheteur

Pas de dashboard opaque : le vendeur garde la carte, avec ses facilities et l'aperçu exact de ce que voit un acheteur, et une console accessible en bascule.

```text
│ Ma boutique  ● En ligne  Omni Wallet 12 400 F │
│        [ Carte ]   [ Console ]                │
│ Facilities 2 · Catalogue 18 · Demandes 3 ●    │
│ Transactions 1 ● · Promos 1 · Pub — · Wallet  │
│ Agent · Paramètres                            │
```

Aucune surface implémentée n'est inaccessible (wallet, plan, paramètres, agent inclus).

**Créer un produit en 5 écrans à objectif unique** : Produit (nom, catégorie, prix, quantité) → Média (photo/vidéo ou placeholder) → Visibilité (actif + correspondance recherche) → Coupon facultatif → Résumé et publication. Champs avancés repliés derrière « Affiner », validation inline, un seul CTA, état `saving`, reprise après erreur.

**Coupon lisible** : code généré ou saisi, remise % ou montant, période, quota et produit ciblés facultatifs, aperçu « Le client économise 2 000 F ». Aucune logique technique exposée.

**Répondre à une demande en un geste** : produit demandé en tête, `[Disponible] [Partiel] [Non]`, quantité/prix seulement si pertinents, confirmation visible dans la timeline.

## 5. Caméra QR réellement fonctionnelle

Demande `getUserMedia` uniquement sur le geste « Scanner avec la caméra », jamais au chargement. Caméra arrière préférée, contexte sécurisé vérifié, stream arrêté au démontage et à la fermeture.

États explicites : `idle → requesting → active → denied → unsupported → error`, chacun avec son texte et sa sortie (réessayer, ouvrir les réglages, saisir le code manuellement — toujours visible). Le code serveur existant (format, facility, expiration, idempotence) reste la barrière de sécurité.

## 6. FedaPay — paiement carte honnête

Auditer le contrat réel (`fedapay.server.ts`, `payments.server.ts`) et n'exposer que ce que FedaPay supporte : checkout hébergé ou composant officiel. Aucun formulaire carte maison, aucune donnée sensible dans Omni.

Parcours : montant → moyens réellement activés (dont carte) → redirection/élément officiel → `pending / approved / declined / canceled` + retry, montant et référence vérifiés serveur, webhook signé et rejouable sans double crédit. Si la carte dépend d'une activation côté FedaPay indisponible, l'UI le dit clairement — jamais de succès simulé.

## 7. Omni Wallet unique

Un seul portefeuille rechargeable nommé **Omni Wallet**. Les cinq buckets du ledger restent intacts côté comptable mais deviennent des *allocations* dans l'UI, pas des portefeuilles concurrents.

```text
│  Omni Wallet            12 400 F              │
│  [ Recharger ]                                │
│  Alloué :  Pro 5 000 · Publicité 2 000        │
│            Crédits recherche 1 200            │
│  Disponible à allouer : 4 200 F               │
│  Les paiements clients in-app et les retraits │
│  vendeur ne sont pas disponibles en V1.       │
```

Tous les CTA « Retirer / Withdraw / payout disponible » sont retirés du vendeur ; l'historique reste auditable côté admin. Chaque consommation garde sa clé d'idempotence et son bucket source.

## 8. États d'entrée : jamais de vide ni d'attente infinie

Carte en échec → « Carte indisponible · Réessayer ». Auth/onboarding/admin → vérification bornée à 5 s puis contenu, redirection `/auth`, ou « Accès réservé ». Chaque surface différée a squelette, état vide et état d'erreur avec `Réessayer`. Formulaire d'auth sémantique (Entrée soumet, autofill mobile). Contrôles carte réduits à zoom +, zoom −, recentrer ; le vocabulaire technique (diagnostic, précision, exploration approximative) sort de l'écran. Cibles ≥ 44 px, Échap ferme un seul niveau, focus restitué.

## Détails techniques

- Primitives partagées `src/components/omni/ui/` : `OmniSheet`, `OmniStepper`, `OmniStatusBadge`, `OmniEmptyState`, `OmniErrorState`, `OmniSkeleton`, plus un nouveau `OmniResultRail`.
- Machine d'animation carte isolée dans un module testable, pilotée par `src/lib/omni-state.ts` ; `MapCanvas` ne fait qu'exécuter les caméras demandées.
- Transaction : route plein écran alimentée par `transaction_events` et `messages.transaction_id`, fusionnant `OrdersPanel`, `ChatPanel`, QR et paiement.
- `src/routes/vendeur.tsx` (1216 l.) et `src/routes/carte.tsx` (978 l.) éclatés en sections ; wallet et paiement restent côté serveur, l'UI ne change que la présentation et les permissions.
- Logo fourni décliné en favicon et marque compacte, jamais un nouveau logo.
- Tests : états caméra, machine d'animation, validation produit/coupon, allocation wallet, absence de CTA retrait, statuts FedaPay carte, QR valide/expiré/rejoué, webhook signé et rejoué.
- Certification visuelle à 320 / 375 / 390 / 768 / 1280 px : globe visible, aucune auto-zoom au repos, zéro débordement horizontal.

## Ordre de livraison

1. Lot 0 — déblocage et garde-fou.
2. Machine d'animation carte + rail de résultats.
3. Transaction en fil unique (acheteur et vendeur).
4. Availability en trois étapes + comparaison.
5. Vendeur simplifié : produit, coupon, réponse en un geste, console complète.
6. Caméra QR, FedaPay carte, Omni Wallet unique.
7. États d'entrée, accessibilité, tests et certification device.

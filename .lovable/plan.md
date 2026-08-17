# Omni V1 — Wireframe complet de l'interface

Tous les écrans, tous les flux, toutes les interactions. Une seule scène (la carte), des couches atomiques au-dessus, mobile-first, animé mais jamais décoratif.

## Lot 0 — Déblocage runtime (bloquant)

Toutes les routes sauf `/auth` cassent à l'hydratation (`AsyncLocalStorage is not a constructor`) : carte sans canvas, `/onboarding` figé, `/admin` vide. Cause : `src/lib/auth-middleware.ts` n'a pas l'extension `.server`, ce qui entraîne `neon-auth.server` → `db.server` → driver Neon dans le bundle navigateur. Correction + garde-fou automatisé. Rien d'autre n'est vérifiable avant.

## Grammaire globale

```text
SCÈNE      globe / carte — jamais remplacée, jamais grise
COUCHE 1   dock de recherche + rail de résultats
COUCHE 2   sheet (fiche, availability, itinéraire, wallet…)
COUCHE 3   plein écran (transaction, création produit, onboarding)
CHROME     haut-droite : notifications + menu.  gauche : + / − / recentrer
```

Règles atomiques : un écran = une décision ; un seul CTA primaire visible ; deux niveaux de sheet maximum ; retour en un geste (swipe bas, Échap, flèche) ; focus rendu au déclencheur ; header collant + scroll interne + footer d'action collant ; cibles ≥ 44 px ; safe-areas respectées.

### Machine d'états de la scène

`idle → locating → searching → revealing-region → revealing-results → selected → routing → transaction`

- `idle` : globe, rotation horizontale lente, labels réduits.
- `locating` : atterrissage par paliers Globe → Continent → Pays → Région → Quartier, pause brève et surbrillance à chaque palier, pin utilisateur à l'arrivée.
- `searching` : rotation arrêtée, pins existants estompés.
- `revealing-results` : pins qui apparaissent en cascade (30 ms d'écart), cadrage sur utilisateur + résultats pertinents.
- `selected` : pin actif agrandi, halo, carte décalée pour laisser la place à la sheet.
- `routing` : tracé animé du départ vers l'arrivée, caméra qui suit la ligne.
- Transitions interruptibles ; `prefers-reduced-motion` → fondus courts uniquement ; aucune auto-zoom au repos.

---

## 1. Écran d'accueil = carte (`/`)

```text
┌───────────────────────────────────────────┐
│                                    🔔  ☰  │  chrome minimal
│                                           │
│  +          ·  ●        ● ← pins fins     │
│  −             ◉ vous (halo pulsé lent)   │
│  ◎                ●                       │
│                                           │
│   ‹ ┌────────┐┌────────┐┌────────┐ ›      │  rail (si résultats)
│     │produit ││produit ││produit │        │
│     └────────┘└────────┘└────────┘        │
│  ┌─────────────────────────────────────┐  │
│  │ 🔎  Que cherchez-vous ?     🎙 📷 ⌃ │  │  dock verre, bas centré
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

- Chevron `⌃` ouvre une rangée de catégories scrollables (Tout, Alimentation, Santé, Mode, Tech, Services…).
- `🎙` micro avec waveform animée pendant l'écoute ; `📷` recherche par image.
- « Affiner » devient une icône discrète `⚙` dans le dock, jamais un bouton de même poids que la recherche.
- Sans compte : la carte est consultable, la soumission d'une recherche ouvre le mur de compte.

## 2. Résultats — rail horizontal synchronisé

```text
        ●        ◉vous     ●(actif, agrandi)
────────────────────────────────────────────
 ‹ ┌───────────┐┌───────────┐┌───────────┐ ›
   │Ciment 50kg││Ciment 50kg││Ciment 50kg│
   │12 000 F   ││11 500 F   ││13 000 F   │
   │800 m ●dispo││1,4 km ◐  ││2,1 km ○   │
   │Chez Ama ✓ ││Quinc. Sud ││Dépôt Est  │
   └───────────┘└───────────┘└───────────┘
   12 commerces trouvés          [ Trier ⌄ ]
```

L'objet cherché passe avant le nom du commerce. Snap au scroll, peek de la card suivante, swipe mobile / flèches desktop. Card ↔ pin : un seul contexte de sélection, annoncé en région live. Cette structure est prête pour l'agent IA qui pilotera rail et caméra comme un utilisateur.

## 3. Fiche commerce (sheet niveau 1)

```text
│ ▁▁▁                                   ✕  │
│ [ média ▸ ▸ ▸ ]        ● Ouvert · 800 m  │
│ Chez Ama              ✓ Certifié  ★ 4,6  │
│ ─────────────────────────────────────────│
│ CE QUE VOUS CHERCHEZ                      │
│ Ciment 50 kg — 12 000 F  ● En stock       │
│ ─────────────────────────────────────────│
│ Autres produits pertinents  (2)           │
│ ─────────────────────────────────────────│
│ [ Vérifier la disponibilité ]   ← 1 CTA   │
│  Itinéraire et contact après l'intention  │
```

Contact direct et itinéraire détaillé restent masqués avant l'intention d'achat.

## 4. Availability — une sheet, trois étapes

```text
1/3 QUOI        [ ciment 50 kg ]  qté [−] 4 [+]  variante ⌄
2/3 OÙ          ( ) Ce commerce — Chez Ama
                (•) Les 12 résultats visibles   quota bulk 2/3
                la carte derrière cadre les cibles en direct
3/3 CONTRAINTES distance max ▁▂▃ · réponse avant ⌄ · budget 🔒 privé
                [ Envoyer la demande ]
```

Puis, sans fermer la sheet :

```text
│ ciment 50 kg · 4 unités                   │
│ 5 réponses sur 12 · encore 1 h 12         │  pins des répondants qui s'allument
│ Trier : [Prix] [Distance] [Confiance]     │
│ ★ Chez Ama ● Dispo 4/4 · 12 000 F · 800 m │
│   [ Je veux acheter ]                     │
│   Quincaillerie Sud ◐ Partiel 2/4         │
│   Dépôt Est ○ Indisponible                │
```

Une card = une réponse = une décision. L'historique vit dans `Menu → Disponibilités`.

## 5. Transaction — plein écran, fil unique

```text
│ ←  Chez Ama · ciment 50 kg    ①─②─③─④─⑤  │
│ 48 000 F · 4 unités · retrait             │
│ ┌───────────────────────────────────────┐ │
│ │   ▛▀▀▀▜  QR   K7QM2PDX   [Agrandir]   │ │
│ │   ▙▄▄▄▟  valide jusqu'à 18:40         │ │
│ └───────────────────────────────────────┘ │
│ ● Intention créée              10:02      │
│ ● Offre confirmée 4 × 12 000 = 48 000 F   │
│ ● Coupon BIENVENUE −2 000 F    10:05      │  conséquence inline
│ ● QR généré                    10:05      │
│ ○ Vérification vendeur · ○ Paiement       │
│ [Ama] Je garde les 4 sacs.                │
│ [Vous] J'arrive dans 20 min.              │
│ [ Écrire… ]                 [ J'ai payé ] │
```

Événements système (puces) et messages (bulles) dans le même fil. QR réduit en bandeau une fois consommé (« Vérifié à 10:31 »). Erreurs (QR rejoué, expiration, paiement refusé) = card rouge dans le fil avec l'action de reprise, jamais un toast seul. Vendeur : même écran, actions inversées (`Scanner le QR`, `Confirmer l'encaissement`).

## 6. Itinéraire (débloqué après l'intention)

```text
│  carte plein écran, tracé animé du départ │
│  vers l'arrivée, caméra qui suit la ligne │
│  ┌─────────────────────────────────────┐  │
│  │ 🚶 12 min · 850 m   [Marche][Moto]  │  │  sheet basse compacte
│  │ ↱ Rue du Marché — 200 m             │  │
│  │ ↰ Av. de la Paix — 400 m            │  │
│  │ [ Ouvrir dans Maps ]  [ Terminé ]   │  │
│  └─────────────────────────────────────┘  │
```

Sheet réductible en une barre « 12 min · 850 m » pour laisser la carte respirer. Recentrage automatique sur la position si l'utilisateur bouge, bouton `◎` pour reprendre le suivi après un déplacement manuel.

## 7. Onboarding

```text
Acheteur (plein écran, skippable, reprise possible)
  ① Bienvenue — une phrase, le logo, [Commencer]
  ② Localisation — animation Globe→Continent→Pays→Quartier
  ③ Centres d'intérêt — chips multi-sélection
  ④ Dépôt direct sur la carte

Vendeur (étapes persistantes)
  ① Identité  ② Facility posée sur la carte  ③ Catégorie
  ④ Premier produit  ⑤ Horaires  ⑥ « Ce que voit un acheteur »
```

## 8. Auth

```text
│         ◉ logo Omni                       │
│  [ Connexion ] [ Créer un compte ]        │
│  <form> e-mail (type=email, autocomplete) │
│         mot de passe                      │
│         [ Se connecter ]  Entrée soumet   │
│  ── ou ──  [ Continuer avec Google ]      │
│  Démo : demo@omni.tg                      │
```

## 9. Vendeur — carte + console

```text
│ Ma boutique  ● En ligne  Omni Wallet 12 400 F │
│         [ Carte ]  [ Console ]                │
│ Facilities 2 · Catalogue 18 · Demandes 3 ●    │
│ Transactions 1 ● · Promotions 1 · Publicité — │
│ Wallet · Agent · Paramètres                   │
```

Vue Carte : seulement ses facilities, aperçu exact de la fiche acheteur, position éditable. Aucune section implémentée n'est inaccessible.

**Créer un produit — 5 écrans à objectif unique**
```text
① Produit   nom · catégorie · prix · quantité
② Média     photo/vidéo ou placeholder
③ Visibilité actif · correspond à la recherche
④ Coupon    facultatif
⑤ Résumé    aperçu de la card acheteur → [ Publier ]
```
Champs avancés repliés derrière « Affiner », validation inline, état `saving`, reprise après erreur.

**Coupon** : code généré ou saisi, remise % ou montant, période, quota et produit facultatifs, aperçu « Le client économise 2 000 F ».

**Répondre à une demande, un geste**
```text
│ ciment 50 kg · 4 unités · 800 m · il y a 6 min │
│ [ Disponible ]  [ Partiel ]  [ Non ]           │
│  ↳ si Partiel : qté [ 2 ]  prix [ 11 500 ]     │
```

**Scanner QR** : `getUserMedia` uniquement au geste « Scanner avec la caméra », caméra arrière, stream arrêté au démontage. États `idle → requesting → active → denied → unsupported → error`, chacun avec sa sortie ; la saisie manuelle du code reste toujours visible.

## 10. Omni Wallet

```text
│  Omni Wallet                    12 400 F  │
│  [ Recharger ]                            │
│  Alloué : Pro 5 000 · Publicité 2 000     │
│           Crédits recherche 1 200         │
│  Disponible à allouer : 4 200 F           │
│  Paiements clients in-app et retraits     │
│  vendeur : non disponibles en V1.         │
```

Un seul portefeuille rechargeable ; les buckets du ledger restent intacts mais deviennent des allocations dans l'UI. Aucun CTA « Retirer ». Recharge via le parcours FedaPay officiel (checkout hébergé ou composant supporté), états `pending / approved / declined / canceled` + retry, jamais de formulaire carte maison ni de succès simulé.

## 11. Menu et notifications

```text
│ Kossi A.   Pro · Wallet 3 200 F           │
│ [ Acheteur ]   Vendeur                    │
│ ACTIVITÉ   Disponibilités 2 ● · Transactions 1 ● │
│            Messages 3 ● · Recherches 7    │
│ COMPTE     Profil · Plan · Wallet · Notifs│
│ Aide                        Déconnexion   │
```

Chaque ligne porte sa valeur à droite. Notifications groupées par type, chacune deep-linkée vers l'état concerné (recherche, availability, intention, QR, paiement, transaction).

## 12. Admin

En-tête de métriques, puis files de modération (facilities à certifier, litiges, comptes), recherche, action inline. Accès refusé = écran « Accès réservé », jamais une page blanche.

## 13. États systématiques

```text
Chargement → squelette local de la surface (jamais un spinner plein écran)
Vide       → phrase + action utile
Erreur     → cause courte + [ Réessayer ]
Carte KO   → « Carte indisponible » + [ Réessayer ]
Auth       → vérification bornée à 5 s puis contenu / /auth / « Accès réservé »
```

Contrôles carte réduits à trois : `+`, `−`, recentrer. Le vocabulaire technique (diagnostic, précision, exploration approximative) sort de l'écran principal.

## Détails techniques

- Primitives partagées `src/components/omni/ui/` : `OmniSheet`, `OmniStepper`, `OmniStatusBadge`, `OmniEmptyState`, `OmniErrorState`, `OmniSkeleton`, nouveau `OmniResultRail`, nouveau `OmniRouteSheet`.
- Machine d'animation isolée et testable, pilotée par `src/lib/omni-state.ts` ; `MapCanvas` exécute seulement les caméras demandées.
- Transaction : route plein écran alimentée par `transaction_events` et `messages.transaction_id`, fusionnant `OrdersPanel`, `ChatPanel`, QR et paiement.
- `src/routes/vendeur.tsx` et `CartePage` éclatés en sections ; refonte de présentation, server functions et migrations réutilisées telles quelles.
- Logo fourni décliné en favicon et marque compacte.
- Certification à 320 / 375 / 390 / 768 / 1280 px : zéro débordement, zéro auto-zoom au repos, zéro état bloqué.

## Ordre de livraison

1. Lot 0 — déblocage et garde-fou.
2. Scène animée + dock + rail de résultats.
3. Fiche, availability trois étapes, comparaison.
4. Transaction en fil unique + itinéraire.
5. Vendeur simplifié (produit, coupon, demandes, QR) et console complète.
6. Wallet, FedaPay carte, menu, notifications, admin.
7. États systématiques, accessibilité, certification device.

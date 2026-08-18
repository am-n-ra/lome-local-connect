# Omni — Harmonisation UI : un système unique, mobile-first, guidé

Objectif : une seule grammaire visuelle et gestuelle du premier écran jusqu'à la note finale. L'utilisateur ne doit jamais se demander « où suis-je, que dois-je faire maintenant ». Le document produit s'appelle `docs/omni-ui-system.md` et fait autorité sur toutes les surfaces.

## Ce que montrent les captures actuelles(c'est un exemple  creer ailleurs pas notre code )


| Capture                    | Défaut constaté                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fiche « Le Panier Bè »     | La feuille déborde à droite (barre de défilement visible hors cadre), le CTA est collé au bord, pas de marge de sécurité                            |
| Étapes 1/3 → 3/3           | Trois écrans avec trois hauteurs, trois paddings et deux positions de bouton retour différentes ; le retour flotte hors de la feuille en 2/3 et 3/3 |
| « Votre espace »           | Liste correcte mais coupée à droite, aucune hiérarchie entre le portefeuille et les compteurs, « Changer de rôle » perdu dans l'en-tête             |
| Console vendeur desktop    | Contenu tassé en colonne étroite, immense vide en bas, dock `Carte / Console` posé par-dessus les cartes                                            |
| Modale coupon / Scanner QR | Deux systèmes de superposition différents (voile flou centré vs panneau ancré à droite, lui aussi coupé)                                            |
| Parcours vendeur 6/6       | Aperçu miniature illisible, deux CTA concurrents sur le même écran                                                                                  |


Diagnostic : il n'existe pas de contrat de surface. Chaque écran réinvente son enveloppe, son padding, sa position d'action et son mode de superposition. C'est ça qui donne la sensation de patchwork, avant même toute question de style.

## Le système : trois surfaces, une seule action principale

```text
FLOAT   éléments posés sur la carte (dock de recherche, barre de reprise, puces)
SHEET   toute décision : fiche, étapes, compte, coupon, scanner
PAGE    tout ce qui est long et tabulaire : console vendeur, admin
```

Règles non négociables, appliquées partout :

- **Une action principale par écran**, en bas, pleine largeur, dans un pied fixe avec zone de sécurité. Le retour est une icône dans l'en-tête de la feuille — jamais un bouton flottant à côté du CTA.
- **Enveloppe unique** : `min(100vw - 24px, 34rem)` en mobile, largeur fixe centrée au-delà ; `overflow-x` impossible par construction ; défilement uniquement dans le corps, jamais sur l'enveloppe.
- **Un seul mode de superposition** : la feuille monte du bas en mobile, se centre en desktop. Plus de panneau ancré à droite, plus de modale d'un autre type.
- **Rythme unique** : en-tête (sur-titre + titre), corps, pied. Mêmes paddings, mêmes rayons, mêmes tailles de texte partout.
- **Cible tactile 44 px minimum**, y compris les `+` / `−` et le bouton de fermeture.

## Guider, pas seulement afficher

Chaque écran répond à trois questions dans cet ordre : où j'en suis, ce qu'on attend de moi, ce qui se passe ensuite.

- **Fil de progression persistant** sur toute séquence (disponibilité 1→3, transaction 1→5) : même composant, même position, sous le titre.
- **Une phrase de conséquence** sous chaque action principale : « Votre demande part à 11 commerces », « Le vendeur voit votre QR immédiatement », « Il vous reste 46 000 F à payer ».
- **Prochaine étape annoncée** avant de valider, jamais découverte après.
- **États vides utiles** : pas de zone blanche, une phrase + l'action qui débloque.
- **Aucun toast pour une conséquence durable.** Les faits (coupon appliqué, paiement déclaré, réponse vendeur) s'inscrivent dans l'écran concerné.

## Le parcours, écran par écran

```text
CARTE                    RÉSULTATS                FICHE
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   globe      │  →      │  rail bas    │  →      │ photo/badges │
│              │         │ ← carte1 →   │         │ prix · 3,4km │
│ ⌕ Rechercher │         │ suit la carte│         │──────────────│
└──────────────┘         └──────────────┘         │ Vérifier la  │
   dock flottant           1 carte = 1 lieu       │ disponibilité│
                                                   └──────────────┘
        ↓
DISPONIBILITÉ 1→3          COMPARAISON              INTENTION
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ ●○○  Quoi ?  │         │ 3 réponses   │         │ QR + code    │
│ produit / qté│    →    │ ✓ dispo 11800│    →    │ itinéraire   │
│──────────────│         │ ~ partiel    │         │ appeler      │
│  Continuer   │         │ ✗ non        │         │──────────────│
└──────────────┘         └──────────────┘         │ suivi en bas │
  même enveloppe           1 carte = 1 décision    └──────────────┘
  aux 3 étapes
        ↓
TRANSACTION (écran unique, reprenable)
┌───────────────────────────────────────┐
│ ← Chez Ama          ①─②─③─④─⑤         │
│ ┌───────────────────────────────────┐ │
│ │ MAINTENANT : montrez ce QR        │ │  un seul bloc d'action
│ │  ▛▀▜  K7QM2PDX                    │ │  qui se transforme
│ └───────────────────────────────────┘ │  à chaque étape
│ ● Intention créée · ● Coupon −2 000 F │
│ ○ Vérification vendeur…               │
│ [ Écrire un message ]                 │
└───────────────────────────────────────┘
```

Après vérification, le même bloc devient « Transaction confirmée · 46 000 F · Cash / Mobile Money / Livraison », puis « J'ai payé », puis « Reçu », puis la notation. Jamais de changement d'écran.

**Barre de reprise** : tant qu'une transaction est active, une barre fine et tapable reste visible sur la carte et dans la console vendeur. On ne perd jamais le fil.

## Rôle et compte

Le changement de rôle sort de l'en-tête et devient la première ligne de la feuille compte, sous le nom, avec l'état courant lisible :

```text
┌──────────────────────────────────┐
│ Afi Mensah                       │
│ ● Vous êtes en mode Acheteur     │
│ [ Passer en mode Vendeur ]       │  bascule pleine largeur, pas un menu
├──────────────────────────────────┤
│ Portefeuille            42 000 F │
│ Disponibilités                 2 │
│ Transactions                   1 │
│ Messages                       3 │
└──────────────────────────────────┘
```

La bascule est disponible depuis les deux mondes, au même endroit, et ramène à l'écran équivalent — pas à l'accueil.

## Console vendeur

Le dock `Carte / Console` cesse de flotter au-dessus du contenu : il devient un segment dans l'en-tête. En desktop, la console passe en deux colonnes (demandes à gauche, actions et indicateurs à droite) pour supprimer le vide vertical. La demande de disponibilité en cours reste la carte la plus haute, avec trois réponses en un geste. Le scanner QR devient une feuille standard, caméra demandée uniquement au clic, saisie manuelle toujours visible.

## Mouvement

Discret, jamais décoratif. Feuille : glissement 220 ms avec sortie douce. Changement d'étape : translation horizontale de 12 px + fondu. Nouvelle réponse vendeur : la carte apparaît par le haut avec un léger surlignement qui s'éteint. Compteurs : transition numérique courte. Tout est désactivé sous `prefers-reduced-motion`.

## Détails techniques

- `docs/omni-ui-system.md` : surfaces, tokens d'espacement, échelle typographique, règles d'action, matrice d'états (vide / chargement / erreur / succès), tableau de correspondance écran → surface.
- Enveloppes normalisées dans `src/components/omni/ui/OmniPrimitives.tsx` : une seule `OmniSheet` (bas en mobile, centrée en desktop), suppression de la variante `right` et de `OmniCenteredPanel`, pied d'action obligatoire via `OmniActionFooter`.
- Nouveau `OmniFlowSheet` : en-tête + progression + corps + pied, utilisé par la disponibilité, l'onboarding et le parcours vendeur, pour supprimer les divergences des captures 1/3 → 3/3.
- Nouveau `OmniActionBlock` (bloc « maintenant ») et `OmniResumeBar`, alimentés par la dérivation d'état existante dans `src/lib/omni-v1-contracts.ts`. L'UI n'invente aucune transition.
- Découpe de `src/routes/vendeur.tsx` et `src/components/omni/CartePage.tsx` en sections, sans changer les server functions.
- Correctifs structurels de débordement : `min-w-0` sur tout conteneur de texte, `shrink-0` sur les icônes, grilles `grid-cols-[minmax(0,1fr)_auto]` sur les en-têtes mixtes.
- Vérification automatisée : capture 320 / 390 / 768 / 1280 px sur chaque écran, échec si débordement horizontal, si un CTA sort du cadre, ou si une cible fait moins de 44 px.
- Prérequis conservé : le blocage runtime `AsyncLocalStorage` (module serveur importé côté client) est corrigé en premier, sinon rien n'est vérifiable à l'écran.

## Ordre de livraison

1. `docs/omni-ui-system.md` et primitives normalisées (feuille unique, pied d'action, progression).   

2. Déblocage runtime + garde-fou d'import serveur.
    

3. Parcours acheteur : carte → rail → fiche → disponibilité 3 étapes → comparaison.
4. Écran transaction unique + barre de reprise + bascule de rôle.
5. Console vendeur deux colonnes, scanner, coupons, parcours vendeur.
6. Mouvement, états vides/erreurs, certification responsive 320 → 1280 px.
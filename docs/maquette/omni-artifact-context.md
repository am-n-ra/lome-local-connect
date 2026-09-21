# Omni — contexte pour Claude Artifacts

> À coller avec `docs/maquette/omni-artifact-design-system.html`.
> Ce fichier ne remplace pas le Master Plan : il donne à Claude de quoi **ne pas inventer**
> Omni quand on retravaille le design.

## La vision, mot pour mot du fondateur

> « OMNI est le moteur de recherche de l'offre **et** de la demande. On permet à nos utilisateurs
> de trouver les choses selon leurs contraintes et de pouvoir toujours choisir la meilleure option
> disponible. En un mot avec OMNI tu as le choix, et réellement le choix — le monde abonde d'offres. »

**En clair :** une carte d'abord (la carte est l'accueil, pas un onglet) ; des **contraintes**
(proximité, stock, disponibilité, prix, rayon) et non des listes ; une **transaction tracée** par QR.
Côté vendeur, n'importe quelle forme d'offre — boutique, étal, individu, professionnel mobile,
activité digitale — **sans tenir un inventaire complet**.

**La boucle V1 :** trouver → vérifier la disponibilité → décider → transaction → événement de stock.

**Cible de maturité :** la boucle V1 honnête à Lomé, puis candidate à la production.
Ce n'est **pas** « comme Google Maps » ni « comme Amazon ».

## Le design system

Source de vérité : `src/trunk/v3.css`. Jetons repris verbatim dans l'artifact.

| Rôle | Valeur |
|---|---|
| evergreen | `#234D40` |
| evergreen-dark | `#08362A` |
| accent | `#F08F5A` |
| cream | `#F9F7F2` |
| ink | `#1A1C1B` |
| appbg | `#F9F9F7` |
| surfaces 1→5 | `#FFFFFF` `#F4F4F1` `#EEEEEC` `#E8E8E6` `#E2E3E0` |
| outline / discret | `#717975` / `#C0C8C3` |
| level-1 | filet `#EAE8E0` + ombre douce |
| level-2 | `0 12px 40px 4px rgba(26,28,27,.12)` |
| Titres | **Plus Jakarta Sans** |
| Texte | **Hanken Grotesk** |

**Carte (palette canopée réelle) :** eau `#2D3335`, terre `#FFFFFF`, motorway `#5F5F5F`,
trunk `#8D8D8D`, secondary `#B5B5B5`, minor `#D4D4D4`, pin facilité `#2E8B6F`, pin cluster `#1F1F1F`.

## Les règles à respecter

1. **La carte n'est jamais recouverte.** La feuille basse se limite (32–84 % selon l'écran).
2. **Le triptyque de confiance est toujours rendu** : Confirmée / À confirmer / Non revendiquée.
   Jamais masqué, jamais remplacé par une couleur seule.
3. **Aucune promesse non tenue n'est cliquable.** « Bientôt » est visible **et** désactivé.
4. **Un prix ne s'affiche que s'il est réel.** Pas de `—` ambigu.
5. **Le chip d'itinéraire ne ment jamais** : soit la route réelle, soit « tracé direct » **avec sa raison**.
   Un refus dit *quoi faire* (« connectez-vous »), pas seulement ce qui manque.
6. **La gratuité est un principe** : la vérification manuelle d'une facilité reste gratuite.
7. **Le vendeur voit des preuves**, pas des vanités (QR vérifiés, transactions closes).

## Décisions ouvertes — ne pas trancher à ma place

| # | Question | État réel |
|---|---|---|
| Route ouverte ou verrouillée | La maquette V1.3 dit *verrouillée jusqu'à l'intention* ; la décision fondateur du 14/09 dit *ouverte sur chaque fiche*. **Le code suit le fondateur. La maquette n'a jamais été réconciliée.** | contradiction ouverte |
| Cause du `PROVIDER_ERROR` | Un acheteur connecté reçoit encore « service momentanément indisponible ». La cause (jeton Mapbox ou couverture) **n'est pas encore établie**. | diagnostic en cours |
| Écart de géométrie | Lomé : **4,91 km** en ligne droite contre **6,19 km** de route réelle = **+26 % sous-estimé**. | cible à corriger |

## Comment s'en servir

Ouvre l'artifact et demande ce que tu veux : « rends l'accueil plus calme », « propose trois
traitements de la fiche », « durcis la hiérarchie des pins ». Le bloc `:root` pilote tout :
change une valeur, tout suit.

Quand tu as une direction qui te plaît, rapporte-la ici — je l'applique au **vrai** code, pas à la maquette.

## Vérification après retouche

```bash
node scripts/verify-artifact-layout.mjs
```

Doit sortir `marqueurs hors cadre: 0` et `debordement horizontal doc: 0`.

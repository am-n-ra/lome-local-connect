# Omni — `SP-9` + `SP-10` : routage simplifié et création d'entité avec pin déplaçable (2026-09-24)

> **Directives fondateur :** (1) *« je crois qu'on n'a plus besoin de Mapbox ou OSRM non ? »* ;
> (2) *« pour l'intel recommandes… »* ; (3) *« pour la création d'entité j'espère que ça utilisera la
> position de l'utilisateur par défaut mais donnera la possibilité de bouger le pin sur la carte, et
> cela vaut même pour les entités qui fourniront des offres digitales ou autres. »*
>
> `SP-10` (pin déplaçable) est **livré dans la maquette**. `S-15` et `SP-9` sont des **décisions**.

---

## 1. `S-15` — « plus besoin de Mapbox ni d'OSRM ? » : **exact pour Mapbox, pas tout à fait pour OSRM**

**Pourquoi Mapbox devient inutile — par la décision A elle-même.**

Mapbox servait à **router** : transformer deux points en itinéraire routier réel. Or le modèle vient de
changer sur deux fronts :

1. **La carte fournit les lieux** (décision A) → un lieu non revendiqué (niveau 0) n'a **pas** d'itinéraire
   à proposer : il n'y a rien à aller chercher, aucune promesse. Router vers lui serait un mensonge.
2. **Un lieu digital n'a pas d'itinéraire** — il n'y a pas de déplacement. La maquette le dit déjà :
   *« Tout se passe en ligne — aucun déplacement »*.

Ce qui reste à router : **un acheteur → une entité revendiquée qui a une offre**. C'est un cas réel,
mais **étroit**, et il ne justifie plus un fournisseur facturé à la requête.

**Mais attention à ne pas jeter OSRM avec Mapbox.** « Tracé direct » (la ligne droite à 2 points) est
ce que la maquette appelle aujourd'hui « itinéraire ». Sur le vrai réseau de Lomé, une ligne droite
**sous-estime de 26 %** (mesuré : 4,91 km à vol d'oiseau contre 6,19 km par la route). Trois voies :

| Voie | Coût | Honnêteté |
|---|---|---|
| **A. Retirer l'itinéraire** — garder distance en ligne droite **étiquetée** « à vol d'oiseau » | 0 | honnête si étiqueté ; perd l'usage « comment j'y vais » |
| **B. OSRM auto-hébergé** (déjà supporté par `OSRM_BASE_URL`) | hébergement, **pas** à la requête | route réelle, coût fixe, conforme à S-15 |
| **C. Mapbox** | **$2/1 000** au-delà du quota | route réelle + instructions soignées ; **facture à la croissance** |

**Recommandation : `A` maintenant, `B` quand le besoin est prouvé, `C` jamais par défaut.**
Raison : la contrainte `S-15` est « coût marginal fondateur = 0 ». Or **rien ne prouve encore que
l'itinéraire est un usage réel** — la maquette s'en sert comme **soutien** (S-08 le dit : *« itinéraire =
soutien ; transport = une offre »*). Construire une facture sur un usage non mesuré, c'est la faute
de la couverture (décision A). **Mesurer d'abord.**

**Action concrète :** `MAPBOX_ACCESS_TOKEN` **n'est pas posé** — c'est déjà l'état prod
(`PROVIDER_NOT_CONFIGURED`). Donc **la voie A est déjà en place sans rien faire** : ne pas poser le
jeton, étiqueter honnêtement la distance en ligne droite. Le code OSRM reste (coût 0, auto-hébergeable).

## 2. `SP-9` — l'intel : **ma recommandation**

La couche d'intel est la **valeur défendable** (mesuré : 29 demandes · 93 événements · 8 avis).
Aujourd'hui la maquette n'en montre qu'**un fragment** (`admin-signal`). Une valeur invisible n'est pas
un produit.

**Ma recommandation : trois formes, par ordre de rapport valeur/risque.**

| # | Forme | Pour qui | Ce qu'elle dit | Pourquoi |
|---|---|---|---|---|
| **1** | **« Ce lieu est demandé »** | acheteur | « 12 personnes ont cherché cette catégorie ici » | confiance par la preuve d'usage ; **hallucination impossible** (c'est un comptage) |
| **2** | **« La demande non satisfaite »** | vendeur | « 38 recherches « gaz butane » · 0 résultat dans 1 km » | **recrute l'offre manquante** = croissance honnête ; déjà `admin-signal`, à porter au vendeur |
| **3** | **« La chaleur du lieu »** | opérateur | où la demande dépasse l'offre → où agir | pilote le terrain |

**Ce que je recommande de NE PAS faire (danger) :**
- **Ne pas vendre la donnée** — la maquette dit déjà *« jamais une vente de données »*. Un vendeur qui
  voit *« 38 recherches »* apprend le **volume**, jamais **qui**. Pas de fuite.
- **Ne pas afficher l'intel sur une offre sans usage réel** — afficher « demandé » sur une offre à
  1 requête serait du faux signal. **Un seuil minimal**, sinon silence.
- **Ne pas faire de l'intel une promesse** : elle **constate** le passé, elle ne **promet** pas l'avenir.

**Le principe :** l'intel renforce l'honnêteté, elle ne la remplace pas. Elle dit *« voici ce qui s'est
vraiment passé »* — jamais *« voici ce qui va se passer »*.

**Décision attendue :** acceptez-vous ces trois formes, et **en quelle tranche** (Species maintenant, ou
slice au Root) ? Ma recommandation : **les former maintenant dans la maquette** (Species : ce que le
produit enseigne), les **servir** au Root (agrégation).

## 3. `SP-10` — le pin déplaçable : **LIVRÉ**

**Constat : il manquait.** L'écran de création d'entité affichait `Lieu : Lomé · Adawlato` **en dur** —
aucune carte, aucun pin, aucune géolocalisation. Or votre raisonnement est exact et vaut pour les
**trois formes**.

**Livré dans `seller-entity` :**

| Élément | Comportement |
|---|---|
| **Point de départ** | la **position de l'utilisateur** (`.usermarker`) — le pin part de là |
| **Déplacement** | pin **librement déplaçable** (souris **et** tactile, `touch-action:none`) |
| **Le geste est identique pour les trois formes** | **Fixe** · sur place — se corrige ; **Mobile** · se déplace ; **Digital** · service |
| **Le sens change selon la forme** | fixe/mobile : *« Où vous êtes »* ; digital : *« D'où vous parlez (origine) »* |
| **Après déplacement** | label → « Position ajustée · sur la carte » (fixe/mobile) ou « Lomé · Adawlato » (digital) |
| **Honnnêteté digital** | *« Pour une offre immatérielle, la position dit d'où vous parlez — jamais un déplacement à faire »* |

**Preuve par rendu (Playwright, pas par lecture de code) :**

```
pin avant : {left: 60%, top: 34%}
pin après : {left: 25%, top: 74.8%}     ← déplacé au geste réel
a bougé   : OUI
label     : Position ajustée · sur la carte
digital   → origine affichée : OUI
fixe      → lieu affiché : OUI
```

**Pourquoi le geste unique est le bon choix :** il n'y a **pas** quatre mécanismes à construire.
Il y a **un geste** — poser un point sur une carte — et **un sens** qui dépend de la forme. C'est
cohérent avec le modèle Seed : *« une seule offre, sept caractéristiques »* — une seule entité,
**une forme déclarée**, un seul geste de position. Aucun « type » qui créerait une dette de modèle.

**Limite honnête :** un lieu **fixe** déplacé par son propriétaire est **déclaré**, pas **vérifié**.
Le badge de confiance reste `Non vérifié` (S-31) ; la position exacte relève du **niveau 1**
(revendiqué), et sa précision n'est pas une promesse tant que la vérification opérateur n'est pas passée.

## 4. Gardes (mesurés)

| Garde | Résultat |
|---|---|
| `check:maquette` | ✅ **74 écrans**, 5 niveaux, registre honnête |
| `check:species-t12` | ✅ **16/16** au rendu navigateur réel |
| Playwright (drag) | ✅ pin déplacé, label mis à jour, digital/fixe corrects |

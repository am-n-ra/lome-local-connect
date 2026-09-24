# Omni — `S-15` (le routage vient-il avec la carte ?) + `SP-10` affiné (recherche de repère) (2026-09-24)

> **Question fondateur :** *« mais pour la route, normalement les cartes ont cette fonction aussi par
> défaut non ? »* et *« j'espère que tu parles de l'étape de création d'entité où le fournisseur peut
> librement placer le pin de son entité, ou carrément faire une recherche sur la carte pour trouver
> rapidement un nearby place pour se retrouver et enfin placer son point… »*
>
> **Réponse :** (1) **Non** — la carte ne fournit **pas** le routage, et c'est contractuel. (2) **Oui**,
> c'était bien l'étape de création — et la **recherche de repère** manquait : elle est **livrée**.

---

## 1. « Les cartes ont la route par défaut » — **non, et ce n'est pas un détail de facturation**

**Vérifié auprès des deux fournisseurs que nous utilisons réellement :**

| Fournisseur | Ce qu'il fournit | Le routage ? |
|---|---|---|
| **OpenFreeMap** (tiles vectorielles) | « display custom maps », tuiles + styles | **Non** — aucun service de routage. C'est un serveur de **tuiles**. |
| **CARTO** (basemaps, `carto.streets`) | tuiles, styles, CDN | **Non** — le routage est un **produit séparé**, *« Data Services API … powered by our partners TomTom, Mapbox and HERE »* |

**Et ce n'est pas seulement commercial — c'est contractuel.** Les conditions CARTO Basemaps disent
explicitement que les basemaps **ne doivent pas** servir à *« provide real-time, turn-by-turn navigation
for a vehicle of any type »*. Le fond de carte **interdit** l'usage navigation.

**Conclusion :** un fond de carte est une **image du monde** (routes, noms, lieux). Un routage est un
**calcul sur un graphe** (quel chemin, combien de temps). Ce sont **deux services distincts** —
les fournisseurs de tuiles ne facturent pas le second parce qu'ils **ne le font pas**.

**Donc la recommandation précédente tient, et elle est même renforcée :**

| Voie | Coût | Verdict |
|---|---|---|
| **A. Étiqueter « à vol d'oiseau »** | **0** | **recommandé maintenant** — aucun service, aucune facture, honnête si étiqueté |
| **B. OSRM auto-hébergé** | hébergement, pas à la requête | quand l'usage réel est prouvé |
| **C. Mapbox** | **$2/1 000** | jamais par défaut |

`MAPBOX_ACCESS_TOKEN` **n'est pas posé** → la voie A est **déjà** l'état de prod.
Rien à faire : **ne pas poser le jeton**, et écrire « à vol d'oiseau » au lieu de « itinéraire ».

## 2. Le pin : **oui, c'était bien l'étape de création** — et la recherche de repère manquait

**Chemin vérifié** : `seller-entry` (*« Vous n'avez pas encore d'entité »*) → **« Créer mon entité »** →
`seller-entity` — c'est bien **là** que le provider place son pin.

**Ce qui manquait, exactement comme vous l'avez décrit :** on demandait au vendeur de poser un point
**sans lui donner de moyen de se situer**. Il devait deviner. **Livré :**

| Élément | Comportement |
|---|---|
| **Point de départ** | la **position de l'utilisateur** (`.usermarker`) |
| **Recherche de repère proche** | champ *« Chercher un lieu proche (marché, église, école…) »* |
| **Repères proposés** | **vrais noms relevés dans les tuiles de Lomé** : *Cathédrale du Sacré Cœur*, *Grand Marché d'Adawlato*, *Église Saint-Antoine de Padoue*, *Collège Notre-Dame des Apôtres*, *Tokoin-Hôpital*, *Amoutivé*, *Tokoin-Forever* |
| **Choisir un repère** | le pin se rapproche du repère → label *« Tokoin-Hôpital · à affiner »* |
| **Puis affiner** | le pin **se déplace librement** au doigt → *« Position ajustée · sur la carte »* |

**Pourquoi ce n'est pas une liste inventée :** les repères sortent des **tuiles réelles** (couche `place`
et `poi`) déjà mesurées — c'est cohérent avec la décision A : *la carte fournit les lieux*.

## 3. Un bug réel attrapé par la preuve (et corrigé)

**Ma première preuve a échoué :** taper `marche` → **0 résultat**, alors que *Grand Marché d'Adawlato*
existe. Cause : la comparaison gardait l'accent (`é`), l'utilisateur tape `e`.

**Pour un utilisateur togolais, c'est un défaut réel** — on tape rarement les accents au clavier.

**Correction :** normalisation `NFD` (suppression des diacritiques) des deux côtés de la comparaison.

**Preuve après correction (rendu réel) :**

```
"marche"     -> Grand Marché d’Adawlato
"eglise"     -> Église Saint-Antoine de Padoue
"cathedrale" -> Cathédrale du Sacré Cœur
"tokoin"     -> Tokoin-Hôpital | Tokoin-Forever
"ecole"      -> Collège Notre-Dame des Apôtres
```

**Leçon :** la preuve par le rendu a **trouvé** un défaut que la lecture du code n'aurait pas montré.
C'est exactement pourquoi on rend au lieu de lire.

## 4. Gardes (mesurés)

| Garde | Résultat |
|---|---|
| `check:maquette` | ✅ **74 écrans**, 5 niveaux, registre honnête |
| `check:species-t12` | ✅ **16/16** au rendu navigateur réel |
| Recherche de repère | ✅ 5/5 requêtes sans accent trouvent le lieu |
| Drag après repère | ✅ pin affiné au geste réel |

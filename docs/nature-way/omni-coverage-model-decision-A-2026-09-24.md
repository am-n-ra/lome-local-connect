# Omni — Modèle de couverture : la carte fournit les lieux, la base garde les entités et les offres (2026-09-24)

> **Décision fondateur : voie A.** *« je pense que a est ce qu'on aurait dû faire depuis le début et là
> la carte sera peuplée même si ce ne sont que des unclaimed, et ensuite ce que notre DB doit vraiment
> garder, notre valeur, ce sont les entités et les offres. »*
>
> Ce document **fixe le modèle** et résout le point dur de l'identité d'un lieu. **Aucun code produit.**
> Décision de **Species** : ce que la carte enseigne à l'utilisateur.

---

## 1. Le modèle, en une phrase

**La carte fournit les LIEUX (dessinés, jetables, zéro stockage). La base garde ce qui a de la valeur
et doit durer : les ENTITÉS et les OFFRES.**

```
       CARTE (tuiles CARTO, déjà servies)          BASE OMNI (notre valeur)
       ─────────────────────────────────           ────────────────────────
  7 925 POI à Lomé · 5 760 nommés                 v2_entities   ← l'offreur
  dessinés niveau 0 · AUCUNE ligne en base        v2_products   ← l'offre
  fraîcheur fournie par le fournisseur            v2_facilities ← le lieu REVENDIQUÉ
                  │                                             ▲
                  └──────── revendication ──────────────────────┘
                          (S-05 niveau 0 → 1)
```

C'est **exactement l'échelle d'existence S-06** : le niveau **0 « Présente »** devient gratuit et
illimité — fourni par la carte. La base commence au niveau **1 « Revendiquée »**.

## 2. Le point dur résolu — l'identité d'un lieu dessiné

**Question qui décidait de tout :** peut-on **revendiquer** un lieu dessiné, donc lui donner une
identité durable ?

**Mesures :**

| Fait | Résultat |
|---|---|
| Chaque POI porte un `id` de feature | ✅ oui (ex. `32552494`) |
| Cet `id` est **stable entre serveurs de tuiles** (`tiles-a` = `tiles-b`) | ✅ oui, 1 480/1 480 identiques |
| Cet `id` **est-il un identifiant OSM** (résoluble vers le monde réel) ? | ❌ **NON** — vérifié : `node/32552494` = Canberra, `node/497015201` = Wisconsin. **Espace d'identifiants différent.** |
| Coordonnées reconstituables depuis la tuile ? | ✅ oui — `lon 1.21795, lat 6.13198` (Lomé), extent 4096 |
| L'`id` de tuile sert-il de **clé en base** ? | ❌ **NON** — opaque, hors de notre contrôle, peut changer |

**Conséquence, et c'est la règle de conception :**

> **On ne revendique pas une clé. On revendique une POSSESSION.**

La revendication d'un lieu dessiné **matérialise** ce lieu en base au moment de la revendication :

1. L'utilisateur tape sur un POI dessiné → la fiche propose **« Revendiquer »** (nom + coordonnées
   **pré-remplis** depuis la tuile — simple confort).
2. Le flux de revendication existant s'applique : **preuve de contrôle + arbitrage opérateur** (S-18).
3. Si accepté → une ligne `v2_facilities` + une `v2_entities` sont **créées**. Le lieu passe du
   niveau 0 (carte) au niveau 1 (base).
4. L'`id` de tuile est conservé comme **indice facultatif** (`source_ref`), **jamais** comme clé
   étrangère — il sert au dédoublonnage et à la re-détection, pas à l'intégrité.

**Aucun import. Aucune synchronisation. Aucune ligne stockée pour un lieu non revendiqué.**

## 3. Ce que ça change dans la base (et c'est libérateur)

Le rôle de `v2_facilities` **change** : ce n'est plus « tous les lieux », c'est **« les lieux que nous
avons promus »** (revendiqués ou créés par un vendeur).

Conséquence directe, honnête : les **203 lignes `source_kind = 'public_import'`** de notre base
**dupliquent** désormais ce que la carte dessine gratuitement. Elles n'ont plus besoin d'exister comme
référentiel de lieux — au mieux comme **cache de revendications**. C'est le même nerf que la dette
`D-ENT-1` (3 offres posées sur des imports) et les **17 facilités au Ghana** (hors zone).

**Ce qu'on garde, précieusement :** entités · offres · facilités revendiquées · transactions ·
réputation. **Ce qu'on cesse de dupliquer :** les lieux du monde.

## 4. Limites honnêtes (non cachées)

| # | Limite | Portée |
|---|---|---|
| **L-1** | Les POI de fond de carte viennent de CARTO/OSM, **pas de nous** | conditions d'usage du fournisseur ; cohérent avec S-15 (coût 0), mais **sans SLA** de notre côté |
| **L-2** | Un POI dessiné **n'est pas une offre** | ni stock, ni entité, ni QR — niveau 0 seulement. Ne jamais l'afficher comme une offre (mensonge interdit) |
| **L-3** | L'`id` de tuile est **opaque et hors contrôle** | d'où la règle §2 : indice, jamais clé |
| **L-4** | Un POI peut **manquer** ou être **mal placé** dans OSM | la revendication corrige le nom/la position par la possession ; aucun besoin de corriger OSM |
| **L-5** | Un lieu revendiqué **reste** en base même si le POI disparaît de la carte | c'est **voulu** : notre valeur n'est pas le lieu, c'est l'entité et l'offre |

## 5. Prochain acte (Species)

Ceci est une décision de conception ; la **maquette V2 doit maintenant la montrer**, sans code produit :

- **`SP-7`** — le lieu dessiné de niveau 0 : à quoi ressemble un pin non revendiqué, que dit sa fiche
  (« Lieu connu — pas encore géré », aucune promesse de stock), comment le filtre le distingue des
  offres réelles, et à quel zoom on le dessine.
- **`SP-8`** — la revendication depuis la carte : le geste « je revendique ce lieu » pré-rempli, et
  ce qui est expliqué à l'utilisateur (preuve + arbitrage, S-18).

**Aucune migration, aucun code produit avant validation fondateur de la maquette.**

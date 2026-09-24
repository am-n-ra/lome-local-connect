# Omni — La couche d'intel : la valeur défendable (2026-09-24)

> **Constat fondateur :** *« à part ceux-là (les lieux de la carte), il y a ce qui est créé via Omni —
> comme entité tied to lieu avec offre, et tout ça — ça devient layer d'intel qui est la valeur de
> Omni en fait. »*
>
> Ce document **formalise la hiérarchie de valeur** du modèle. Il **reframe** Species et Root.
> **Aucun code produit.**

---

## 1. La hiérarchie, mesurée sur la canonique (`br-dawn-hill-am5amy22`)

| Couche | Ce que c'est | Volume réel | Coût | Valeur |
|---|---|---|---|---|
| **LIEUX** | POI du monde (carte) | **7 925** dessinés à Lomé · **203** en base (`public_import`) | 0 (fournis) | **commodité** — dupliquée par la carte |
| **ENTITÉS** | l'offreur, créé/revendiqué via Omni | **3** | nôtre | ✅ **notre valeur** |
| **OFFRES** | ce qui est proposé, rattaché à l'entité | **16** | nôtre | ✅ **notre valeur** |
| **INTEL** | ce que l'usage **produit** | voir §2 | nôtre | ✅✅ **la valeur défendable** |

**À retenir :** 203 lieux stockés (duplication) pour **3 entités** et **16 offres** (la valeur).
Le volume est à l'envers de la valeur.

## 2. Ce que la couche d'intel contient **déjà** — et son état réel

Les tables existent. Voici ce qu'elles portent **aujourd'hui** :

| Table d'intel | Volume | Ce que ça apprend |
|---|---|---|
| `v2_availability_requests` | **29** | qui a demandé **quoi**, **où**, **quand** — la **demande réelle** |
| `v2_availability_responses` | 12 | comment les vendeurs répondent (délai, acceptation, prix) |
| `v2_purchase_intents` | 12 | conversion demande → intention |
| `v2_transaction_events` | **93** | la **séquence** réelle d'une transaction |
| `v2_ratings` | 8 | la **réputation** — confiance gagnée par l'usage |
| `v2_fulfilments` | 6 | ce qui a été réellement remis |
| `v2_verification_evidence` | 1 | la preuve de contrôle (S-18) |
| `v2_qr_tokens` | 12 | le **canal** d'acquisition (S-21) |
| `v2_product_stock_events` | **0** | ⚠️ **capacité sans alimentation** — voir §4 |

**Ce que personne d'autre ne peut avoir :** le croisement *demande × offre × lieu × temps ×
confiance*. CARTO connaît le **lieu**. Personne ne connaît **qui voulait quoi, là, et si ça a abouti**.

**C'est là que réside Omni.** Pas dans la carte — dans ce que l'usage y dépose.

## 3. Le cycle — pourquoi c'est défendable

```
   carte (gratuit, illimité)
        │  lieu niveau 0
        ▼
   revendication  ──►  ENTITÉ + LIEU (notre 1re valeur)
        │
        ▼
   OFFRE          ──►  découverte, recherche
        │
        ▼
   USAGE          ──►  demande ─ réponse ─ intention ─ QR ─ transaction ─ avis
        │
        ▼
   INTEL          ──►  enrichit CHAQUE lieu, CHAQUE entité
        │
        └──────────►  rend le lieu plus riche qu'un POI nu
                       rend la recherche meilleure (où est la demande ?)
                       rend la confiance visible (S-32)
```

**L'effet de levier :** chaque transaction rend le système **plus intelligent**, pas seulement
plus grand. Un POI de carte reste identique pour toujours ; un lieu revendiqué et utilisé **gagne**
en information. **La carte ne peut pas rattraper ça — elle ne voit pas les transactions.**

## 4. Ce que ce modèle éclaire — et deux signaux honnêtes

### 4.1 Il **justifie** le travail entité (R-1/R-2) — mais ne change pas l'ordre

Si la valeur est *entité + offre + intel*, alors **l'offre DOIT appartenir à l'entité** : c'est la
fondation du modèle de valeur, pas un caprice technique. `S-25` n'est pas une préférence, c'est la
**définition de ce qu'on garde**.

Mais ça reste du **Root**, et **Species est la porte courante**. Le modèle justifie R-1/R-2
*a posteriori* ; il ne rouvre pas la porte.

### 4.2 Un signal à investiguer (pas conclure)

`v2_product_stock_events = 0` alors qu'il y a 12 intentions et 93 événements de transaction.
Le code écrit bien ces événements (FF-8 : `stock_reserve` / `stock_release` / `stock_settle`).
**Hypothèses non tranchées :** transactions antérieures à FF-8, ou offres sans stock alloué.
**À vérifier, pas à supposer** — c'est du Root, hors porte courante.

### 4.3 Le volume est à l'envers, et ça se corrige par la décision A

Les 203 `public_import` dupliquent la carte (§1 du modèle de couverture). Le modèle d'intel **renforce**
la décision A : on ne garde pas les lieux du monde, on garde **ce que l'usage y a déposé**.

## 5. Conséquence pour Species (la porte courante)

La maquette V2 doit maintenant enseigner **deux choses**, pas une :

| # | Ce que la maquette doit montrer | Statut |
|---|---|---|
| **SP-7** | le **lieu niveau 0** (carte) : pin non revendiqué, fiche « Lieu connu — pas encore géré », filtres, zoom | à faire |
| **SP-8** | la **revendication depuis la carte** : geste pré-rempli → entité + lieu | à faire |
| **SP-9** | l'**intel visible** — ce qu'Omni *sait* et **rend** : où est la demande, quelles offres tiennent leurs promesses, quelle confiance | **à décider** |

`SP-9` est la question neuve que ce constat ouvre : **si la couche d'intel est la valeur, est-elle
*montrée*, ou reste-t-elle invisible en base ?** Aujourd'hui la maquette n'en montre qu'un fragment
(S-32 : réputation + intégrité par offre). Une valeur invisible n'est **pas un produit** — et un
acheteur ne peut pas choisir sur ce qu'on ne lui montre pas.

## 6. Question ouverte au fondateur

**La couche d'intel doit-elle être *rendue* à l'utilisateur** — et sous quelle forme ?

- **au vendeur** : « 40 demandes sur ce quartier cette semaine, aucune offre » → une raison d'ouvrir
  une offre (et un argument commercial honnête) ;
- **à l'acheteur** : « 4,6 ★ · achetée 12× · intégrité ✓ » (déjà S-32) + « ce lieu est demandé » ;
- **à l'opérateur** : la carte de la demande non satisfaite = où Omni doit grandir.

**C'est une décision de Species** (ce que le produit enseigne et promet), et elle conditionne le Root
(comment on agrège et expose cette intel).

---

## 7. Résumé en une phrase

**La carte fournit les lieux (gratuit, dupliqué, jetable). La base garde les entités et les offres
(notre première valeur). L'usage dépose une couche d'intel que personne d'autre ne peut voir
(notre valeur défendable).**

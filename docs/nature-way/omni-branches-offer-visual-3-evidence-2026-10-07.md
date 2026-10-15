# BRANCHES-OFFER-VISUAL-3 — l'acheteur voit le visuel de l'offre (S-20 / E-03)

**Date :** 2026-10-07 · **Porte :** Branches OPEN (`HEARTWOOD_CLOSED_BRANCHES_OPEN`)
**Commit :** `370f004` · **Prod :** `index-BZIyZROG.js` === build local · **T-07d ✅**

## Le défaut mesuré

Le visuel d'offre était **stocké, publié et transporté — jamais montré**.

- `GET /api/v2/facilities/2000…101` renvoyait déjà `media:[{url:"…/demo/box-dejeuner.png"}]` pour
  `Box déjeuner togolais` (vérifié en prod).
- L'app **acheteur** n'avait **aucun `<img>`** : la fiche affichait `<span className="pthumb" />`
  (boîte grise). `TrunkAppV13` l.3037 (produits de la fiche facilité) et l.3113 (offres d'entité).
- Le **seul** `<img>` du dépôt était le catalogue du **vendeur** (`ProductCatalogueV13` l.126).
- La maquette montre pourtant le visuel : `.hcard .thumb` 64px, « Visuel de l'offre » (l.1129).

C'est la règle « no orphaned layers » **dans l'autre sens** : la donnée, le contrat S-20/E-03 et le
stockage public existaient ; il manquait le **rendu**. Le vendeur téléversait vers un objet public
que l'acheteur ne voyait jamais.

## Ce qui est livré

**Pas une fondation neuve** — le bouclage d'une fonctionnalité déjà à moitié livrée.

- `primaryOfferVisual(media)` **pur** (`src/trunk/offer-existence.ts`, partagé serveur/client) :
  premier visuel valide, sinon **`null`** — jamais une `<img src="">` cassée.
- Fiche **facilité** et page **entité** rendent l'image ; **placeholder en repli** quand il n'y a
  pas de visuel (l'offre reste lisible, l'échelle d'existence S-06 ne ment pas).
- CSS : `img.pthumb{object-fit:cover}` (+ `display:block` sur `.pthumb`).

## Preuve — navigateur réel, prod, acheteur connecté

`npm run proof:branches-offer-visual` (sign-in réel `demo@buyer.omni`, cookie injecté, puis
parcours réel recherche → fiche) :

```
PASS sign-in demo@buyer.omni
PASS la fiche facilité rend des <img.pthumb>            :: count=3
PASS chaque image est réellement chargée (naturalWidth>0) :: loaded=3/3
PASS les visuels démo sont rendus  :: [box-dejeuner.png, jus-gingembre.png, panier-fruits.png]
PASS les offres sans visuel gardent le placeholder       :: placeholders=2
PASS aucune erreur console
RESULT 6/6
```

`naturalWidth > 0` prouve que l'image est **réellement chargée**, pas seulement référencée. Les 2
placeholders restants sont les 2 offres sans visuel : l'échelle s'affiche, l'uniformité n'est pas
peinte.

## Garde (falsifié)

`src/trunk/offer-visual-render.test.ts` — 3 tests : contrat `primaryOfferVisual` + les **deux**
surfaces acheteur doivent rendre l'image.

**Falsification :** rendu retiré (les deux `<img>` redevenus placeholders) → **2 FAIL** ;
restauré → **3 PASS**.

## Résidus honnêtes

- Le **webhook `onUploadCompleted`** reste **parqué** : il est déclaré et son handler reçoit la clé,
  mais il **n'écrit rien**. L'écrire tel quel serait **destructeur** — `setSellerProductMedia` est un
  **remplacement total** (1–4 items, rejette `[]`), donc écrire `[nouvelObjet]` **écraserait les
  autres visuels**. Il faudrait une opération « ajouter un visuel » = **nouvelle fondation**,
  interdite sur Branches. Documenté, non supprimé.
- Le client reste **auto-réparateur** : il enregistre via `POST /media` après l'upload, et une
  offre publiée sans visuel est **refusée à la publication** (`MEDIA_REQUIRED`, E-03) puis
  re-corrigée par un ré-upload → un retry humain.
- Les 3 visuels démo sont **synthétiques** (générés), ils prouvent le contrat et servent la démo.

## Mesure

**1215/1215** tests (+3) · `tsc` 0 · 5 gardes verts · build `index-BZIyZROG.js` === prod.

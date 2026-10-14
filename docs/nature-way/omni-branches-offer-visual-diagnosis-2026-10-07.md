# Diagnostic — visuel d'offre vendeur : l'envoi est cassé par deux défauts indépendants

**Porte :** `BRANCHES_OPEN` (Trunk CLOSE 2026-10-07) · **Branche :** `omni-v2-rebuild` · **HEAD :** `52e3aa2`
**Date :** 2026-10-07 · **Statut :** diagnostic **mesuré**, aucun code modifié, décision fondateur requise
**Déclencheur :** bug fondateur « seller offer media-upload / publication » (offre `Riz au soja`).

> **Note de cadrage.** Le fondateur croit être « sur trunk ». Mesure : `docs/founder-hq/current-state.md`
> dit **Trunk CLOSE `founder-confirmed` 2026-10-07** et **Branches OPEN**. La porte courante est
> **Branches**. Lire l'état, jamais l'inférer.

---

## 1. Ce que le fondateur voit

Une offre en **brouillon** (`Riz au soja`, `2f50b789-9319-4b1d-829d-8c4b2f6698d4`, créée par un
**utilisateur réel** `antpeteou@gmail.com` le 2026-10-13, facilité `Soja zozo`) refuse de se
publier. Le refus est **correct** : la porte serveur exige un visuel (`MEDIA_REQUIRED`, S-20/E-03).
Le vrai blocage est en amont — **le vendeur ne peut pas ajouter le visuel**. Deux défauts
**indépendants** le prouvent.

## 2. Défaut A — l'app authentifie sur une AUTRE instance que celle où vivent les identités

**Mesure décisive :** le compte réel (`1d264990-…`, `auth_user_id = 1baf7989-…`) est lié à
`antpeteou@gmail.com`, dont la ligne `neon_auth."user"` existe **sur la branche par défaut
`production`** (`br-bitter-math-amrlbym6`) mais **PAS sur la canonique** (`br-dawn-hill-am5amy22`,
où l'app écrit ses données).

| Endpoint Neon Auth | Branche | `antpeteou@gmail.com` | `require_email_verification` |
|---|---|---|---|
| `ep-purple-fog-amwsyc3j…` | **`production` (défaut)** | **OUI** (`emailVerified: true`) | **`true`** → mot de passe non vérifié = **403 `EMAIL_NOT_VERIFIED`** |
| `ep-plain-butterfly-amn21o8h…` | **`omni-v2-rebuild` (canonique)** | **NON** | `false` |

- `src/auth.ts:3` code en dur `ep-purple-fog` = **l'instance de la branche par défaut**.
- L'app **écrit** sur la canonique (`br-dawn-hill-am5amy22`) mais **authentifie** sur la branche par
  défaut → **les identités des deux branches ont divergé**.
- Le vrai utilisateur existe sur `ep-purple-fog`, mais **la vérification d'email y est exigée**
  (`require_email_verification: true`) → **403 à la connexion**. C'est le symptôme de `AUTH-CREATE`.
- Le brouillon `Riz au soja` appartient à **ce vrai utilisateur** : en pratique **personne ne peut
  ouvrir sa session** pour ajouter le visuel — le défaut A bloque le vendeur légitime lui-même.

**Vérifié par appel réel** : `POST {ep-purple-fog}/sign-in/email` (bons identifiants) → **403
`EMAIL_NOT_VERIFIED`** ; `POST {ep-plain-butterfly}/sign-in/email` → **200 + session**. JWKS des deux
hôtes **identiques** → le *serveur* accepte les JWT, c'est le *client* qui ne peut pas obtenir de session.

## 3. Défaut B — le store Blob est privé, le code d'offre demande du public

Preuve directe, avec un **vrai JWT vendeur** (émis par `ep-plain-butterfly`) :

```
access=public  -> ERR Vercel Blob: Cannot use public access on a private store.
                  The store is configured with private access.
access=private -> OK  https://z631cn4vvzcc11cz.private.blob.vercel-storage.com/offers/…png
```

| Élément | État |
|---|---|
| `src/trunk/api.ts:578` | `upload(..., { access: 'public' })` |
| `src/server/offer-media-storage.ts:148` | enregistre `metadata.url` |
| Store réel de la prod (décodé du `clientToken` servi) | **`z631cN4vVZcC11cz` = l'ANCIEN store privé** |
| Nouveau store public créé par le fondateur | **pas encore câblé** : la prod émet toujours un token du store privé |
| `GET` anonyme sur l'URL privée enregistrée | **403** |

**Conséquence :** le PUT échoue → aucun visuel → `MEDIA_REQUIRED` insatisfiable → **aucune offre ne
peut être publiée depuis l'UI**.

**Faille connexe (à corriger dans la même tranche) :** `verifyOfferMediaObjects` accepte tout objet
dont le chemin commence par `offers/{productId}/` — il **ne rejette pas** un objet privé. J'ai
enregistré un objet privé via `/media` → **200**. Donc l'intégrité d'offre (`S-32`, contrôle `visuel`)
peut être satisfaite par un visuel que **personne ne peut charger**.

## 4. Le nœud — une SEULE variable de store pour deux besoins OPPOSÉS

Vérifié dans la documentation Vercel (2026) : **un store est entièrement public OU privé, on ne peut
pas changer le mode après création**, et le mode s'applique à **tout** le store.

Or **les deux besoins partagent `BLOB_READ_WRITE_TOKEN`** :

| Besoin | Nature | Accès requis | Code |
|---|---|---|---|
| **Visuel d'offre** (S-20) | **public** (ce que l'acheteur voit) | lecture anonyme par URL | `api.ts:578` `access:'public'` |
| **Evidence de revendication / visite** | **privé** | lecture proxifiée authentifiée | `evidence-storage.ts:118` `get(..., {access:'private'})` |

**Un seul `BLOB_READ_WRITE_TOKEN` ne peut pas satisfaire les deux.** Choisir un store public casse
l'evidence privée ; garder un store privé casse le visuel public.

## 5. Décision fondateur requise

### D-1 — Quel endpoint d'auth (le défaut A)

Les deux instances ont **des identités divergentes** ; choisir, c'est choisir laquelle est canonique.

| Option | Geste | Effet |
|---|---|---|
| **A1 — aligner l'app sur la canonique** | `src/auth.ts` + JWKS serveur → `ep-plain-butterfly` ; **recréer** `antpeteou@gmail.com` (et tout compte réel) sur `omni-v2-rebuild` | app et base sur la **même** branche ; les identités de la canonique (demo-seller, buyer, admin) redeviennent utilisables ; il faut **recréer le compte du vrai utilisateur** |
| **A2 — aligner la base sur la branche par défaut** | re-câbler `DATABASE_URL` → `br-bitter-math-amrlbym6` | l'auth et les données se rejoignent sur `production` ; **mais** `production` ne porte **pas** les données v2 (206 facilités / 16 produits sont sur la canonique) → perte du jeu de données réel |
| **A3 — réunir les instances** | action Neon (console) : pointer la canonique sur la même instance d'auth que la branche par défaut, ou l'inverse | supprime la divergence à la racine ; geste **plateforme**, à confirmer côté Neon |

**Recommandé (à trancher)** : **A1** — l'app **écrit déjà** sur la canonique ; c'est l'auth qui a
dérivé. A2 ferait perdre les données ; A3 est la vraie réunion mais dépend d'un geste plateforme.
**Décision requise : autorises-tu la recréation du compte `antpeteou@gmail.com` sur la canonique ?**

### D-2 — Quel contrat de stockage pour le visuel d'offre (le défaut B)

| Option | Geste | Effet |
|---|---|---|
| **B1 — un 2ᵉ store PUBLIC dédié au visuel** | câbler le nouveau store public via `BLOB_PUBLIC_READ_WRITE_TOKEN` ; le visuel lit ce jeton, l'evidence garde `BLOB_READ_WRITE_TOKEN` (privé) | les deux besoins sont satisfaits ; **préserve l'evidence privée** ; **petite tranche de code** (une variable, deux helpers) + redéploiement Vercel |
| **B2 — tout dans le store privé + route de lecture proxifiée** | visuel en `access:'private'`, servi via une route autorisée (patron `claim-evidence`, `http.ts:1407`) | honnête, **un seul store** ; mais **contrat + code** plus lourds (route de lecture, chemin, garde) et lecture proxifiée pour chaque image |

**Recommandé** : **B1** — le visuel d'offre **est** public par nature ; un store public dédié est le
modèle correct, et il **garde** l'evidence privée intacte. C'est aussi le moins de code.

## 6. Tranche proposée (à ouvrir seulement après D-1 + D-2)

1. **mini-seed** — un vendeur ajoute un visuel à son offre et la publie, de bout en bout, en prod.
2. **mini-root** — contrat : endpoint d'auth canonique ; `access` du visuel + jeton dédié ;
   `verifyOfferMediaObjects` **rejette** tout objet non public ; recréation du compte réel.
3. **correctif A** — `src/auth.ts` + JWKS serveur → endpoint canonique ; compte `antpeteou@gmail.com`.
4. **correctif B** — helper `BLOB_PUBLIC_READ_WRITE_TOKEN` (repli sur `BLOB_READ_WRITE_TOKEN`) pour le
   visuel ; `api.ts:578` et `offer-media-storage.ts` l'utilisent ; garde de vérification renforcée.
5. **UI + backend ensemble** — « Ajouter un visuel » aboutit ; la fiche acheteur affiche l'image.
6. **preuve** — navigateur vendeur réel (upload → publier) **et** acheteur (image chargée) ; +
   falsification de la garde (objet privé rejeté).
7. **plan/état** — mettre à jour `current-state.md` §Known open defects.

## 7. Résidus honnêtes

- Trois objets de sonde (privés) restent dans l'ancien store (non liés à un produit) — à supprimer.
- `Café filtre local.media` remis à `[]` après la sonde (aucune écriture laissée).
- Le nouveau store public n'est **pas** encore utilisé par la prod (elle émet un token de
  `z631cN4vVZcC11cz`) : « créer le store » ≠ « le câbler ».
- Le segment authentifié n'a pas été exercé au navigateur (l'app ne peut pas se connecter, défaut A) ;
  la preuve est un **appel réel** contre la prod avec un JWT valide.

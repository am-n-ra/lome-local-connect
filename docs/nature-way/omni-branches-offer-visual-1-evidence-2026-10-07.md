# BRANCHES-OFFER-VISUAL-1 — preuve (2026-10-07)

**Porte :** `BRANCHES_OPEN` · **Branche :** `omni-v2-rebuild` · **Commit :** `f1ed7d9` (poussé)
**Décisions fondateur :** `D-1` = **A1** (aligner l'app sur la canonique) · `D-2` = **B1** (store public dédié)
**Diagnostic :** `omni-branches-offer-visual-diagnosis-2026-10-07.md`

---

## Statut : `verified` sur le code · `manual` sur la configuration plateforme · `blocked` sur la donnée du user réel

## 1. Ce qui est prouvé

| Preuve | Résultat |
|---|---|
| Tests | **1206/1206**, `tsc` 0 |
| Gardes | `check:boundary`, `check:state`, `check:docs`, `check:coherence`, `check:live-surface` — **5/5 OK** |
| `ep-purple-fog` en source | **0 occurrence** (l'ancien endpoint a disparu) |
| Endpoint canonique en prod (bundle client servi) | `index-Dd8SXFcd.js` contient **`ep-plain-butterfly`** |
| `BLOB_PUBLIC_READ_WRITE_TOKEN` dans les bundles serverless | présent (13 bundles régénérés) |
| **T-07d** | prod `index-Dd8SXFcd.js` + `index-CIASH6pX.css` === build local |
| **Falsification** | retirer le refus d'objet privé → le test `refuses a PRIVATE object` **échoue** ; restauré → 9/9 |

## 2. Correctif A — auth alignée sur la canonique

`src/auth.ts` + `src/server/auth-context.ts` + `src/server/neon-webhooks.ts` +
`scripts/prove-web-push.mjs` → `ep-plain-butterfly-amn21o8h` (branche `omni-v2-rebuild`).
Vérifié par appel réel : `POST {canonique}/sign-in/email` (demo@seller) → **200 + session + JWT**,
et ce JWT fait autorité côté serveur (`media-upload` **200**).

## 3. Correctif B — store public dédié

- `offerMediaBlobToken()` (nouveau) : `BLOB_PUBLIC_READ_WRITE_TOKEN` sinon repli `BLOB_READ_WRITE_TOKEN`.
- `hasOfferMediaStorage` / `requiredBlobToken` / `verifyOfferMediaObjects` lisent ce jeton.
- `verifyOfferMediaObjects` **refuse** désormais un objet `*.private.blob…` (sinon « visuel »
  passait sur une image que l'acheteur ne peut pas charger).
- `.env.example` documente le jeton ; l'import trompeur `uploadPrivateBlob` → `uploadBlobClient`.

## 4. Ce qui RESTE — deux gestes

### (a) Câbler le store public dans Vercel — **fondateur**

Le store public **n'est pas encore utilisé par la prod** : `media-upload` renvoie toujours un
`clientToken` du store **privé** `z631cN4vVZcC11cz` → `BLOB_PUBLIC_READ_WRITE_TOKEN` est **absent**.
« Créer le store » ≠ « le câbler ».

**Geste** : Vercel → projet Omni → **Storage** → le nouveau store **public** → *Connect to Project*
→ choisir le projet + **Production** → `Advanced Options` → **préfixe de variable =
`BLOB_PUBLIC_READ_WRITE_TOKEN`** (sinon deux stores voudraient `BLOB_READ_WRITE_TOKEN` — conflit).
Puis **redéployer** (une variable n'est prise qu'à la création d'un nouveau déploiement).
**Vérification** : `media-upload` renverra un `clientToken` dont le `storeId` ≠ `z631cN4vVZcC11cz`.

### (b) Recréer le compte du vrai utilisateur sur la canonique — **consentement requis**

`antpeteou@gmail.com` (`1baf7989-…`) porte la facilité **« Soja zozo »** et l'offre **« Riz au soja »**,
mais sa ligne `neon_auth."user"` n'existe **que sur la branche par défaut** (`production`), pas sur la
canonique où l'app écrit. Sans recréation, **ce compte reste inaccessible** (défaut A).
`e20b882d-…` (= `demo@buyer.omni`) est dans le même cas (compte seed, moins critique).
L'écriture est une **insertion** additive dans `neon_auth."user"` (n'écrase rien) — **attente de l'accord**.

## 5. Résidus honnêtes

- Le segment **vendeur réel** (upload → publier) n'a pas été exercé au navigateur : la connexion du
  vrai utilisateur dépend de (b), et le store public de (a). La preuve est faite par **appel réel**
  contre la prod (JWT canonique) + la garde unitaire falsifiée.
- Trois objets de sonde (privés) restent dans l'ancien store — à supprimer.
- La prod sert le correctif **A** ; le correctif **B** est dans l'artefact mais **inerte** tant que
  (a) n'est pas fait (le repli retombe sur le store privé → l'upload reste refusé).

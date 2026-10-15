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

---

## 6. Suite `BRANCHES-OFFER-VISUAL-2` (2026-10-07) — deux faits qui ont changé la tranche

### 6.1 Le compte du vrai utilisateur n'était pas à recréer — il était à **relier**

Le plan « recréer `antpeteou@gmail.com` sur la canonique » était **impossible** : l'email
existe **déjà** sur la canonique sous un **autre id** (`a924686b…`, créé **2026-08-06**,
`emailVerified=false`) tandis que les données Omni (facilité **« Soja zozo »** + offre
**« Riz au soja »**) sont liées à `1baf7989…` (id de l'instance par défaut). Une insertion
violait l'unicité de l'email — la tranche était bloquée sur un mur qui n'aurait pas dû exister.

**Mesure (canonique `br-dawn-hill-am5amy22`)** : 10 comptes, dont **1 seul** lié à une identité
absente de `neon_auth."user"` — `1d264990…` → `1baf7989…` (le vrai utilisateur). Un **UPDATE**
ciblé relie ce compte à l'identité canonique `a924686b…` : **aucune insertion**, **aucune donnée
touchée** (facilité + offre conservées), **réversible** (valeur d'origine enregistrée).

**Preuve** : après le rebind, `1d264990…` → `a924686b…` → email `antpeteou@gmail.com` ; comptes
**10** (inchangé), facilités **13745** (inchangé), produits **17** (inchangé). Le chemin d'écriture
déjà livré (`FIX-D2`) relie automatiquement `v2_accounts` à la bonne identité à la prochaine
connexion — il manquait seulement le **pont** entre l'ancien id et le nouveau.

**Leçon** : « recréer » était le mauvais verbe. La bonne question n'était pas « comment insérer
sans collision » mais **« pourquoi y a-t-il deux identités pour le même email, et laquelle porte
les données ? »**. Un mur d'unicité est souvent le symptôme d'un **doublon d'identité**, pas d'un
manque de place.

### 6.2 Le store public est connecté en **OIDC** — `handleUpload` ne peut pas l'utiliser

Le fondateur a connecté le store public via le dashboard. Vercel connecte les stores en **OIDC par
défaut** : il expose `BLOB_STORE_ID` + `BLOB_WEBHOOK_PUBLIC_KEY` (+ `VERCEL_OIDC_TOKEN` injecté à
l'exécution) et **pas de read-write token**. Avec le préfixe `OMNI_` demandé, ces noms arrivent en
`OMNI_STORE_ID` / `OMNI_WEBHOOK_PUBLIC_KEY`.

Or `handleUpload` (le chemin livré en `B1`) **n'accepte qu'un read-write token** : sur un store OIDC
il retombe sur le token privé → **`storeId` privé `z631cN4vVZcC11cz`** (reproduit en prod après
déploiement, pas un défaut de déploiement).

**Livré** : le serveur détecte le mode du store public (`token` / `presigned` / `none`) et bascule
sur le chemin **présigné** de l'SDK (`handleUploadPresigned` + `issueSignedToken`, opération `put`
limitée au préfixe de l'offre) quand il n'y a pas de read-write token. Le client interroge le mode
via `GET …/media-upload` et choisit `upload` ou `uploadPresigned`. `head` (re-vérification à
l'enregistrement) passe aussi le `storeId` pour l'OIDC.

**Garde anti-régression** : les noms **nus** `BLOB_STORE_ID` / `BLOB_WEBHOOK_PUBLIC_KEY` ne sont
**pas** lus — le store **privé** (evidence) est connecté au même projet et les définit ; les lire
enverrait les visuels d'offre au store **privé**. Seuls les noms explicitement publics sont
résolus (`BLOB_PUBLIC_*`, `OMNI_*`). **Falsifié** : réintroduire `BLOB_STORE_ID` → le test
« ne résout jamais le store public depuis les noms nus du privé » **échoue**.

**Preuve** : **1209/1209** tests, `tsc` 0, 5 gardes vertes, bundles serverless régénérés.
**Résidu honnête** : le mode `presigned` n'est **pas encore actif en prod** tant que le store
public n'expose pas `OMNI_STORE_ID` + `OMNI_WEBHOOK_PUBLIC_KEY` **au runtime de la fonction** — à
confirmer par un nouvel appel `media-upload` (le `storeId` du `clientToken` doit cesser d'être
`z631cN4vVZcC11cz`).

### 6.3 Le flux présigné est **prouvé de bout en bout en prod** — et trois défauts réels l'ont bloqué

Le résidu 6.2 est **fermé** : `GET …/media-upload` répond `{"mode":"presigned"}` en prod et le
`delegationToken` porte bien `storeId = store_d6jnL2j6BCiPbbNt` (le store **public**), plus jamais
le store privé. Le chemin complet a été exercé **en prod**, avec le vrai compte `demo@seller.omni` :
upload présigné → objet écrit dans `d6jnl2j6bcipbbnt.public.blob.vercel-storage.com` → `POST
…/media` **200** → objet **publiquement lisible** (`GET` 200 `image/png`). Un chemin **étranger** est
toujours refusé (**400**, « do not belong to this offer ») : la borne de propriété tient.

Trois défauts réels ont été trouvés **par la preuve**, aucun par relecture — chacun a son
test de non-régression :

1. **Un 500 opaque cachait la cause.** Une panne du fournisseur Blob (réseau, credentials,
   protocole) remontait en `INTERNAL_RECOVERABLE` — le vendeur connecté voyait « service
   temporairement indisponible » au lieu de la cause. `withHonestProviderError` mappe désormais ces
   pannes sur `OfferMediaStorageError` (**409**, `EVIDENCE_STORAGE_UNAVAILABLE`) en **conservant le
   message du fournisseur** ; les refus typés (auth/policy/request) passent inchangés.
2. **`issueSignedToken` refuse les caractères glob.** Le chemin signé était `offers/{id}/*` →
   *« pathname cannot contain glob characters »*. On signe désormais le **chemin concret** demandé
   par le client (`offers/{id}/a.jpg`), déjà borné à l'offre par `authorize`. Test : le pathname
   signé **ne contient pas `*`**.
3. **`head` s'authentifiait contre le mauvais store.** En mode présigné, la re-vérification
   retombait sur le token **privé** de base → *« Access denied »* sur l'objet public. La
   vérification suit maintenant le **mode** : `storeId` (OIDC) en présigné, token public sinon.
   Test : `head` reçoit `{ storeId }` et **jamais** `{ token }` en présigné.

**Leçon** : le mode `presigned` était « livré » mais **inutilisable** ; il a fallu **piloter le vrai
flux en prod** pour voir les trois murs. Un chemin d'écriture déclaré mais jamais exercé n'est pas
une capacité — c'est une intention. Le diagnostic honnête (409 nommé) est ce qui a rendu le défaut
**visible** : sans lui, le 500 opaque aurait été lu comme « panne passagère ».

**Preuve finale** : **1212/1212** tests, `tsc` 0, 5 gardes vertes ; commits `8dfc9da` → `55a48a4`
(déployés : `d670ced8` → `55a48a4`), prod vérifiée à chaque étape. La sonde a laissé
`Café filtre local.media` à `[]` (état d'origine, vérifié) — aucune écriture laissée.

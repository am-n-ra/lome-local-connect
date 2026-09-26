# Root contract — publication honnête (`E-03` visuel · `E-04` avantage)

> **ID :** `ROOT-PUBLICATION-RH-2026-09-26` · **Plan :** `NW-PROD-OMNI-RH-01` · **Porte :** ROOT
> **Autorité :** `/nature-way` · **Handoff :** `HO-OMNI-26`
> **Statut :** contrat **écrit avant code** (maquette avant pixels, contrat avant code).

---

## 1. Pourquoi ce contrat existe

Le SDM (`omni-system-dependency-map-2026-09-23.md` §4) nomme la porte Root :

> **« preuve Root — migration additif + contrat d'API + refus serveur d'une offre sans visuel/avantage. »**

La maquette acceptée est explicite (`omni-species-v2-interactive.html:1107-1111`) :

> `Visuel de l'offre` → **`1 image requise`** · `Avantage Omni (requis)` → **`−15 %`**

**Mesure 2026-09-26 : le refus n'existe pas.**

## 2. État mesuré avant code (2026-09-26, canonique `br-dawn-hill-am5amy22`)

| Fait | Valeur |
|---|---|
| Offres publiées | 13 |
| Offres avec avantage (`discount_value_minor > 0`) | **12 / 13** publiées (la 13e = fixture `Root proof demo product`) |
| Offres avec visuel (`media <> '[]'`) | **0 / 13** |
| Chemin d'écriture du visuel d'offre | **AUCUN** — le Blob (`@vercel/blob/client`) n'est branché que pour la **preuve de revendication** (`uploadFacilityEvidence`, `handleClaimEvidenceUpload`) |
| Refus au `transitionSellerProduct` | **AUCUN** visuel, **AUCUN** avantage — seuls le plafond gratuit et la capacité Pro |

## 3. L'invariant central — un refus sans moyen de le satisfaire est une impasse

**C'est la leçon `SP-V2-01`** (l'offre sans propriétaire : « une impasse qui mentait »).

`v2_products.media` est **0/16**. Si l'on livre le refus E-03 **seul**, **aucun vendeur ne peut
publier** : il ne peut pas satisfaire l'exigence. Ce serait reproduire l'impasse exacte que le
fondateur a reprochée.

> **Invariant I-1 : les deux moitiés de `E-03` sont livrées ensemble — le refus ET le chemin d'écriture.**
> Livrer l'un sans l'autre est interdit. L'ordre d'exécution est : **chemin d'abord, refus ensuite.**

## 4. Décisions de contrat

### D-RH-1 — Le visuel d'offre est une URL d'objet public Blob, pas un binaire en base

`media` est `jsonb` (défaut `'[]'`). Le visuel est stocké comme **objet Blob public** (les visuels
d'offre sont **destinés à l'affichage public** — contrairement à la preuve de revendication, qui est
**privée**). `media` porte des **références** (`{ url, kind }`), jamais des octets.

**Pourquoi pas un chemin privé ?** La preuve de revendication est privée (identité, documents) ; un
visuel d'offre est **public par nature** — il est affiché à l'acheteur. Les mélanger dans un bucket
privé forcerait un proxy serveur pour chaque affichage, sans bénéfice de sécurité.

### D-RH-2 — Réutilisation de l'infrastructure Blob existante, pas de second chemin

`BLOB_READ_WRITE_TOKEN` + `@vercel/blob/client` existent déjà. Le visuel d'offre **réutilise** cette
infrastructure (`hasPrivateBlobConfiguration` → renommé conceptuellement « Blob configuré »). On ne
crée **pas** un second fournisseur de stockage (règle « une source de vérité par préoccupation »).

### D-RH-3 — Écriture owner-bound, sur offre **draft ou publiée**, jamais sur une offre d'autrui

Le chemin d'écriture suit le même joina que les autres opérations vendeur : `v2_products p` →
`v2_facilities f` → `v2_accounts a` où `a.auth_user_id = <auth>` et `a.suspended_at is null`.
Une offre d'un autre vendeur → `FORBIDDEN_OR_NOT_EDITABLE`.

### D-RH-4 — Le refus E-04 existe déjà à la création ; on le rend **explicite à la publication**

La création (`createSellerProductDraft`) **exige** déjà `pourcentageReduction ∈ [1, 90]`. Le refus à
la **publication** (`transitionSellerProduct`) est ajouté pour qu'une offre **héritée** ou **fixture**
sans avantage ne puisse pas non plus être publiée. **12/13** publiées satisfont déjà la règle.

### D-RH-5 — Grandfathering explicite des offres déjà publiées

Les **13 offres publiées** aujourd'hui n'ont **pas** de visuel. Le refus porte sur la **transition
`draft → published`**, jamais sur l'état `published` existant. Une offre publiée **reste publiée**
jusqu'à ce qu'elle soit **rééditée** — l'édition la repasse en `draft` (comportement existant,
`updateSellerProductDraft`), et elle devra alors satisfaire E-03 + E-04 pour republier.
**Aucune donnée existante n'est détruite, aucune offre n'est rétrogradée en masse.** C'est un
**acte vendeur** qui les met en conformité, pas une migration.

### D-RH-6 — Le message de refus nomme la raison

Un refus qui ne dit pas pourquoi est incroyable (même règle que `S-32`). La réponse distingue :
`MEDIA_REQUIRED` (« Ajoutez un visuel de l'offre avant de publier. ») vs
`ADVANTAGE_REQUIRED` (« Un avantage Omni > 0 % est requis avant de publier. »).

## 5. Contrat d'API

### `POST /api/v2/seller/products/:id/media` — attacher un visuel

| Aspect | Valeur |
|---|---|
| Auth | **requise** — 401 `AUTH_REQUIRED` sans session |
| Propriété | offrande **appartenant** au vendeur authentifié — sinon 403/`SellerCataloguePolicyError` |
| Corps | `{ media: [{ url: string, kind: 'image' }] }` — 1 à 4 visuels |
| Validation | URL `https://` d'un hôte Blob Omni ; `kind ∈ {image}` ; 1..4 éléments ; chaque URL ≤ 500 car. |
| Réponse | `200 { productId, media }` |
| Erreurs | 401 · 400 `INVALID_INPUT` · 409 `POLICY_REJECTED` (non propriétaire) |

### `POST /api/v2/seller/catalogue/:id` (transition, existant) — refus enrichi

| Transition | Condition nouvelle | Erreur |
|---|---|---|
| `draft → published` | `media <> '[]'` **requis** | 409 `MEDIA_REQUIRED` |
| `draft → published` | `discount_value_minor > 0` **requis** | 409 `ADVANTAGE_REQUIRED` |
| `published → archived` | inchangé | — |

**Ordre du refus :** visuel d'abord (le plus actionnable), avantage ensuite.

## 6. Contrat de type (client)

```ts
export type ProductMediaItem = { url: string; kind: 'image' };
```
`PublicProduct.media` : `ProductMediaItem[]` (aujourd'hui `unknown`). Relecture inchangée.

## 7. Non-goals explicites

- **Pas de migration.** `media` existe (`jsonb`), le refus est du code.
- **Pas de redimensionnement / CDN / transformation d'image** — hors tranche.
- **Pas de modération de contenu visuel** — tranche ultérieure (watch).
- **Pas de refus sur les offres déjà publiées** (D-RH-5).
- **Pas de visuel pour les facilités ni les entités** — cette tranche est l'**offre** (`E-03`).

## 8. Invariants à garder par des tests (chacun falsifiable)

| # | Invariant | Test qui doit échouer si on le casse |
|---|---|---|
| I-1 | chemin + refus livrés ensemble | retirer le chemin → publier devient impossible |
| I-2 | refus si `media` vide à la publication | publier une offre sans visuel → refus |
| I-3 | refus si avantage ≤ 0 à la publication | publier une offre sans avantage → refus |
| I-4 | écriture owner-bound | attacher un visuel à l'offre d'autrui → refus |
| I-5 | grandfathering | une offre publiée sans visuel **reste** publiée |
| I-6 | le refus nomme la raison | `MEDIA_REQUIRED` ≠ `ADVANTAGE_REQUIRED` |

## 9. Résidus honnêtes annoncés d'avance

- La **preuve navigateur avec session réelle** (upload puis publication) reste **au fondateur**
  (sandbox sans DB/auth) — comme les tranches précédentes.
- Le **chemin d'upload réel** dépend de `BLOB_READ_WRITE_TOKEN` configuré. S'il est absent, la route
  répond **honnêtement** `EVIDENCE_STORAGE_NOT_CONFIGURED` (comportement existant réutilisé), et
  l'UI le dit — même contrat que la preuve de revendication.
- Le corps du visuel (upload Blob client) réutilise le pattern `handleUpload` de la revendication ;
  la **vérification** `head()` de l'objet est faite côté serveur avant l'enregistrement de la
  référence (un client ne peut pas inscrire une URL arbitraire).

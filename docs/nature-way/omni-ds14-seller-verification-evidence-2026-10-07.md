# DS-14 `seller-verif` — « État de votre vérification » (côté vendeur)

> **Slice :** `NW-PROD-OMNI-DOCK-01` (Trunk, porte `ROOT_CLOSED_TRUNK_OPEN`).
> **Ordre fondateur :** « next go ». **Autorité :** `/nature-way` (product).
> **Entrée :** registre `omni-dock-search-conformance-register-2026-10-06.md` (`MENU-01`).
> **As of :** 2026-10-07 (UTC).

## 1. Le manque mesuré, pas inféré

`MENU-01` listait « 8 destinations maquette sans écran ». Mesure de la maquette :

| Écran maquette | Ce qu'il dit | App avant DS-14 |
|---|---|---|
| `seller-verif` (:1663) | « État de votre vérification » — badge actuel, étape, opérateur/zone, **preuves exigées 1 (particulier) / 3 (commerce)**, « vous **publiez déjà** (S-31), la vérification est une couche gagnée » | **absent** |

Les **données existaient déjà** en base (`v2_facilities.trust_state`,
`v2_entities.trust_state/qualifying_sales/kind`, `v2_verification_requests.state`,
`v2_field_visits`). **Aucune migration. Aucune donnée neuve.** Le manque était un
**écran** (Surface), pas un schéma.

## 2. Livré

- **`getSellerVerification`** (`trunk-repository.ts`) — **une** lecture owner-scopée
  (jointure `v2_accounts` sur `auth_user_id`), CTE `owned` + `request` + `visit`.
  Retourne : `trustState`, `qualifyingSales`, `requiredCount` (1 particulier / 3
  commerce, `::int`), `requestState`, `visitState/Zone/Date`. **D-OPS-5 : lecture
  seule** — jamais un contact acheteur, jamais un message, jamais une écriture de badge.
- **Route** `GET /api/v2/seller/facilities/:id/verification` (401 sans session,
  400 uuid invalide, 409 non-owner, 200 owner).
- **Client** `getSellerVerification` + type `SellerVerification`.
- **Module pur** `src/trunk/verification-status.ts` — `sellerVerificationBadge`
  (état interne → **badge public** ; `certified` = palier **INTERNE** S-31 → se lit
  « confirmée » ; tout état non gagné reste « non revendiquée ») et
  `sellerVerificationStep` (l'étape vraie, priorité au fait le plus avancé).
- **Sheet** `SellerVerificationV13` (`data-sheet="verification"`), **entrée menu
  vendeur « Vérification » → où en est mon badge**, `journeySheets`, retour → `seller`.

## 3. Règles porteuses falsifiées (méthode)

- Test unitaire `verification-status.test.ts` (**11 cas**) : badge dérivé
  (`certified`→confirmée ; transitoires→non revendiquée), étape priorisée, seuil par
  nature.
- **Garde de source** (dans le même fichier) : la lecture ne contient **aucune
  écriture** (`insert`/`update`/`delete`) et **n'expose jamais** `contact_phone`/
  `contact_whatsapp`/`v2_transaction_messages`. **Falsified** : injection d'un
  `update v2_facilities set trust_state …` dans `getSellerVerification` →
  **1 échec** (`not.toMatch(/\bupdate\s/)`) ; restauré → 11/11.
- **Garde `check:dock-search`** étendu de 16 à **24 règles** (`menu-01-verification`,
  `seller-verif-derived`), `--selftest` **25/25 fired** en deux directions.

## 4. Preuve SQL réelle (branche jetable `ds14-verif-proof`, supprimée)

La suite du dépôt **stubbe le SQL** (angle mort connu) → la requête a été **exécutée
sur Postgres réel** :

- owner `demo@seller.omni` / `Omni Demo Seller Hub` : `trust_state=unconfirmed`,
  `qualifying_sales=2`, `required_count=3` (commerce), `request_state=null`,
  `visit_state=null` — **résolu, pas inventé**.
- **non-owner** (`auth '000…'`) → **0 ligne** (garde de propriété discriminante).
- demande `draft` insérée → `request_state='draft'` ; visite `a_visiter` zone
  `Adawlato` → `visit_state='a_visiter'`, `visit_zone='Adawlato'` — **la lecture
  reflète l'état réel**.
- branche jetable **supprimée** (0 résidu).

## 5. État & résidus honnêtes

**Vérifié :** `tsc` clean · **835/835 tests** (84 fichiers) · build client +
12 bundles serverless (route + `getSellerVerification` présents dans les bundles
servis) · 8 gardes vertes (boundary/state/docs/coherence/live-surface/dead-css/
dock-search/maquette).

**Prod (T-07d ✅, 2026-10-07) :** push `b5ac9e8..1da8c3f` → prod
`omni.sparkafrika.online` sert `index-AOEiTYVv.js` **byte-identique** au build local
(sha256 `8e846352…`) ; la route `GET …/verification` répond **401** sans session ;
la chaîne « État de votre vérification » est **dans le bundle servi**.

**Résidu :** la preuve **navigateur avec session vendeur réelle** (parcours cliqué
contre prod) n'est pas capturée dans ce sandbox (pas de session) — même classe de
résidu que DS-12/DS-13. L'état est prouvé à trois niveaux : **serveur réel** (SQL sur
branche jetable), **rendu** (`SellerVerificationV13.test.tsx` jsdom — 3 cas :
badge/étape/seuil, `certified`→Confirmée, erreur non masquée ; la dérivation testée
est le module **réel**, seule la frontière réseau est mockée), et **bundle servi**
(route + `getSellerVerification` + « État de votre vérification » présents).
`seller-automation` (bascule dispo auto, **sans modèle** → décision) et `room`
restent ouverts.

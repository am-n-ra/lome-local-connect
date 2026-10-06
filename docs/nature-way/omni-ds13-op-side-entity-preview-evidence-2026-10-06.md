# DS-13 — `op-side` : aperçu côté entité, lecture seule · 2026-10-06

> **Porte** : Trunk · **Plan** : `NW-PROD-OMNI-DOCK-01` · **Tranche** : `DS-13`
> **Rattache** : `DOCK-02` (reste) — maquette `op-side` (« Aperçu côté entité ») · décision `D-OPS-3` (l'opérateur constate, ne décide jamais)
> **Owner** : relais · **Statut** : `verified`

## 1. Défaut mesuré (avant cette tranche)

`DOCK-02` a été **à moitié** livré par `DS-3` + `TF-6` : le dock terrain
opérateur (`Tournée` → sheet `tour` : `op-queue` + `op-visit` + `op-report`)
existe. Le **reste** nommé par le registre était **`op-side`** — la maquette
`op-side` « Aperçu côté entité » : l'opérateur doit pouvoir **voir ce que voit
l'entité** (son badge, ses offres publiées, sa file de demandes) pour comprendre
un dossier, **sans rien modifier à sa place** (D-OPS-3).

Avant cette tranche : le dossier de tournée (`op-queue`) s'arrêtait à la prise /
au constat ; **aucun chemin** vers un aperçu de l'entité. `grep -rn 'op-side'
src/` ne remontait rien.

## 2. Livré

- **`src/server/trunk-repository.ts`** — `getOperatorEntitySide({ authUserId, visitId })` :
  **une** requête `read-only` (staff authentifié non suspendu, **scope de zone**
  de l'équipe respecté comme les autres files terrain). Résout l'entité selon le
  **type de sujet** de la visite : `claim`/`verification` → le lieu lui-même ;
  `offer_report` → la **facilité du produit** signalé (`p.facility_id`). Renvoie
  `subjectType · facilityId · entityId · entityName · entityKind · trustState ·
  qualifyingSales · publishedOfferCount · pendingRequestCount`.
- **`src/server/http.ts`** — route `GET /api/v2/public/facilities?reviewer=op-side&visit=<uuid>`
  (401 `AUTH_REQUIRED` sans session ; 400 `INVALID_INPUT` si l'id n'est pas un
  uuid ; 200 sinon). Aucune écriture.
- **`src/trunk/types.ts` / `api.ts`** — type `OperatorEntitySide` + `getOperatorEntitySide(token, visitId)`.
- **`src/trunk/OperatorEntitySideV13.tsx`** — sheet `op-side` : « Ce que voit
  l'entité » (badge public honnête · offres publiées · file de demandes), avec la
  phrase de contrat **« sans jamais modifier à sa place »**. Squelette au
  chargement (pas de « Chargement… » brut).
- **`src/trunk/TrunkAppV13.tsx`** — type `Sheet += 'op-side'`, `journeySheets`,
  état `opSideVisitId`, montage du sheet, **retour** `op-side → tour`, et
  **entrée** sur le dossier : bouton « Voir ce que voit l'entité ».
- **Aucun nouveau schéma.** Lecture seule (D-OPS-3) : le chemin ne touche ni
  `trust_state`, ni `commercial_plan`, ni une porte de décision.

## 3. Preuves

### 3.1 SQL réel exécuté (leçon NW-13j : les stubs ne compilent pas le SQL)

La requête exacte du dépôt (paramètres inlinés) a été exécutée **sur Postgres
réel**, sur une **branche jetable** (`ops-side-proof`, créée depuis la canonique
`br-dawn-hill-am5amy22` — identifiée par ses données : 13 744 facilités / 9
comptes / 16 produits), avec fixtures réelles (1 opérateur, 1 visite
`verification` sur « Boulangerie du Marché d'Adawlato », 1 visite `offer_report`
sur un de ses produits, 1 demande de dispo en attente) :

- `verification` → `facility_id=…201`, `entity_id=c3665b40…`, badge `confirmed`,
  `qualifying_sales=3`, `published_offer_count=3`, `pending_request_count=1`.
- `offer_report` (sujet = produit) → **même** lieu/entité résolu via
  `p.facility_id` — la branche de résolution est prouvée.
- **Cleanup** : fixtures supprimées, `visits=0` / `proof_requests=0` (0 résidu) ;
  branche jetable supprimée.

### 3.2 Preuve navigateur `scripts/prove-op-side-entity-preview.mjs` — 12/12

Session opérateur **stubbée au bord auth/API** (comme DS-12/DS-8/DS-3) ; l'app,
le dock opérateur, la tournée et l'appel `op-side` sont **de production** :
`rolepill Opérateur` → fermer le menu (dock centre `Carte`) → dock `Tournée` →
dossier → « Voir ce que voit l'entité » → sheet `op-side`, avec le **vrai**
`GET /api/v2/public/facilities?reviewer=op-side&visit=<id>` observé. Les trois
faits maquette rendus (badge `Vérifiée`, offres publiées, « 1 en attente ») et
la phrase de contrat. **0 pageerror.**

**Falsifiée** : bouton d'entrée retiré → **9 FAIL** (le sheet ne s'ouvre pas,
aucun appel `op-side`) ; restauré → **12/12 PASS**.

### 3.3 Garde `src/trunk/op-side-guard.test.ts` — 4 tests

- `D-OPS-3` : `getOperatorEntitySide` **n'écrit aucun badge** (`set trust_state`,
  `set commercial_plan`) ni porte de décision — et **lit** bien `trust_state`.
- La route est gardée (auth + `reviewer=op-side`).
- La surface montre les 3 faits + la phrase de contrat.
- Libellé de badge honnête (`confirmed`/`certified` → `Vérifiée` ; `unconfirmed`
  → `Non vérifiée` ; le reste → `Non revendiquée`).

**Falsifiée** : une écriture `'set trust_state = x'` injectée dans la méthode →
le test **échoue** ; retirée → **4/4**.

## 4. État

- `821/821` tests · `tsc` 0 · 8 gardes verts (boundary/state/docs/coherence/
  live-surface/dead-css/dock-search/maquette).
- Registre `omni-dock-search-conformance-register-2026-10-06.md` : `DOCK-02`
  passe à **LIVRÉ (DS-3 + TF-6 + DS-13)**.
- **Poussé** `fd003cb` → `origin/omni-v2-rebuild` ; Vercel a reconstruit.
  **T-07d ✅** : prod sert **`index-Dgv8gkm8.js` === build local** (byte-identique),
  **entrée de déploiement GitHub pour `fd003cb`** présente ; route
  `GET /api/v2/public/facilities?reviewer=op-side&visit=…` → **401** sans session
  en prod ; chaîne `reviewer=op-side` présente dans le bundle **servi** ;
  **preuve navigateur rejouée contre la prod → 12/12 PASS**.
- **Résidu honnête** : le rendu avec **session opérateur réelle** (compte
  `juniorkheir@gmail.com`) n'est pas capturé — session réelle indisponible au
  sandbox ; la preuve navigateur stubbée (local **et** prod) + le SQL réel + le
  garde falsifié couvrent le contrat. Spot-check fondateur = preuve visuelle finale.

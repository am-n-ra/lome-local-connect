# DS-12 — Fraîcheur de la disponibilité (moitié vendeur) · 2026-10-06

> **Porte** : Trunk · **Plan** : `NW-PROD-OMNI-DOCK-01` · **Tranche** : `DS-12`
> **Rattache** : `SEARCH-02` / décision `D-03` (fraîcheur) · `MENU-01` (destination maquette `fraicheur`)
> **Owner** : relais · **Statut** : `verified`

## 1. Défaut mesuré (avant cette tranche)

`SEARCH-02`/`D-03` avait été livré **côté acheteur** (`offer-freshness.ts` +
`freshbar` dans `results`, `DS-10`). La **moitié vendeur** manquait :

- La route serveur `POST /api/v2/seller/catalogue/:id/availability`
  (`setProductAvailability`, D-04 **Pro-gated**, écrit la fenêtre de fraîcheur)
  **existait** — mais `grep -rn setProductAvailability src/` ne remontait **aucun
  appelant UI** (seuls `api.ts` et `server/http.ts`).
- Conséquence mesurée sur la canonique : les offres publiées restaient à
  `availability_state='a_valider'` — **0/16 transactables**, aucune ne pouvait
  devenir vivante faute d'un chemin d'écriture dans l'app.
- L'écran maquette `fraicheur` (dernière confirmation, seuil 4 h/24 h, badge
  affiché, « Reconfirmer maintenant ») **n'avait aucun équivalent app**.

## 2. Livré

- **`src/trunk/SellerFreshnessV13.tsx`** — sheet `freshness` : bandeau
  (dernière confirmation, seuil, badge affiché), **fenêtre 4 h / 12 h / 24 h**,
  « Reconfirmer maintenant » (par offre et pour toutes), liste des offres
  publiées avec badge dérivé et action par offre.
- **`badgeFor(product, now)`** exporté — badge public **dérivé** de la fenêtre :
  `En stock` (frais) · `À confirmer` (`stale`) · `Non confirmée` (expiré /
  `a_valider`) · `Hors ligne` (non publié).
- **Câblage** `TrunkAppV13.tsx` : type `Sheet += 'freshness'`, `journeySheets`,
  retour contextuel (`freshness → seller`), entrée menu vendeur
  **« Fraîcheur de la dispo · 4 h frais · 24 h expiré »**.
- **Aucun nouveau schéma** : réutilise `setProductAvailability` (déjà en base,
  `038` : `availability_expires_at` + auto-transition serveur) et le module
  `offer-freshness.ts` (déjà vivant côté acheteur). La fraîcheur reste **dérivée,
  jamais stockée** (invariant D-03).

## 3. Preuves

| Preuve | Résultat |
|---|---|
| Tests de contrat `badgeFor` (frais / `stale` / expiré / `a_valider` / brouillon) | **5/5** |
| Smoke de montage (sans session → état vide honnête, **jamais « En stock »**) | **1/1** |
| Suite complète | **817/817** (81 fichiers) |
| `tsc --noEmit` | **0** |
| Gardes (boundary, state, docs, coherence, live-surface, maquette, dead-css, dock-search) | **8/8 OK** |
| Garde `dock-search` | **PASS 22 règles** |
| Auto-falsification `dock-search --selftest` | **23/23 mutations déclenchent** (dont `menu-01-freshness`, `search-02-seller-write`) |
| Preuve navigateur `prove-ds12-seller-freshness.mjs` (session vendeur **stubbée au bord auth** ; app/menu/sheet/route réels) | **11/11 PASS** — le menu porte la destination, le sheet s'ouvre, le seuil est nommé, un badge **dérivé** (jamais « En stock ») s'affiche, et **« Reconfirmer » émet le vrai `POST …/availability` `{to:'en_stock', expiresInHours:4}`** |

**Falsification** : la règle `search-02-seller-write` échoue si l'on retire
`to: 'en_stock'` **ou** `expiresInHours: windowHours` (elle vérifie que l'écran
re-confirme *réellement* une dispo vivante via la route Pro-gated, et **ne**
référence **pas** la colonne SQL brute). La **preuve navigateur** a aussi été
falsifiée : muter la cible en `to:'a_valider'` → **FAIL (1)**
(`{"to":"a_valider",...}`), restauré → PASS.

## 3bis. Vérification PROD (T-07d)

| Preuve | Résultat |
|---|---|
| Push | `9c30607..aecfe47` sur `origin/omni-v2-rebuild` |
| Déploiement Vercel | entrée `Production` pour **`aecfe477…`** (= HEAD) |
| Hash prod === build local | `index-Ck9ht1wn.js`, **sha256 `0e19fa7f…` identique** |
| Chaînes dans le bundle **servi** | « Fraîcheur de la dispo », « Reconfirmer maintenant », « 4 h frais » présentes |
| Route gardée en prod (sans session) | `POST …/availability` → **401** |
| Preuve navigateur **vs prod** (`APP_URL=https://omni.sparkafrika.online`) | **11/11 PASS**, 0 pageerror |

## 4. Résidu honnête

- **Non exercé de bout en bout avec une session vendeur réelle** : la confirmation
  réelle exige une **session vendeur Pro** (Neon sign-in indisponible au harnais).
  La preuve prod est **comportementale au bord auth** (session stubbée : app, menu,
  sheet, route et **appel POST réel** sont ceux de production) + **route 401**
  sans session ; le parcours **authentifié** reste un spot-check fondateur.
- L'écran maquette `fraicheur` reste décrit dans la maquette comme
  **entité/Pro** (auto-dispo) ; la **bascule auto** est une autre surface
  (`seller-automation`, **sans modèle en base** → non construite, pas de bouton
  mort).
- **Reste ouvert** : `MENU-01` (**8** destinations vendeur sans écran) ·
  `op-side` · `seller-automation` · `room`.

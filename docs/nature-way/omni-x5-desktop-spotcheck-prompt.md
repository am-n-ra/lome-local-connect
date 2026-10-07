# X5 — Prompt de spot-check desktop (session hors sandbox, Playwright)

Décision fondateur « 3 » : la seule chose que le sandbox **ne peut pas** mesurer, ce sont les
surfaces **authentifiées** (tiroirs vendeur/admin, top fixe desktop + drawers) faute de session.
Ce prompt est à coller tel quel dans une session **hors sandbox** (ou toute session avec
Playwright + accès réseau). Il produit un **verdict chiffré**, pas une impression.

---

## Contexte à donner à l'agent

- App : `https://omni.sparkafrika.online` (prod). Branche `omni-v2-rebuild`. Gate `ROOT_CLOSED_TRUNK_OPEN`.
- **Comptes réels** (Neon Auth) :
  - Vendeur : `demo@seller.omni` / `Omni@2026`
  - Acheteur : `demo@buyer.omni` / `Omni@2026`
  - Admin : `kheirlissi@icloud.com` (mot de passe fondateur)
- Déjà corrigé et garanti (X4) : sur desktop, la **légende de carte ne doit PAS recouvrir le rail
  de filtres** (`.map-legend` au-dessus de `.filterrail`). Un garde automatique le verrouille
  (`desktop-layout-guard.test.ts`).
- Objectif du spot-check : **zéro élément caché/occlus derrière le sélecteur de rôle** (rolepill)
  ou toute UI fixe, **une fois connecté**, aux largeurs desktop.

## Ce que l'agent doit faire (Playwright)

Pour **chaque** viewport desktop **{1040, 1280, 1920}** (et, en contrôle, mobile **390** et
tablette **768**) :

1. **Console propre** : collecter `page.on('pageerror')` et `console.error` ; attendre la fin de
   l'animation de recherche (ou 8 s) ; signaler toute erreur. Une erreur `on2`/MapLibre = FAIL.
2. **Panneau connecté** : se connecter (formulaire `/auth` → email/mot de passe ci-dessus),
   puis, pour **chaque sheet** : `search`, `results` (après une recherche réelle, ex. `q=jus` qui
   remonte une facilité), `facility`, `wallet`, `plans`, `account`, `menu`, `notifs`,
   `favorites`, `saved`, `onboard` (déclenche une action gardée si déconnecté pour l'obtenir),
   `seller`, `admin` (avec le compte admin) — mesurer.
3. **Détection d'occlusion (la mesure qui compte)** :
   - Lister tous les éléments **interactifs visibles** (`button, a[href], input, select,
     textarea, [role=button]`) avec une boîte non nulle.
   - Pour le **centre** et les **4 coins à 2 px** de chaque élément, `document.elementFromPoint(x,y)`
     ; si l'élément retourné **n'est ni l'élément ni son descendant ni son ancêtre** → **occlusion**.
   - Cas particulier à vérifier explicitement : la **rolepill** (`z-index` élevé) ne doit **rien**
     recouvrir d'autre ; idem `.navpill`/rail, `.countmark`, `.sheet-handle`, `.searchdock`.
   - Vérifier la **géométrie** : aucun élément avec `top < rolepill.bottom` **sur la même
     colonne** sans décalage vertical (le défaut X4 : légende `top:52` == filtres `top:50`).
4. **Cibles tactiles** (mobile/tablette) : toute cible interactive ≥ **44×44 px** (RSP-1). Sur
   desktop, signaler (non bloquant) les cibles < 24 px.
5. **Safe-areas PWA** (mobile, `viewport-fit=cover`) : aucun contenu sous l'encoche/barre.
6. **Captures** : une image par viewport×sheet notable (au moins search, results, facility,
   seller, admin connectés) → dossier `docs/nature-way/x5-desktop-spotcheck/`.

## Format de sortie attendu

- Tableau : `viewport × sheet → occlusions[] (élément occlus, élément occlusif, rect) · cibles <44px[] · erreurs console[]`.
- **Verdict par viewport** : `PASS` (0 occlusion réelle, 0 erreur) ou `FAIL` (liste).
- **Recommandation** : si un élément est occlus, fournir le **sélecteur CSS**, les `top/z-index`
  calculés des deux éléments, et la correction minimale proposée.

## Critère d'acceptation

- **0 occlusion réelle** aux 3 largeurs desktop, sur **toutes** les sheets listées, une fois
  connecté (vendeur **et** admin), **0 pageerror**.
- Toute divergence devient une dette nommée (élément, sélecteur, mesure) — pas un « ça a l'air OK ».

## Notes d'exécution
- Chainer les commandes (contrainte d'environnement d'une seule commande à la fois).
- `npx playwright install chromium` d'abord si le cache est vide.
- Comparer **prod** au **build local** (hash `dist/assets/index-*.js`) pour savoir si un écart est
  un défaut produit ou un **écart de déploiement** (T-07d) — un push ne prouve pas un déploiement.

# Omni — Registre des problèmes UI (mesuré)

> **Date :** 2026-10-04 · **Méthode :** mesure, pas d'impression. Scan statique
> (`src/trunk/*.tsx` + `*.css`) + audit navigateur Playwright aux 4 largeurs
> (360 / 768 / 1280 / 1920), parcours accueil → recherche → résultats → fiche →
> menu. **Portée :** app (`src/trunk`), pas la maquette.
>
> **Statut de porte :** `ROOT_CLOSED_TRUNK_OPEN` (Trunk ouverte 2026-10-02).
> Ce registre est un **constat**, pas une décision — chaque correction attend un
> ordre.

---

## Ce qui est MESURÉ PROPRE (pour ne pas le « corriger »)

| Contrôle | Résultat |
|---|---|
| Erreurs JS console | **0** `pageerror` aux 4 largeurs, tous écrans |
| Débordement horizontal (document) | `scrollWidth === innerWidth` aux 4 largeurs |
| Débordement de contenu réel | **0** (hors `.map-status`/`.sr-only`, hors-champ volontaires) |
| Contraste texte | **0** sous le seuil WCAG (fond peint réel, remontée de l'arbre) |
| Texte tronqué sans ellipsis | **0** (hors `.sr-only`) |
| Contrôles sans nom accessible | **0** sur l'accueil (`aria-label`/texte présents) |
| Focus clavier | anneau visible (`outline 3px solid`) |
| `lang` | `fr` |
| « Bientôt » désactivés | réellement `disabled`/`aria-disabled` — honnêtes |
| Squelettes de chargement | **27** usages `<Skeleton>`, garde `skeleton-coverage.test.ts` active |
| `role="status"` / `aria-live` | **29** / **5** — annonces de chargement présentes |
| TODO / FIXME / handler vide | **0** / **0** |

**Conclusion partielle :** le socle UI est **solide** (full-bleed tenu, contraste
OK, a11y de base OK, zéro crash). Les problèmes sont des **dettes**, pas des
pannes.

---

## Problèmes mesurés

| ID | Sévérité | Problème | Preuve (mesurée) | Propriétaire |
|---|---|---|---|---|
| `UI-1` | **Haute (dette)** | **75 % du CSS de production est mort.** `src/styles.css` : **311/346** classes non référencées (89 %) ; `src/trunk/v3.css` : **169/224** (75 %) ; `ui-v13.css` : 24/147 (16 %). L'app charge **188 Ko** de CSS dont ~⅔ inutilisé, avec **3 vocabulaires concurrents** (design.md en autorise un seul). C'est la dette de la reconstruction (v1/v3 morts non supprimés). | script Python : classes définies vs référencées dans `src/**/*.ts(x)` | Trunk (nettoyage, ordre requis) |
| `UI-2` | **Moyenne** | **Cibles tactiles sous 40 px sur mobile** (standard iOS 44 / Material 48). Mesuré à 360 px : boutons carte zoom/localisation **36×36** ; `.fchip` filtres **26 px de haut** ; pastille rôle **25 px** ; bouton **35×35** ; bouton centre dock **37×37** ; `.chip` recherche **27 px** ; `.btn.ghost` retour **37×28**. Sous le seuil = ratés au doigt. | Playwright 360 px, `getBoundingClientRect` | Trunk |
| `UI-3` | **Moyenne** | **12 boutons icône-seule sans nom accessible** (7 écrans : Company, Offers, Onboard, ProductCatalogue, SellerReply, BuyerFlow, Admin). Le glyphe Lucide porte l'intention, pas de `aria-label`/texte → lecteur d'écran dit « bouton ». Prouvé vivant : un bouton sans nom dans la feuille recherche. | grep + probe a11y | Trunk |
| `UI-4` | **Moyenne** | **18 caractères invisibles** (U+200B zero-width space) dans 4 fichiers : `AdminV13`, `BuyerFlowV13`, `CompanyV13`, `TrunkMap`. Ex. `CompanyV13:42` `minHeight: ␣28`. Détecté au `od -c` (octets `342 200 213`). Invisible à l'œil et à `tsc` ; casse les recherches exactes et trahit une génération. | `grep -P` + `od -c` | Trunk |
| `UI-5` | **Moyenne** | **Dialogue natif non-thémé** : 2 `window.alert` (TrunkApp : erreur d'acceptation d'invitation d'équipe) + 2 `window.confirm` (AdminV13 : révoquer invitation, retirer membre). Bloque le fil, hors ADN monochrome, non annoncé a11y — alors que l'app a déjà `toast` + `cardbox`. | grep | Trunk |
| `UI-6` | **Basse** | **Le chrome (dock, rôle, filtres carte) n'est pas en français** : « Buyer », « Seller », « Admin », « Operator », « Buyer Pro/Free », « Espace Seller/Buyer », « Tout/Commerces/Particuliers/Transport ». Contraste avec le vouvoiement FR du reste et la décision fondateur (FR UI). | grep chaînes + probe (`rolepill` = « Buyer ») | Trunk (décision libellés) |
| `UI-7` | **Basse** | **Dérive de jetons couleur** : `#2E8B6F` en dur dans `TrunkAppV13:2153` (au lieu de `var(--accent)`) ; `#e8e8e6` ×3 dans `AdminV13` (n'existe pas — `--panel-deep` = `#e6e6e6`) ; `#8a5a00` comme repli `var(--warn)` alors que le jeton `--warn` vaut `#8a6d1f`. Plus **33 littéraux hex** dans les `.tsx` hors `TrunkMap` (style de carte, tolérable). | grep + comparaison `design.md` §1 | Trunk |
| `UI-8` | **Basse** | **506 styles inline** (`style={{…}}`) dans `src/trunk` : TrunkAppV13 **194**, SellerV13 **144**, BuyerFlowV13 50, AdminV13 42. `design.md` §6 dit « no inline colors ». Empêche le thème central, gonfle le bundle, rend le CSS mort (lien avec `UI-1`). | grep | Trunk |
| `UI-9` | **Basse** | **« Chargement… » de secours du chunk** (`TrunkAppV13:3084`, `mapState==='loading'`) : filet `Suspense` légitime mais **non squelette** (les autres surfaces le sont). Incohérence mineure de la famille `SK-4`. | grep | Trunk |
| `UI-10` | **Basse** | **Motif de squelette absent de la maquette** : `docs/maquette/omni-species-v2-interactive.html` n'a aucun motif squelette ; l'app en a 27. Écart app↔maquette (l'app est en avance) — à porter dans la maquette ou à acter. | grep maquette | Trunk/Species |

---

## Priorisation suggérée (constat, pas décision)

1. **`UI-1` + `UI-8`** — un même chantier : tuer le CSS mort (3 fichiers → 1
   vocabulaire), puis migrer les styles inline vers des classes. **C'est la
   dette la plus lourde et la cause des incohérences futures.**
2. **`UI-2` + `UI-3` + `UI-4`** — lot a11y/tactile : cibles ≥ 44 px, noms
   accessibles, purge des caractères invisibles.
3. **`UI-5` + `UI-6` + `UI-7`** — honnêteté/ADN : remplacer `alert/confirm` par
   `toast`/`cardbox`, trancher les libellés EN, aligner les jetons.
4. **`UI-9` + `UI-10`** — finitions.

## Ce qui N'A PAS été mesuré (résidu honnête)

- **Screens authentifiés** (seller/admin/operator/transaction/QR) : le sandbox
  n'a **pas** de session → l'audit runtime couvre le **parcours public**
  (accueil→recherche→résultats→fiche→menu) seulement. Les problèmes des espaces
  vendeur/admin restent à mesurer avec une session réelle.
- **Zoom navigateur 200 %**, contraste réel sur appareil, lecteurs d'écran
  (VoiceOver/TalkBack) : non exécutés.
- La maquette (74 écrans) a son propre garde (`check:maquette`) ; ce registre
  ne juge que l'app.

---

## Traitement (slice `NW-PROD-OMNI-UI-01`, 2026-10-04)

| ID | Statut | Ce qui a été fait / mesuré |
|---|---|---|
| `UI-4` | **FERMÉ** | **39** caractères invisibles retirés (pas 18 — le garde en a trouvé 21 de plus dans `ui-helpers.ts` + 2 tests). Tous en `src/` : 0 restant. Garde `no-invisible-chars.test.ts`. |
| `UI-3` | **FERMÉ** | **6** boutons icône-seule nommés (`Fermer` ×5, `Rechercher` ×1) — le registre disait 12 ; les autres étaient des faux positifs (`{lang.catalogue}` = texte). Garde `button-accessible-name.test.ts` (auto-falsifié). |
| `UI-7` | **FERMÉ** | 3 replis de jeton morts retirés (`var(--line,#e8e8e6)`, `var(--warn,#8a5a00)`) + `#2E8B6F` → `var(--accent)`. Les replis étaient **morts** (jetons toujours définis) → refactor pur, rendu inchangé (prouvé A/B). |
| `UI-2` | **FERMÉ (mesuré)** | Contrôles **carte** (zoom/localisation) 36/38 → **44×44** (vérifié 360 & 1280). **Reste : aucune action justifiée.** Mesure : la **maquette (autorité)** rend rolepill **21 px**, `.fchip`/`.chip` **23 px** ; l'app est **déjà plus généreuse** (25 / 26 / ~27). `design.md` §4/§5 : `.rolepill`/`.navpill` = chrome **immuable** et densité 8–10 px **by design**. Agrandir à 44 px **divergerait de l'autorité** (changement maquette = décision Species), donc hors de cette tranche de cohérence. |
| `UI-1` | **FERMÉ (mesuré)** | Détecteur initial **non fiable** (`dynamic_prefixes: []`, ratait `classList.toggle('desktop')`, `sk-${variant}`, `body.className`). **Méthode saine** : une classe n'est **retirable** que si son nom est **absent en tant que token de TOUT `src/**` + `index.html` + `public/**`** (aucun code React ne peut l'appliquer) et n'est ni **injectée par bibliothèque** (`maplibregl-`/`mapboxgl-`) ni **membre d'une famille dynamique** (`sk-*`). Élagage **règle-par-règle** (brace-aware) : **-875 règles**, **-22 blocs `@` vides** — `styles.css` 1163→901, `v3.css` 2439→1165, `ui-v13.css` 300→299. **A/B rendu IDENTIQUE** (1 338 empreintes × home/search/results/facility/menu × 360/768/1280/1920 : **0 diff**). **Contrôle indépendant** : **124** classes utilisées en source, **0** retirée. Garde durable `check:dead-css` (règle-niveau, **falsifié** : `.zzz-dead` → exit 1). Le bloc `@media (min-width:1280px)` retiré référençait l'**ancienne coquille V1.3** (`omni-sheet-search`/`omni-results-surface`/`omni-navpill` — 0 usage) ; la coquille **courante** (`.navpill`/`.mapbase`/`.sheet`/`.omni-v13-stage` ×18 règles) est **intacte**. |
| `UI-5` | **FERMÉ** | 2 `window.alert` (acceptation d'invitation) → `role="status"` toast ; 2 `window.confirm` (révoquer invitation, retirer membre) → **bannière inline** `role="alertdialog"` (Annuler/Confirmer), plus de dialogue natif. Garde `no-native-dialogs.test.ts` (auto-falsifié). |
| `UI-6` | **FERMÉ** | **Appliqué (lot validé fondateur « go on a »).** Aligné sur la maquette : rolepill `Buyer/Seller/Opé.` → **`Acheteur/Vendeur/Opérateur`** ; « Espace {rôle} » → **Espace acheteur/vendeur** (+ statut FR) ; « Recherche Seller » → **Recherche vendeur** ; `Buyer Pro`→**Acheteur Pro**, `Vendeur/Acheteur Free`→**Gratuit**, `Free`→**Gratuit**, « Plans Buyer/Seller »→**Plans Acheteur/Vendeur**, « Espace Seller »→**Espace vendeur**. Garde `french-chrome.test.ts` (auto-falsifié). **Preuve navigateur** (390 px) : avant `Buyer` / `Espace buyer` / 1 mot EN ; après `Acheteur` / `Espace acheteur` / **0 mot EN** (`docs/nature-way/ui6-proof/`). |
| `UI-8` | **FERMÉ (mesuré, portée design.md)** | `design.md` §6 : « no inline colors ». Mesure : sur **524** `style={{ }}`, la quasi-totalité est **`var(--token)`** (échappatoire sanctionnée pour la mise en page ponctuelle) ; **6** portaient une **couleur littérale** — corrigées vers des jetons (`#fff`→`var(--white)`, `#0f0f0f`→`var(--ink)`, `#bbb`→`var(--on-ink-soft)`, `#6b6b6b`→`var(--ink-soft)`), 2 jetons ajoutés (`--white`, `--on-ink`/`--on-ink-soft`). **A/B rendu IDENTIQUE** (1 338 empreintes, 0 diff). Garde `no-inline-colors.test.ts` (auto-falsifié). |
| `UI-9` | **FERMÉ (sans action — par conception)** | Mesuré : les deux seuls « Chargement… » vivants sont des **statuts carte** (3088 `map-legend`, 1557 `map-status`), que la contrainte de design exige en **texte**. Le `<Suspense>` de 1742 est **mort** : **aucun `React.lazy`** dans `src/trunk` → `TrunkMap` est importé statiquement et ne suspend jamais. Forcer un squelette ici **violerait** la contrainte. Aucun changement. |

**Preuve de non-régression :** `scripts/prove-ui-ab.mjs` rend le parcours public
à 4 largeurs et compare les empreintes (structure + style stable, géométrie
exclue car le morph du dock bouge en rAF). **Plancher de bruit = 0** (base vs
base `RENDER IDENTICAL`) ; pré/post `UI-S1..S4` = **`RENDER IDENTICAL`**.
777/777 tests, `tsc` propre.


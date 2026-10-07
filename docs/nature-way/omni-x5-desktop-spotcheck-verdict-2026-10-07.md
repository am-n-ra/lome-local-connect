# X5 — Verdict spot-check occlusion desktop (mesuré, 2026-10-07)

> **Porte :** Trunk OPEN · **HO-OMNI-34** (ex-30, renommé : l'autre session tient 30-33).
> **Méthode :** `scripts/spotcheck-x5-occlusion.mjs` — 5 viewports (1040/1280/1920 +
> 390/768), sessions réelles seller/buyer (Neon Auth), elementFromPoint centre +
> 4 points ±30% (pas les coins : un bouton rond ne peint pas ses coins), double
> mesure à 2 s (seul le stable compte), jumeaux/slivers/clipped classés à part.
> Captures : `docs/nature-way/x5-desktop-spotcheck/x5-<vp>-<sheet>-<role>.png`.
> Lignes JSON : `x5-rows-<vp>.json`.

## Verdict par viewport (occlusion géométrique)

| Viewport | Sheets mesurées | occl réelle | Verdict |
|---|---|---|---|
| 1040 desktop | search, results, facility, wallet, plans, account, notifs, favorites, saved, menu, seller | **0** | **PASS** |
| 1280 desktop | idem | **0** | **PASS** |
| 1920 desktop | idem | **0** | **PASS** |
| 390 mobile | idem | **0** | **PASS** |
| 768 tablette | idem | **0** | **PASS** |

**0 pageerror / 0 erreur MapLibre** partout (boot + toutes passes). T-07d : prod sert
un build plus récent que le dist local (delta env, pas produit) — contenu vérifié
(sw v3, chaînes TF-5/TF-6, règle fade présente dans le CSS servi).

## Trouvailles nommées (pas des « looks fine »)

### DOCK-DUP — jumeaux `.navpill` empilés (toutes largeurs, 12–23 jumeaux)
- **Mesure :** 1 pill au boot → 4–23 après interactions (menu, sign-in) ; même rect,
  markup identique (htmlLen égal), handlers identiques ; `elementFromPoint` touche
  les svg des jumeaux ; clics Playwright stricts **timeoutent** (« subtree intercepts
  pointer events ») ; insertions via commit React (`insertBefore`) ; fibres même-clé.
- **Source :** UN seul site JSX (`TrunkAppV13`, `div.navpill key={role}`), 1 stage —
  cause racine dans le chemin de rendu, non localisée statiquement.
- **Impact :** clics humains survivent (bubbling, mêmes handlers) ; casse
  l'automatisation + 5–23 landmarks `navigation` identiques (a11y) + poids DOM.
- **Fix :** tranche code dédiée (dédup garde : 1 seul `.navpill` après N cycles).

### X5-ZONE-SCROLL — contrôles cachés en scroll horizontal sans affordance (1040/1280)
- **Mesure :** chips « Créneau bientôt » [1140,24] + « 1 km »→« Monde » (jusqu'à
  x=1552, hors viewport) + input seuil « Au moins 1 » [942,21] : débordent de la
  zone (clip), couverts au bord par le rolepill z17 (rect [1138..1266] / [898..1026]
  à 1040). Atteignables au scroll/clavier (vérifié : scroll 0→482, chip à x=766,
  self-hit). **Pas peints sous le rolepill** (clippés) — reclassé découvrabilité.
- **Fix appliqué (minimal, additif) :** fondu `mask-image` 30px sur la zone
  (`ui-v13.css`, desktop search) — signale le scroll sans toucher au layout.
  Réordonner/enrouler = décision design (lane dock-search, ne pas imposer).

### RSP-1 tactile mobile — tabs rolepill corrigés, reste UI-2
- **Corrigé ici :** tabs Acheteur/Vendeur 62×25/58×25 → `min-height:44px`
  (l'indicateur `.ind` top:0/bottom:0 suit). Vérifié : absents des <44px après.
- **Reste (UI-2, pas cette tranche) :** submit recherche 267×42, icône 32×32/37×28,
  `.field` 32px, `.btn` 40px, `.btn.sm` 34px — système design 40px vs mandat 44.
  Refonte système = décision fondateur (registre UI-2 existant).

### Hygiène / benign
- **Slivers :** pins a11y carte (`DIV.map-pin-a11y > BUTTON`, 200–1429 selon viewport,
  1px, feature AT pas défaut) + restes 1px de panneaux repliés.
- **Console 404 :** `/api/v2/buyer/credits` 404 = **by design** (pas de compte crédit,
  message « No bulk credit account yet », `http.ts`) ; 2e 404 = même fetch en double.
- **Safe-area :** règle `max(14px, env())` présente (device Phase D pour la valeur).
- **Admin : BLOCKED** — session admin impossible sans mot de passe (jamais demandé
  en chat, règle secrets). **Onboard : partiel** (facilités q=jus sans produits ;
  preuve onboarding couverte par X5-onboarding côté autre session).

## Preuves falsifiées en cours de route
Sonde neutre→exigeante : coins→±30%, double-mesure, jumeaux/slivers/clipped classés,
force-click traversal (verdict = géométrie seule), libellés FR, URLs 404, règle
safe-area source. Chaque durcissement motivé par un faux positif/négatif réel.

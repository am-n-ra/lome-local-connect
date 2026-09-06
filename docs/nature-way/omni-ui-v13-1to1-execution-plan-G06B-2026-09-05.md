# Plan d'exécution — Omni V13 1:1 (branche G-06B)

> **Structural path:** product > trunk > V13 UI 1:1 (desktop + carte + cinématique)
> **Phase:** Trunk/Heartwood/Branches — 1:1 contre maquette V1.3.latest
> **Source de vérité visuelle:** `docs/maquette/omni-species-maquette.html` (MAJ fondateur 2026-09-05) — copier les CSS/JS exacts de la maquette; **pas d'invention**; pas de données simulées en dur ( les surfaces continuent d'utiliser `api.ts`.)
> **Principe:** l'app ne DOIT PLUS « montrer la maquette » — elle DOIT ÊTRE la maquette en React, réelle.



## Diagnostic ( pourquoi ça « montre la maquette »;)

Le prod sert l'app réelle ( 206 facilités, API/auth réels, bundle == notre build) mais: (1) la coquille desktop V1.3 (`body.desktop` + `applyDesktopMode`) est **absente** → rendu mobile‑centered sur desktop; (2) quand les tuiles MapLibre échouent → écran « Carte indisponible »  la maquette, elle,a `initFallbackMap`); (3) la séquence cinématique et ses libellés (`Recherche dans le monde…` → `Togo · Lomé`) absents; (4) chips démo SIM absents; (5) micro‑copies facility/boutons raccourcies. Le rendu d'accueil ( carte en panne + liste + count) ressemble à une page‑maquette.



## Resource Receipt
| Statut | Exact path |
|---|---|
| Chargée ( référence visuelle) | `docs/maquette/omni-species-maquette.html` ( la maquette maître V1.3‑latest, committée) |
| Chargé ( plan HQ) | `.agents/skills/nature‑way‑founder‑hq/.agents/skills/nature‑way‑founder‑hq/(references, templates)` |
| Chargé ( contrôleur) | `.agents/skills/nature‑way/references/intra‑skill‑execution‑controller.md` + `execution‑controller.md` |
| Non chargée ( preuve exécutable) | preuve browser E2E sur prod — post‑push  sandbox n'a ni tuiles ni auth) |



## Slices verticaux ( ordre dépendance)

| ID | Slice | Dépend de | Condition de porte | Preuve requise | Statut |
|---|---|---|---|---|---|
| S‑1 | **Desktop chrome 1:1** — `body.desktop` câblé, CSS desktop porté intégral  depuis le bloc desktop du maquette), rail latéral gauche  navpill column),, top‑bar recherche permanente  notre `<form className="sheet h‑low">`),, panneau contextuel unique 340px  cols 84→424),, chrome `phone::before` / `::after` ● ● ●, `matchMedia(1040px` + resize | — | sur ≥1040px: rail+topbar+panneau visibles, sheets non‑search = colonne, map à droite, dock latéral; sur <1040: comportement mobile inchangé | build+tsc+tests+preview statique, mobile+desktop captures) | `ready` |
| S‑2 | **Fallback carte** — port `initFallbackMap` en React , surface SVG monde + surface méthode ,`easeTo/flyTo/once/cameraForBounds`); brancher sur l'échec MapLibre , remplace « Carte indisponible »); garder l'existant réel quand MapLibre répond | S‑1 | `Carte indisponible` n'apparaît PLUS؛ en cas d'échec, une carte visuelle animée avec pins, sans crash | tsc+tests+preview , mode offline simulé) | `todo` |
| S‑3 | **Séquence cinématique 1:1** — libellés `Recherche dans le monde…`/`Togo · Lomé` , reveal en 3 vagues, `flyTo` curve+padding),, branché sur notre `computeSearchFlight` | S‑1,S‑2 | la cinématique joue avant la grille , pas d'ouverture immédiate); libellés visibles; pins révélés en vagues | tsc+tests+preview | `todo` |
| S‑4 | **Chips démo SIM** — Normal/Aucun résultat/Réseau lent/Panne réseau dans le sheet recherche , force chaque scénario via sim state) | S‑3 | chaque scénario rend son état , vide/lent/erreur) sans crasher | tsc+tests | `todo` |
| S‑5 | **Micro‑copies exactes** — facility body (`Revendiquer cette facilité`, `La facilité n'est pas sur la carte ? Créer`, `Vente ambulante`, `Contact vendeur & chat…`, boutons) recopiés depuis la maquette | S‑1..S‑4 | copies == maquette , string‑exact) | grep diff | `todo` |
| S‑6 | **Push prod + preuve fondateur** — push `omni‑v2‑rebuild`, vérif hash prod == local, validation fondateur sur ≥1040px + mobile | S‑1..S‑5 | hash prod == local; fondateur confirme 1:1 sur desktop+mobile | preuve prod , curl+browser) | `todo` |



## Règles de porte , pour chaque slice)
- Source = maquette , extraire bytes exacts du `<style>`/JS du fichier); ne PAS réinventer.

- Pas de données simulées en dur; les surfaces restent câblées à `api.ts`; les « chips démo SIM » sont une abstraction d'état , comme leur nom: sim),, pas de fixtures marchandes.



- Chaque slice: `npx tsc --noEmit` + `npm test` + `npm run build` verts avant le prochain.



## Backlog ( deferred/watch)
- Surfaces restantes , ONBOARD minimal avec reprise automatique, soft paywall Pro) si non couvertes par S‑4/S‑5.
- aria‑modal/accessibilité desktop, observer la dette actuelle); focus trap desktop;
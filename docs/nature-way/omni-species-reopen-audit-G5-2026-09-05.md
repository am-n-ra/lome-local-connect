# Omni — Réouverture Gate 5/Species — audit delta UI vs maquette V1.3 (2026-09-05)

> **Déclencheur fondateur :** « je pense qu'on devrait réouvrir species parce que là on est assez loin maquette et même le motion de recherche n'est pas en place » (`/nature-way-founder-hq`).
> **Statut :** `review_founder` — audit produit, **aucun code modifié** (maquette avant pixels, contrat avant code(. Décisions requises listées au §4.

.

## 1. Faits de cadrage (mesurés en code(.



| # | Fait | Source |
|---|---|---|
| F1 | `main.tsx` monte `TrunkApp` → `TrunkMap.tsx` (et **pas** `MapCanvas.tsx`(; `MapCanvas` ne sert que les vieilles routes (`fiche.$id`, `vendeur`, `CartePage`. | `main.tsx`, `grep import MapCanvas` |
| F2 | Une cinématique de recherche **existe en code** : étapes monde → continent → pays → région → ville → cadrage résultats (`buildSearchRevealSteps`( + spin longitude à l'étape monde + `finish()` qui cadre les pins et ouvre la grille. | `TrunkMap.tsx` :860–970, `map-reveal.ts` |
| F3 | Le déclenchement exige `mapStatus==='ready'` (style vectoriel chargé( et `committedQuery` non vide (`searchRevealKey`(; NAS ce sandbox, le style vectoriel échoue (proxy CORS/tuiles( → `mapStatus='error'` → `searchRevealKey=null` → **le motion ne démarre jamais ici**. | `TrunkApp.tsx`:2354, `TrunkMap.tsx`:417/526/771 |
| F4 | La reprise post-auth (`returnTo==='search'`( appelle bien `beginSearch` après identité → la séquence *peut* reprendre en prod réel. | `TrunkApp.tsx`:2183–2195 |
| F5 | Il n'existe **pas** d'animation d'apparition échelonnée des pins (stagger( ; les pins sont révélés d'un bloc (`setFacilitiesVisibility(map,true)` en fin de reveal(. | `TrunkMap.tsx`:944+, `MapCanvas.tsx` setFacilitiesVisibility |
| F6 | Il existe une animation `omni-stagger` pour les **cartes DOM** (`.hcard`/`.pitem`/stepper(, mais pas pour les **pins canvas**. | `styles.css`:948–953 |
| F7 | Le rolepill est statique (3 boutons Buyer/Seller/…( ; pas de curseur glissant à `positionIndicator` de la maquette. | `TrunkApp.tsx` |
| F8 | Pas de countmark circulaire « 206 » (compteur de lieux( — pas de code ni CSS associé. | grep countmark/206 |
| F9 | Les chips contraintes de la maquette ne sont pas des boutons de démo (scénarios recherchables( — ce sont des filtres fonctionnels. | `LiquidSearchDock.tsx` |
| F10 | Onboarding : un panneau `onboarding` existe et mémorise requête+contraintes (`savePendingSearch`(, mais rien ne prouve qu'il reproduise les 3 étapes visuelles V1.3 (valeur → identité minimale → soft paywall(. | `TrunkApp.tsx`:1721–1737, 2677 |
| F11 | Le gating recherche non-connecté (V1.3 §4( est en place et conforme (la recherche est mémorisée, pas perdue( — mais UX : l'utilisateur voit le tunnel avant le motion. | `TrunkApp.tsx`:1728 |
| F12 | Desktop : coquille V1.3 implémentée (T-10w( — barre haute, rail gauche, tiroirs droits, dock rail gauche; bundle prod === local. | `v3.css`:2260+, `654ee22` |
| F13 | Écarts de surfaces desktop vs maquette : rail pré-recherche vide (polish documenté(, vignettes `.hcard` simplifiées (thumb 72×52( face à la grille de vignettes riche de la maquette; `aria-modal` sur barre/rail (sémantique à repasser vers `region`/`complementary`(. | `v3.css`, register §restants |
| F14 | `focusTarget` (clic pin( fait `easeTo` zoom≥14 — un saut caméra unique, pas le pavé tilt/rotate du moteur maquette. | `TrunkMap.tsx`:1001–1007 |## 2. Table de delta — code prod actuel VS maquette V1.3

| Élément (maquette V1.3) | Code prod actuel (récupéré F1–F14) | Verdict |
|---|---|---|---|
| **Motion recherche — pavé A**: tilt/rotate du globe avant recherche | Rien de tel; le globe ne penche jamais (`pitch` toujours 0); le world-step tourne la **longitude** (spin), pas le tilt. | **APPauvri** (absent vs V1.3) |
| **Motion recherche — pavé B**: `flyTo` + `curve:1.7` + `cameraForBounds` + padding, par étapes | `easeTo`/`jumpTo` par étapes + `fitBounds` final (padding top/right/bottom/left). | **PARTIEL** (étapes+spin+fit final présents, mais pas le pavé tilt/curve 1.7) |
| **Motion recherche — pavé C**: pins révélés échelonnés (50ms) | Pins révélés d'un bloc en fin de reveal. | **ABSENT** |
| **Motion recherche — déclenchement** | Câblé (F2–F4), mais bloqué ici `mapStatus!=='ready'` (env) et exige `committedQuery` (recherche validée), marchant sur prod réel. | **EN PLACE (code) / NON OBSERVABLE ICI (env)** |
| **Desktop coquille** (barre/rail/tiroirs/dock rail) | T-10w implémenté + prod poussé. | **EN PLACE** |
| **Vignettes riches / grille** (maquette) | `.hcard` compact thumb 72×52, rail texte. | **SIMPLIFIÉ** |
| **Rail pré-recherche élégant** (maquette) | Rail vide gris (dette polish). | **À POLIR** |
| **Rolepill glissant** (positionIndicator) | Boutons statiques Buyer/Seller/… | **ABSENT** |
| **Countmark « 206 »** | Absent (pas de compteur circulaire). | **ABSENT** |
| **Chips = démos** (scénarios recherchables) | Chips = filtres fonctionnels (pas de démo)。 | **AUTRE USAGE** (à trancher) |
| **Onboarding 3 étapes** (valeur→identité→paywall→reprise) | Panneau onboarding compact + reprise auto post-auth (F10–F11)。 | **FONCTIONNEL, VISUEL À COMPARER** |
| **Gating recherche §4** (non-connecté mémorise+reprend) | En place (F11). | **EN PLACE** |
| **Sémantique a11y desktop** (barre/rail) | `aria-modal` (dette) — devrait être `region`/`complementary`. | **DETTE** |
| **Carte** (MapLibre réelle, markers DOM échelonnés, countmark, controls +/−, compas) | Carte MapLibre (TrunkMap,, markers canvas (pas DOM), controls +/−, compas。 | **PARTIEL** |
| **Tilt/compas/contrôles** | Contrôles +/− présents; compas présent; tilt jamais utilisé. | **PARTIEL** |

## 3. Interprétation (honnête)

- « Le motion de recherche n'est pas en place » = **vrai ici** (ce sandbox: `mapStatus='error'` → `searchRevealKey=null` → jamais de vol), **mais faux en code** (la séquence existe et se déclenche sur prod réel dés que la carte charge)。 C'est un **blocage runtime-env** + une **chorégraphie appauvrie** (pas de pavé A, pins d'un bloc).
- « On est assez loin maquette » = **partiellement vrai** : le **squelette** (coquille desktop, gating, surfaces) est proche; les **moteurs cinématiques** et **détails de surface** (stagger pins, rolepill glissant, countmark, vignettes riches, rail pré-rempli, tilt) sont absents ou simplifiés.



## 4. Décisions fondateur requises (review_founder)

1. **Réouvrir officiellement Gate 5 — Species ?** Oui/non — à charger la maquette HTML V1.3 dans le repo (aujourd'hui: register texte + conversation seulement) pour permettre un comparatif visuel 1:1。
2. **Motion recherche** : quel niveau de fidélité ? (a) accepter l'exécution actuelle (étapes+spin+fit) et lever le blocage env pour l'observer en prod; (b) tracker les pavés A+C (tilt/rotate + stagger pins) comme dettes V1.3; (c) refaire la chorégraphie complète selon le HTML。

3. **Coquille desktop** : garder l'option 1 alignée (déjà en prod) ou revenir au centrage bottom V1.1 (désalligner) ?
4. **Surfaces simplifiées** (vignettes, rail pré-recherche, rolepill, countmark) : accepter avec dette, ou tracker un mini-lot de polish ?
5. **Chips** : restent des filtres fonctionnels, ou deviennent des démos scénarisées ?
6. **Env de spot-check** : le fondateur valide-t-il de spot-checker sur son navigateur réel（prod） pour lever l'ambiguïté env-vs-code。



## Retour retour Founder HQ（handoff）

| Champ | Valeur |
|---|---|
| Gate | Gate  ​5 — Branches/UI (**re-ouvert `review_founder`** 2026-09-05) — le desktop delta reste `done` (654ee22), mais l'audit V1.3 complet recommande une décision de fidélité。 |
| Preuve | Audit ci-dessus（F1–F14）; tests 296/296（47 fichiers）; lint ✅; build ✅; prod bundle === local。 |
| Résidu |6 questions §4 — dont la plus critique : le niveau de fidélité du **motion recherche** (a/b/c) et le **stockage du HTML V1.3** dans le repo。 |
| Owner / prochaine action | Fondateur — répondre aux 6 questions; Nature Way — convertir les réponses en lots (maquette→pixels) à Gate  ​5。 |
| Révision | `review_founder` — aucun code modifié。 |

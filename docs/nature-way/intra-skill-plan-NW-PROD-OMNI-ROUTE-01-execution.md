# Intra-skill plan — `NW-PROD-OMNI-ROUTE-01` (exécution)

> **Skill :** `/nature-way` (+ `/nature-way-founder-hq`)
> **Handoff :** `HO-OMNI-18`
> **Décision fondateur :** « fix » — corriger la qualité d'itinéraire
> **Puis décision fournisseur :** « prenons mapbox comme fournisseur d'itinéraire » (RT-D1, 2026-09-17)
> **Date :** 2026-09-17
> **Statut :** **mécanisme livré** (`fa524f3` proxy + gardes ; `afffe29` Mapbox). Reste l'activation opérationnelle (poser `MAPBOX_ACCESS_TOKEN`) et RT-D2/D-ROUTE-3.
> **Plan parent :** `docs/nature-way/intra-skill-plan-NW-PROD-OMNI-ROUTE-01.md` (diagnostic)

## Découvertes qui changent le plan

1. **Le routage réel existait déjà et a été orpheliné.** `src/routes/fiche.$id.tsx` et
   `src/components/omni/CartePage.tsx` appelaient OSRM avec `overview=full&steps=true`
   (turn-by-turn) et affichaient la géométrie via `routeCoords`. Ces fichiers sont du
   **code mort** : `src/main.tsx` ne monte que `TrunkAppV13`. **Le tracé en ligne droite
   est donc une régression de la reconstruction du tronc**, pas un manque initial.
2. **Une réécriture catch-all existe** (`/api/v2/:path*` → `api/v2/availability`) et le
   handler route sur le pathname réel. **Preuve prod :** `/api/v2/buyer/pro-status`
   (non épinglé) répond 401 `AUTH_REQUIRED`, pas un 404 Vercel. Donc **un endpoint de
   routage n'exige aucune 13e fonction Vercel** — le plafond Hobby ne bloque pas.
3. **Écart ligne droite ↔ route mesuré sur 5 trajets réels de Lomé** : rapport
   **1,12× à 1,38×** (moyenne **1,28×**). La valeur actuelle sous-estime donc de
   **+12 % à +38 %**.

## Contrainte bloquante restante

Le serveur de démonstration OSRM (FOSSGIS) **restreint l'usage aux cas raisonnables non
commerciaux et à ≤ 1 req/s**. Une app commerciale ne peut pas s'y appuyer. **Aucune clé
de fournisseur de routage n'est configurée** (aucune variable `OSRM_URL`/clé de routage
présente). Je ne peux pas créer de compte ni engager de dépense sans le fondateur.

**Conséquence :** j'implémente le **mécanisme** (contrat serveur, proxy, garde de zone,
repli honnête, tests) et je le laisse **inactif tant qu'aucun `OSRM_BASE_URL` n'est
fourni**. Le jour où le fondateur fournit un OSRM auto-hébergé ou un fournisseur
compatible, l'itinéraire devient réel **sans nouvelle tranche**.

## Ce que je corrige maintenant (entièrement dans mon périmètre)

| # | Correctif | Pourquoi c'est un vrai défaut, pas une préférence |
|---|---|---|
| RT-F1 | Endpoint `GET /api/v2/public/routing` : proxy serveur, jamais d'URL/clé dans le bundle | Un appel navigateur direct à un service tiers expose l'usage et ne peut pas être limité/caché |
| RT-F2 | Fournisseur configurable par `OSRM_BASE_URL` (OSRM auto-hébergé ou compatible) | Rend le correctif actionnable sans redéploiement de code |
| RT-F3 | **Refus hors zone pilote** avec message honnête | 17 facilités sont au Ghana (lng < 0) : router vers elles produit un résultat absurde |
| RT-F4 | Repli ligne droite **étiqueté** (`tracé direct`) + distance/durée réelles quand disponibles | Aucune régression ; honnêteté préservée si le fournisseur est absent |
| RT-F5 | Garde de périmètre à l'import public | Empêche la dette de se reformer à la source |
| RT-F6 | Timeout + cache court côté serveur | Coût/latence maîtrisés, pas de double facturation du même trajet |

## Task tree

| ID | Parent | Couche | Livrable | Dépend de | Owner | Statut |
|---|---|---|---|---|---|---|
| RT-F1 | — | Root/server | Route `GET /api/v2/public/routing` (proxy) | — | Nature Way | `done` |
| RT-F2 | RT-F1 | Root/server | `routing-adapter.ts` — Mapbox **et** OSRM, sélection par env | — | Nature Way | `done` |
| RT-F3 | RT-F2 | Root/server | Garde de zone pilote (bbox Lomé) + message | RT-F2 | Nature Way | `done` |
| RT-F4 | RT-F1 | Trunk/client | `TrunkMap` consomme le vrai tracé, repli étiqueté | RT-F1 | Nature Way | `done` |
| RT-F5 | — | Root/data | Garde de périmètre à l'import public | — | Nature Way | `done` |
| RT-F6 | RT-F2 | Heartwood | Timeout + cache + tests négatifs | RT-F2 | Nature Way | `done` |
| RT-F7 | RT-F1 | Proof | Tests + `tsc` + build + parité bundle prod | tous | Nature Way | `done` |
| RT-D1 | — | Décision | Fournisseur de routage + budget | fondateur | Founder | `done` — **Mapbox** (2026-09-17) |
| RT-D2 | — | Décision | Sort des 17 facilités hors zone (masquer/marquer/supprimer) | fondateur | Founder | `blocked` |

## Suite RT (2026-09-24) — état réel

| ID | Livrable | Statut |
|---|---|---|
| RT-1 | Verrou d'itinéraire = `pi.state='active'` seul (plus de jeton QR) | `done` `3cbd9e2` **déployé** |
| RT-2 | Jeton Mapbox dans Vercel | `done` — routage **armé** (401 anonyme) |
| RT-3 | `ROUTING_REQUIRE_INTENT=1` | **variable posée par le fondateur — EFFET NON VÉRIFIÉ** (appel anonyme non discriminant) |
| RT-4 | Guidage vocal (`speechSynthesis`) + essai Android réel | `todo` |
| RT-5 | Alerte budget Mapbox + `057` | **`057` DÉJÀ appliquée** (vérifié) ; quota prouvé actif ; **alerte budget = action fondateur** |
| RT-6 | Maquette itinéraire verrouillé + guidage vocal | **maquette alignée** (`tracé direct` supprimé) ; voix = `todo` |
| RT-D2(b) | Fiche facilité : itinéraire désactivé jusqu'à l'intention | `done` `99da952` **déployé** |


## Condition d'arrêt

S'arrêter si : le repli étiqueté n'est plus honnête, si la garde de zone masque
silencieusement de la donnée existante, ou si un appel fournisseur part depuis le
navigateur. **Le trajet authentifié (intention → QR → paiement) reste hors périmètre.**

## Ce que je ne prétends pas

- Je ne prétends pas livrer un itinéraire « aussi parfait que Google Maps » : le trafic
  temps réel, le reroutage dynamique et la qualité de géocodage ne sont pas fournis par
  l'open data.
- ~~Je ne prétends pas que le fournisseur par défaut fonctionne en production : il est
  **non configuré**~~ **PÉRIMÉ (2026-09-24) : le jeton Mapbox est posé et le routage est
  ARMÉ — `GET /api/v2/public/routing` anonyme répond `401 AUTH_REQUIRED`, la signature
  exacte prédite par le test du dépôt quand le fournisseur est configuré.**
- Je ne prétends pas que les 17 points hors zone soient résolus : je les **refuse au
  routage** et j'ajoute la garde d'import, mais leur sort définitif est une décision
  produit (RT-D2).
- **Je ne prétends pas que `RT-3` soit effectif** : la variable est **posée** dans Vercel,
  mais l'appel **anonyme ne discrimine pas** les modes `identity` et `intent` (401 dans
  les deux). Le vérifier exige un appel **authentifié**. **Ne pas confondre « variable
  posée » et « variable lue ».**
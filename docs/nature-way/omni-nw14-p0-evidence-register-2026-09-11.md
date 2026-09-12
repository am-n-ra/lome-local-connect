# Production Evidence Register — NW-14 P0 « Redresser la recherche »

> **Target maturity:** M-01 pilot-ready V1 (canopy/launch-readiness)
> **Decision:** `Go with limits` — **verdict fondateur FORMEL émis 2026-09-11** → Gate 6 Canopy/launch-readiness CLOSED
> **As of:** 2026-09-11
> **Release owner:** Nature Way (route `/nature-way`), arbitre fondateur

| Acceptance / control | Method or scenario | Environment and data basis | Result / evidence link | Evidence class | Residual gap / limit | Owner and review trigger |
|---|---|---|---|---|---|---|
| P0-A — fallback map surface | Câbler `createFallbackMap` utilisé: init/charge MapLibre échoue → surface MapLibre-compatible ( camera/markers/events( sur fallback DOM réel | `src/trunk/fallback-map-surface.ts` + `TrunkMap.tsx` catch; tsc/lint/build/boundary locaux | `952df28`; tsc clean; build vert; `fallback-map.test.ts` 17/17 | `reproduced` ( local, code+test ( | MapLibre → fallback = pas exercé en prod ( pas de scénario tuile indispo rejoué en prod ( | Nature Way / re-test après chaque changement de map |
| P0-B — cinématique recherche + countmark | Recherche survole monde→continent→pays→région→ville→cadrage ( déjà révélé sur fallback( ; **countmark** résultats visible | `TrunkMap` prop `resultCount` → `.countmark`; CSS maquette `ui-v13.css`; `TrunkAppV13` `results.length`; tsc + tests | `5cd175c`; suite 55f/347t; build vert; boundary clean | `reproduced` ( code + tests ( ; visuel non vérifié navigateur | Aucun navigateur réel ouvert ( pas de capture `.countmark` rendue ( | Nature Way / audit visuel navigateur avant verdict « Go » |
| P0-C — chips contraintes rayon | Portée 1/5/10/25/100 km / Monde câblées filtre serveur `rayon_km` via `chipsToSearchOptions`; rangée « Portée de recherche » buyer | `search-constraints.ts` `RAYON_SCOPES` + rangée `TrunkAppV13`; 8 tests unitaires | `5cd175c`; tsc vert; suite 347 | `reproduced` ( unitaire, code ( | « Monde » (null rayon( = intention non câblée côté serveur ( voir gap ( | Nature Way / mini tranche P0-C-2 ou `soon` selon fondateur |
| Authorization and privacy | Aucune route serveur modifiée; chips clientes n'exposent pas de données | Code diff local | Aucun changement auth/privacy | `observed` ( diff ( | — | — |
| Failure and recovery | Fallback map: erreur init/chargement → surface rend VRAIES facilités ( jamais écran mort | `TrunkMap` try/catch + `fallback-map.ts` | Code + tests 17/17 | `reproduced` ( local ( | Test navigateur réel non effectué | Nature Way / re-check avant verdict |
| Visual/logic coherence | `.countmark` aligné maquette ( top:118px left:34% pill coloré `#fff`+::after ( ; chips rayon = statut wired jamais soon | `ui-v13.css` + `search-constraints` status | Code + CSS + tests | `observed` ( diff local ( | Pas de capture navigateur | Nature Way / spot-check humain |

## History and rationalité

- **P0-A `952df28`** ( amendé de `bf0c345` ( : surface fallback + switch TrunkMap. Backoff des backticks dans le message ( coquille( → amend.
- **P0-B/C `5cd175c`** : `resultCount` + `.countmark` ( maquette( ; `RAYON_SCOPES` 1/5/10/25/100/Monde + rangée buyer + helpers + `chipStatusFor` wired. Suite monte à **347/347** ( de 344 ( ( +3 rayon + mount`countmark`.
- **Guardrail T-07d** ( prod hash === build local ( : **vérifié le 2026-09-11** — prod `https://omni.sparkafrika.online/` sert `index-CMHAUJH7.js` = bundle déjà live au dernier push prod ( NW-13a/b `87085ef`( ; build local P0 = `index-D5-dLEH6.js` ( ≠ prod, **intentionnellement non poussé** (pousse prod = ordre fondateur explicite, guardrail T-07d(. Au moment du push prod commandé par fondateur, le CI Vercel/le fondateur devra vérifier `index-D5-dLEH6.js` servit === build local.

## Exposure plan

Audience: fondateur ( verdict Gate 6 ( + pionnier Lomé. Rollout: branch `omni-v2-rebuild` uniquement; pousse prod = ordre fondateur (guardrail T-07d(. Guardrail: ne jamais merger vers `main`. Rollback: revert commit + rebuild. Guardred limits assumés: P0-C « Monde » = no-op serveur; `.countmark` non capturé navigateur.

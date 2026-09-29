# Claim par référence OSM — contrat Root (tranche : matérialisation au claim)

> **Décisions :** DEC-V2-27 (pivot lazy) · DEC-V2-30 (doctrine confirmée).
> **Porte :** Root System (contrat de données + chemin d'écriture), puis Trunk (UI).
> **Non-objectifs de cette tranche :** UI (sheet tuile → voir §6), géocodeur live côté serveur,
> recherche hors corpus.

## 1. Problème

`createClaimDraft` exige un `facilityId` existant (`trunk-repository.ts:1522`, route
`POST /api/v2/facilities/:uuid?action=claim`, `http.ts:828`). Un lieu connu UNIQUEMENT des
tuiles (jamais importé) n'a pas de ligne → pas de claim possible. Or la doctrine lazy dit :
le claim EST le moment de la matérialisation. Il manque le chaînon : **référence OSM →
ligne → draft, en un geste atomique**.

## 2. Contrat d'entrée (validation serveur stricte, pas de confiance client)

`POST /api/v2/facilities?action=claim-by-osm-ref` (chemin exact, sans conflit avec `:uuid`) :
- `osmType` ∈ {`node`, `way`, `relation`} (tout le reste : 400).
- `osmId` : entier ≥ 1, ≤ 2^53 (tout le reste : 400).
- `name` : 1–180 caractères après trim (vide : 400 — même règle que l'import).
- `latitude`/`longitude` : finis, dans les plages (même règle que l'import).
- `category`, `address` : optionnels, bornés comme l'import.
- Auth requise (401 comme le claim existant).
- `sourceRef` dérivé serveur : `${osmType}/${osmId}` — JAMAIS accepté du client (sinon deux
  clients écriraient des clés différentes pour le même lieu).

## 3. Sémantique serveur (un statement gardé, miroir du chemin existant)

`createClaimDraftFromOsmRef(input)` :
1. **Résolution** : chercher `(source openstreetmap, sourceRef)` dans `v2_facility_source_refs`
   → si trouvé, continuer EXACTEMENT comme `createClaimDraft` sur ce facility (mêmes gardes :
   `account_id null`, `trust_state` claimable, idempotence du draft, marquage
   `verification_draft` à la création).
2. **Matérialisation** (si absent) : INSERT `v2_facilities` (`account_id null`,
   `source_kind='public_import'`, `trust_state='unclaimed'`) + ligne `source_refs`
   (provenance : provider openstreetmap + `raw_metadata` portant `intake_tier` calculé par
   `classifyIntakePoint` + `origin: 'claim-on-sight'`), PUIS même chaîne draft.
3. **Pas d'appel OSM serveur** : ni Nominatim ni Overpass (dépendance externe, latence,
   rate-limits). La donnée client est bornée-validée ; la VRAIE vérification reste S-18
   (preuve + arbitrage opérateur avant transfert). Le lookup tuile→OSM du client est du
   confort UX, pas de la confiance.
4. **Idempotence** : rejouer la même référence rend le même draft (même contrat que
   `createClaimDraft` : `existing` avant `inserted`, conflit sans écrasement).

## 4. Ce qui ne change pas

- `createClaimDraft` existant : intact (aucun refactor — duplication assumée et documentée
  plutôt que risque de régression sur le chemin prouvé).
- S-18, S-30/S-31, paliers de confiance, seuils S-14 : inchangés.
- Tiers : la ligne matérialisée porte son tier (cohérence POP-1) ; n'accorde aucun droit.
- Pas de migration (colonnes existantes suffisent).

## 5. Preuve exigée (falsifiée)

- Repo : sourceRef dérivé (pas client) ; claim sur lieu déjà importé = même résultat que
  `createClaimDraft` ; claim sur lieu absent = création + draft en un appel ; replay idempotent ;
  refus sur lieu déjà revendiqué ; refus sur entrées invalides (type/id/nom/coords).
- Neutraliser la dérivation serveur (accepter `sourceRef` client) → test rouge.
- Suite + tsc + gardes verts. Pas de preuve navigateur (sandbox) — résidu assumé.

## 6. UI (hors tranche, nommée pour ne pas l'oublier)

La sheet du pin tuile appelle la route avec `{osmType, osmId, name, category, lat, lng, address}`
résolus côté client (tap → `queryRenderedFeatures` + reverse Nominatim user-triggered OU Overpass
around — à trancher à la tranche UI). Tranche Trunk suivante, avec maquette du parcours claim.

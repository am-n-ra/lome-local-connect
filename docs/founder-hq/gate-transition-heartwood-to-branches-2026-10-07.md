# Gate transition — Heartwood CLOSE → Branches OPEN (2026-10-07)

> **Décision fondateur (verbatim) :** *« clos and next »* — la porte **Heartwood** ferme,
> la porte suivante **Branches** ouvre. Même règle que Root/Trunk : *livrer ne clôt pas ;
> seule une décision fondateur enregistrée clôt.*

## 1. Ce qui est clos — Heartwood `founder-confirmed` 2026-10-07

Périmètre = **durcissement/fermeture du tronc**, **pas de nouvelles fondations**. Tout est livré,
poussé et prod-vérifié (T-07d) :

| Slice | Objet | Statut |
|---|---|---|
| `S1` / `S1b` | QR acheteur réel (scannable) + QR public d'entité (S-21, option a) | `verified` (décodage `jsqr` 3/3) |
| `S3-a` | Téléphone Togo **déclaré** (jamais « vérifié ») + `wa.me` gratuit (migration `069`) | `verified` (Postgres réel 6/6) |
| `S4` | Ambulants découvrables (`facilityType`/`rayonKm` exposés, chip `Transport`) | `verified` (SQL réel 33/33) |
| `S2` | Argent réel E2E | **re-classé `candidate`** — FedaPay déjà prouvé par le passé |
| `S5` | OSM borné Togo | **décision close** — pas un écart |
| `MAP-1` / `MAP-2` | Pins carte : plafond par fenêtre 2 000 ; carte branchée sur la découverte | `verified` |
| `DOCK-DUP` | Jumeaux `.navpill` (clé React fuyante) | `verified` (A/B navigateur) |
| `HP-1` | Flood transform MapLibre soigné/coupé | `verified` (A/B prod FAIL → local PASS) |
| `HP-2` | Frontière d'erreur React (plus de page blanche) | `verified` (A/B navigateur) |
| `HP-3` | Délai de requête (réseau qui ne répond jamais) | `verified` + prod |
| `HP-4` | 5 surfaces d'API client sans UI (3 retirées, 2 câblées) | `verified` + prod |
| `HP-5` | Garde `check:dock-search` réconcilié (2 règles périmées) | `verified` |

**Preuves de clôture :** **1004/1004** tests · `tsc` 0 · **9/9 gardes verts** (`state`/`docs`/
`coherence`/`live-surface`/`boundary`/`dead-css`/`maquette`/`dock-search`/`species-t12`) ·
prod `index-DLYeXIbP.js` === local (T-07d ✅, entrée GitHub `6141213`).
Paquet de preuves : `docs/founder-hq/heartwood-close-dossier-2026-10-07.md`.

**Réserves actées (suivies hors Heartwood, ne bloquent pas la clôture) :**
- `S2` — re-prouver le parcours d'argent réel FedaPay **en session fondateur** (geste optionnel) ;
- preuve navigateur des formulaires **authentifiés** (session réelle requise — sandbox sans DB/auth) ;
- données `mobile` = 0 (acte vendeur, pas un manque de code) ;
- décisions ouvertes : `UM-6`, `D-LOC-6/8`, `D-C5`, `RT-4`, `H1–H4`.

**Ne rouvrir Heartwood que sur fait nouveau** (régression prouvée ou décision fondateur).

## 2. Ce qui s'ouvre — Branches `OPEN` 2026-10-07

**Phase 5 Nature Way — une fonctionnalité à la fois.** Chaque branche exécute le **cycle imbriqué
complet** (skill `nature-way` §Phase 5) :

1. sélectionner **une** fonctionnalité et confirmer ses dépendances + porte parente ;
2. mini-seed + mini-species (hériter ou définir le blueprint) ;
3. contrat données/API/permission/acceptation ;
4. UI + backend **ensemble**, intégrés à l'état du tronc ;
5. validation, permissions, états async, recovery, analytics, propriété opérationnelle ;
6. preuve : unitaire, intégration, navigateur, largeurs, négatif ;
7. mise à jour du plan/backlog/preuve ; clore/scinder/différer/rouvrir selon la preuve ;
8. **la branche suivante ne démarre qu'après vérification** de la courante.

**Règle de fer :** *aucune API sans UI atteignable, aucune UI sans opération réelle*
(`no orphaned layers`). Si une frontière manuelle/backend est inévitable → la nommer
`manual` / `partial` / `blocked` **avec son propriétaire**.

### Candidats mesurés (à confirmer/ordonner par le fondateur)

| Famille | Candidat | Rattachement Seed | Nature |
|---|---|---|---|
| Décision ouverte | `UM-6` — montant du bonus (20 $ ≈ 10 000 F vs 2 000 F) | D-H | **argent promis** — tranchable par fondateur |
| Décision ouverte | `D-LOC-6` — unité monétaire canonique (×100 vs brut) | D-LOC | architecture monétaire |
| Décision ouverte | `D-LOC-8` — convertir ou montrer l'origine | D-LOC | rendu devise |
| Décision ouverte | `D-C5` — bulk = 1 besoin (vs `ceil(N/100)` fournisseurs) | D-G | facturation bulk |
| Décision ouverte | `RT-4` — guidage vocal itinéraire + essai Android réel | S-15 | itinéraire |
| Résidu de slice | `MENU-01` — destinations vendeur restantes (boutons morts si affichés) | — | UI honnête |
| Résidu de slice | analytics par-produit / par-marché | Pro | capacité |
| Capacité Seed | recommandations (Buyer Pro) | D-K | capacité |
| Capacité Seed | publicité IA (au-delà du manuel livré) | NW-13j | capacité |

**Prochaine action :** HQ présente cette liste **ordonnée** au fondateur pour sélection de la
**première branche**. Aucune branche ne démarre avant ce choix (H1). **Terrain toujours EN DERNIER**
(décision fondateur 2026-10-07 : le terrain vient après clôture de **toutes** les portes Nature Way).

## 3. Ce qui n'est PAS ouvert

- **Canopy** (polish/qualité) et **Ring** (release) : **non ouverts**.
- Tracks capital/opportunité (YC W27, HERLOG) : `watch` / `user invocation required`.
- **Terrain** (`TT-1`/`TT-2`/Gate 7 Venture Lifecycle) : **EN DERNIER**.

## 4. Décision demandée

**Quelle branche démarre en premier ?** HQ propose l'ordre (décisions ouvertes d'abord — elles
débloquent des capacités déjà construites ; puis résidus de slices ; puis capacités Seed neuves),
mais la **sélection est fondateur**. Si le fondateur veut d'abord trancher `UM-6` (argent promis à
un vendeur), c'est le candidat le plus mûr.

> **Note de méthode :** ce document est un **dossier de transition**, pas une auto-clôture. Le
> verdict Heartwood CLOSE est **enregistré** dans `current-state.md` §Verdict Heartwood (décision
> fondateur verbatim) ; `check:state` exige désormais que `current-state.md`, la board, le master
> plan et `AGENTS.md` portent **Heartwood CLOSE** + **Branches OPEN** et ne présentent plus
> Heartwood comme la porte ouverte.

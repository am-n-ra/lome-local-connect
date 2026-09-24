# Omni — Scout des incohérences (2026-09-23)

> Protocole Nature Way : **aucun code**. Ce document enregistre des constats **code-vérifiés**
> et propose un backlog Root ordonné + les décisions fondateur nécessaires.
> Déclencheur : fondateur — « pourquoi on se retrouve contraint à 206 et OSRM au lieu d'avoir
> déjà la couverture de base mondiale de lieux ? … peut-être y a-t-il d'autres incohérences du genre ».

---

## 1. Question fondateur : la couverture de base mondiale des lieux

### Réponse : **la capacité existe, elle a été orphelinée par la reconstruction.**

Ce n'est pas un manque de conception. C'est le **même patron** que l'itinéraire OSRM
(§ ITINÉRAIRE, AGENTS.md : `CartePage.tsx` appelait OSRM, puis est devenu du code mort).

**Preuve 1 — la lecture accepte DÉJÀ le monde entier.**
`src/server/trunk-repository.ts` → `listPublicFacilities(bounds?, …)` :
```
const [west, south, east, north] = bounds ?? [-180, -90, 180, 90];
```
Sans bbox fourni, la requête couvre **le monde**. Le Trunk appelle bien avec un bbox
(`TrunkAppV13.tsx:285/416` → `listPublicFacilities(bbox)`). Donc **le verrou n'est pas la lecture**.

**Preuve 2 — l'intention fondateur est écrite noir sur blanc.**
`docs/omni-platform-product-ux-prd.md:83` :
> « Resting facility discovery is requested by the visible map bbox, not by a fixed `TG-LOME`
> filter. When a local bbox has no rows, a **bounded cached OSM/Overpass back-fill** may add
> deduplicated `unclaimed` facilities, including Aflao and areas assigned to the **`GLOBAL`
> market context**. At low zoom the map shows clusters; zooming expands them into individual
> source-backed facilities. »

**Preuve 3 — le code de cette couverture est écrit, testé… et jamais importé.**
| Artefact | Rôle | État |
|---|---|---|
| `src/lib/public-discovery.ts` | `discoverFromOverpass`, `discoverInBounds` | importé **uniquement** par du code mort |
| `src/lib/osm-coverage.server.ts` | `ensureCoverage`, logique `TG-LOME` vs `GLOBAL` (l.24/32-33) | importé **seulement** par `omni.functions.ts` |
| `src/lib/public-discovery.test.ts` | tests de découverte | vivant (test) |
| `scripts/import-osm.ts` | import OSM (Overpass, bbox Lomé) | script manuel, **non branché** (absent de `package.json`) |
| `src/components/v2/MaquetteApp.tsx`, `V2Shell.tsx` | la coquille V2 React | **orphelins** |

**Preuve 4 — le maillon mort.**
`src/main.tsx` ne monte **que** `TrunkAppV13`. Et `omni.functions.ts` n'est importé
**que** par `src/components/omni/*` — l'arbre mort (avec `CartePage.tsx`/`fiche.$id.tsx`).

```
main.tsx → TrunkAppV13 → /api/v2/public/facilities (bbox) → listPublicFacilities
                                                              ↑ monde entier possible
   ✗ omni.functions.ts → osm-coverage.server.ts (GLOBAL/TG-LOME)
     ↑ jamais atteint : seuls des composants morts l'importent
```

### Conséquence
- Aucun **back-fill OSM** au niveau mondial : la carte n'affiche que ce que la base contient.
- Les **206 facilités** = le seed/import explicite, pas la couverture de base.
- Le **market context `GLOBAL`** (Aflao, hors zone) n'est jamais attribué automatiquement.
- Le clic « pin vide → rien » : là où OSM a des lieux, Omni n'en montre aucun.

### Décision requise
**D-COV-1** — La couverture de base mondiale des lieux (OSM, `unclaimed`, dedup) est-elle
**réactivée comme source de premier niveau** ?
(a) back-fill OSM borné sur bbox vide, cache, dedup *(conforme PRD l.83 — recommandé)*
(b) import batch mondial en base (coût de stockage, fraîcheur)
(c) ne pas réactiver (assumer une supply uniquement déclarative)

**D-COV-2** — Le **rattachement entité** (D-2a) est-il un prérequis du back-fill, ou le
back-fill crée-t-il des lieux `unclaimed` **avant** toute entité (réponse 206/OSRM : oui) ?

---

## 2. Scout systématique — modules orphelins

Méthode : pour chaque fichier `src/**` non-test, compter les importeurs hors lui-même.

**30 modules orphelins.** Hors `src/components/ui/*` (bibliothèque shadcn, présence normale),
les orphelins **produit** sont :

| Groupe | Fichiers | Nature | Verdict |
|---|---|---|---|
| **Découverte/couverture** | `public-discovery.ts`, `osm-coverage.server.ts`, `availability.server.ts`, `search-index.server.ts`, `location.functions.ts` | couverture, recherche, dispo | **régression** (§1) |
| **Coquille V2 React** | `components/v2/MaquetteApp.tsx`, `V2Shell.tsx` | la maquette V2 côté React | **doublon** avec `TrunkAppV13` |
| **Réputation/identité** | `reviews.functions.ts`, `identity.functions.ts` | avis, identité | **régression probable** |
| **Surfaces legacy** | `components/ui/BuyerSheet`, `SellerWorkspaceSheet`, `CleanMenuDrawer`, `LiquidPreviewShowcase`, `components/omni/vendor/AdsPanel`, `Omni/OverlayHost` | anciennes surfaces | dette (à archiver) |
| **Supabase** | `integrations/supabase/*` | legacy | **par design** (hors v2) |
| **Shims build** | `server/vercel/*` | entrée des bundles | probablement normal |

**Classe de défaut :** la reconstruction a **recréé l'UI (`TrunkAppV13`) sans rebrancher la
couche de données/couverture** — exactement le patron `CartePage.tsx`/OSRM déjà rencontré.

---

## 3. Incohérences du même genre déjà identifiées

| ID | Constat | Gravité | Statut |
|---|---|---|---|
| SCOUT-01 | Couverture mondiale OSM orpheline (§1) | **Haute** | décision D-COV-1 |
| SCOUT-02 | `v2_purchase_intents.state` non lu par l'UI → impasse d'expiration | **Haute** | décision D-EXP (précédent tour) |
| SCOUT-03 | Aucune notification d'expiration | Moyenne | D-EXP-2 |
| SCOUT-04 | Réservations jamais reconstruites après un redémarrage de sweep (batch trop espacé) | Moyenne | `watch` |
| SCOUT-05 | 17 facilités à longitude négative (Ghana), sans adresse, hors zone | Moyenne | RT-D2 (hors autorité OpenHands) |
| SCOUT-06 | 2,9 % des facilités ont une adresse (6/206) → géocodage/routage dégradé | Moyenne | dette de données |
| SCOUT-07 | `src/routes/*` + `src/components/omni/*` = arbre mort (déjà connu TEC-1) | Moyenne | V-9 (nettoyage, non fait) |
| SCOUT-08 | 6 tests placeholder sans composant (fausse couverture, TEC-1) | Faible | V-9 |
| SCOUT-09 | Contrat transactionnel montré dans la maquette vs réel (§ timer/étape) | Faible | clos (audit visuel) |

---

## 4. Backlog Root proposé — ordre de dépendance

> Principe Nature Way : **corriger la racine avant d'ajouter des feuilles.**
> Ces tranches **ne démarrent pas** sans décision fondateur explicite.

| # | Tranche | Dépend de | Contenu | Pourquoi maintenant |
|---|---|---|---|---|
| **R1** | **Scout complet & registre** | — | ce document + registre + SDM à jour | *fait ce tour* |
| **R2** | **Décisions fondateur** | R1 | D-COV-1/2, D-EXP-1…4, D-2a entité | impossible d'implémenter sans |
| **R3** | **Couverture de lieux** | R2 (D-COV-1) | rebrancher OSM back-fill borné + dedup `unclaimed` + market GLOBAL | débloque distance-first, l'univers complet |
| **R4** | **Root entité** (D-2a) | R2, R3 | lieu ≠ entité ; offre appartient à l'ENTITÉ ; migration additive ; 206 préservés | la racine fausse |
| **R5** | **Contrat d'offre visuel+avantage** | R4 | offres illimitées, visuel obligatoire, avantage Omni ≠ 0 | monétisation D-1 |
| **R6** | **Cycle d'expiration honnête** | R2 (D-EXP) | « En cours » actionnable ; section Expirées + Relancer ; notif ; délais par étape | UX transaction |
| **R7** | **Nettoyage V-9** | R4 | supprimer arbre mort (`routes/`, `components/omni/`, `v2/`), tests placeholder | lisibilité, anti-régression |

**R3 et R4 sont la racine.** R5 monétise. R6 corrige une impasse. R7 assainit.

---

## 5. Ce que ce scout change dans le plan

- **Gate actuel reste Species/Seed re-ouverte** (`HQ-OMNI-2026-09-02`) — conforme au protocole.
- **Ajout** : le manque de couverture mondiale est une **décision de racine**, pas un bug mineur.
  Il conditionne la phrase fondateur : *« Omni = index vivant complet de toutes les offres »* —
  sans couverture de lieux, l'index n'est **ni vivant ni complet**.
- **Constat de méthode** : la reconstruction a laissé **deux fois** une couche orpheline
  (OSRM, puis couverture OSM). Un **contrôle anti-orphelin** en CI (SCOUT-07/R7) est recommandé.

---

## 6. Prochaine étape

1. Fondateur tranche **D-COV-1/D-COV-2** (§1) et confirme l'ordre **R3 → R4**.
2. Puis contrat technique de la couverture (source, bornes, cache, dedup, attribution OSM).
3. Aucun code avant le contrat (maquette avant pixels, contrat avant code).

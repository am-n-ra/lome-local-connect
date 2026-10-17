# GR-1 + GR-2 — le guide et la reprise : deux défauts réels mesurés (2026-10-17)

Plan local : `intra-skill-plan-NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01.md` (porte `HEARTWOOD_CLOSED_BRANCHES_OPEN`).
Owner : relais (exécution) · Autorité : Nature Way (Branches = durcissement) · Fondateur : décisions `GR-3`/`GUIDE-SPEC`.

## `GR-1` — le guide ne s'arrête plus au dock : **déjà corrigé, maintenant PROUVÉ à l'étape qui échouait**

**Constat de méthode d'abord.** Le plan portait `GR-1` en `ready` (« le spotlight s'arrête au dock »). Mesure
faite : **le correctif était déjà livré** par `GUIDE-1c` (`091104e`) — `placeSpotlightCard` + clamp à la
fenêtre, et un test unitaire couvrait déjà le cas dock. Le `ready` était **périmé**.

**Pourquoi il avait survécu au plan** : le seul harnais navigateur existant (`scripts/prove-guide-1b.mjs`)
clique **« Passer »** — il ferme le guide **sans jamais atteindre la 3ᵉ étape**. Il vérifiait donc les étapes
1 et 2 (haut de l'écran) et **jamais le dock**. *Un test qui n'atteint pas le cas mesuré ne le prouve pas.*

**Livré** : `scripts/prove-gr1-spotlight-dock.mjs` — avance réellement `Suivant` → `Suivant`, mesure la
géométrie de la bulle **à chaque étape**, sur `390×844` et `390×667`.

| Mesure | Résultat |
|---|---|
| Bulle étape 3/3 (dock) | `placement=above`, **entièrement dans la fenêtre** (`top=635 bottom=762` sur 844 ; `top=458 bottom=585` sur 667) |
| Étapes 1 et 2 | `placement=below`, entièrement visibles |
| Erreurs console | **0** |
| **Total** | **14 ok / 0 fail** |

**Falsification (décisive)** : en restaurant le défaut d'origine — bulle **sous** l'anneau **et non clampée** —
le harnais reproduit **exactement** la mesure du 2026-10-15 : `top=840 bottom=968 h=128 win=844 visible=4`
→ **4 px visibles sur 128**, sur les deux hauteurs. `GR-1` est donc **réellement fermé** et **falsifiable**.

## `GR-2` — la reprise : la feuille résultats se rouvrait VIDE (volet RECHERCHE livré)

**Défaut réel mesuré** (`scripts/probe-gr2-resume.mjs`, session injectée car la recherche exige un compte, D-05) :

| Étape | Avant |
|---|---|
| Recherche `pain` | `nav = {sheet:"results"}` — **sans** la requête |
| **Rechargement** | feuille `results` **présente**, **0 carte**, texte « …0 … La découverte publique est temporairement indisponible » |

La recherche vivait **en mémoire** (`lastSearchRef`) et `nav-state` ne persistait que la **feuille**. Au retour,
la feuille se rouvrait donc sur un **« 0 résultat » qui n'en était pas un** — un mensonge silencieux.

**Correctif** : la recherche **voyage avec la surface** et est **REJOUÉE** au retour.

- `NavSurfaceState` porte `searchQuery` + `searchLevel` (S-11 : `offer` | `entity`) — **bornés** (200 car.,
  jamais vides, jamais interprétés) ; sérialisation **inchangée** quand il n'y a pas de recherche.
- **Garde de cohérence** : une feuille `results` **sans** requête n'est **pas restaurée** (`return null`) —
  mieux vaut repartir sur la carte qu'ouvrir une feuille vide.
- `TrunkAppV13` : `searchCommitted` (**état**, pas ref — sinon l'effet de persistance ne se rejoue pas quand on
  relance une recherche en restant sur `results`) alimente la persistance ; la restauration **rejoue** la
  recherche (offre **ou** entité selon le niveau).

**Preuve (la requête RÉSEAU, pas le nombre de cartes** — le preview local n'a pas d'API, les cartes valent 0
dans les deux cas) :

| | Requêtes `q=` après rechargement | Feuille |
|---|---|---|
| **Avant** (requête non persistée) | **0** | `none` — rien restauré |
| **Après** | **1** (`/v2/public/facilities?q=pain`) | `results` |

**Falsification** : en cessant de faire voyager la requête → **0 requête**, `sheet=none` → le harnais échoue.
Garde unitaire `nav-state.test.ts` **falsifiée** (retrait du garde `results` sans requête → **2 échecs**).

**Périmètre honnête — `GR-2` reste `partial`** : le volet **recherche** est livré ; la reprise du **guide**
(`how-it-works` n'est pas dans `RESTORABLE_SHEETS`) et d'un **flux en cours** (étape de transaction) restent
des tranches séparées, **non faites**.

## Bug d'outillage trouvé en chemin — un garde fragile

`search-reveal-steal.test.ts` lisait `runSearch` sur une **fenêtre de 400 caractères**. Ajouter une ligne
légitime dans `runSearch` (ici `setSearchCommitted`) a fait **échouer** le garde — non parce que le contrat
était violé, mais parce que la fenêtre était trop courte. **Réparé** : borné par le **vrai bloc**
(jusqu'à `handleRevealStateChange`). Re-falsifié : retirer `openedDuringRevealRef.current = false` → échec ;
restauré → passe. *Un garde qui casse sur un ajout légitime est un garde fragile, pas une preuve.*

## Preuves et gardes

- **1343/1343** tests (169 fichiers) · `tsc -b` **exit 0**.
- **7 gardes** verts : `check:live-surface`, `check:dead-css`, `check:docs`, `check:coherence`,
  `check:boundary`, `check:maquette`, `check:state`.
- Falsifications : `GR-1` (défaut d'origine → 4/128 px visibles), `GR-2` (requête non persistée → 0 requête),
  garde `nav-state` (→ 2 échecs), garde `search-reveal-steal` réparé (→ 1 échec).
- **Aucune migration.** Aucune donnée sensible ajoutée : la requête est du texte **public** tapé par
  l'utilisateur, borné à 200 caractères, stocké en `localStorage` (même classe que la feuille/l'id de lieu).

## Preuve PROD + `T-07d` (2026-10-17)

| Élément | Valeur |
|---|---|
| Commit | `5f13a55` (GR-1/GR-2) puis `054fc39` (harnais) |
| Déploiement GitHub | entrée `deployments` **`5f13a55` Production** (`2026-10-17T10:46:25Z`) |
| Hash prod | `index-CNy9ua4l.js` **=== build local** (byte-identique) → **`T-07d ✅`** |
| Bundle servi | `searchQuery` présent (2 occurrences) — le correctif est bien **dans l'artefact déployé**, pas seulement dans le source |
| **`probe-gr2-resume` sur PROD** | après rechargement : **1 requête `q=pain` rejouée**, `sheet=results` (**avant** : 0 requête, `sheet=none`) |
| **`prove-gr1-spotlight-dock` sur PROD** | **14 ok / 0 fail** (dock `placement=above`, `top=458 bottom=585` sur 667) |

**Piège de harnais attrapé sur prod** : l'attente était fixée à 2,5 s alors que la révélation
globe → rue prend ~8 s sur prod. Le harnais mesurait **avant** que la feuille s'ouvre et rapportait
un **faux négatif**. Corrigé en attendant le **vrai signal** (`section[data-sheet="results"]`).
*Un délai fixe est une hypothèse sur la machine, pas une preuve sur le produit.*

## GR-2 (suite) — la Room d'une transaction survit au rechargement (2026-10-17, `ed34472`)

**Défaut mesuré** : `room` n'était **pas** dans `RESTORABLE_SHEETS` → `sanitizeNavSheet('room') === 'none'`,
donc recharger au milieu d'une transaction retombait sur la **carte nue** : l'utilisateur perdait le fil
de son achat (même classe que `GR-2` recherche, une surface de plus).

**Livré**
- `nav-state` : `roomTransactionId` porté par la surface, gardé par `sheet === 'room'` **des deux côtés**
  (sérialisation ET relecture) ; une Room **sans** transaction n'est **jamais** restaurée (pas de Room vide) ;
  `room` ajouté aux feuilles restaurables.
- `TrunkAppV13` : persistance de la transaction avec la surface ; au montage, la Room se rouvre par
  `resumeTransaction`, qui **RELIT le rôle côté serveur** (`getTransaction` → `actorRole`) au lieu de le
  supposer — un vendeur reprend sa vente, il n'est plus supposé acheteur.
- **Même classe que AUTH-RESUME** : `openRoom`/`resumeTransaction` passaient `requireAuth({kind:'home'})` —
  un rechargement à froid **sans session prête** renvoyait sur l'accueil et **perdait la transaction**.
  La cible de reprise est désormais la **Room** ; le tap d'une notification de transaction passe aussi par
  `resumeTransaction` (rôle relu, plus de vendeur supposé acheteur).

**Gardes falsifiables** (chaque falsification produit un échec réel, puis restaurée) :

| Falsification | Résultat |
|---|---|
| Retirer `room` des feuilles restaurables | `nav-state.test.ts` → **2 échecs** |
| Retirer la garde « Room sans transaction » | `nav-state.test.ts` → **1 échec** |
| Retirer `resumeTransaction` de la restauration | `room-resume.test.ts` → **1 échec** |
| Remettre `kind:'home'` dans `openRoom` | `room-resume.test.ts` → **1 échec** |

**Preuve navigateur `probe-gr2-room-resume.mjs` — A/B décisif** (le preview local n'a pas d'API : la lecture
du snapshot est interceptée avec l'enveloppe réelle `{ ok, data }`) :

| État | Trace de surface | Lectures serveur |
|---|---|---|
| **Avant** (`room` hors restaurables) | `none` | **0** |
| **Après** | `none → room` | **2** |

**Preuve PROD + `T-07d`** : commit `ed34472` · déploiement GitHub **`ed34472` Production**
(`2026-10-17T11:21:03Z`) · prod `index-DAxwCCDN.js` **=== build local** (byte-identique) → **`T-07d ✅`** ·
`probe:gr2-room-resume` **sur PROD → 4 ok / 0 fail** (`trace=none→room`, 2 lectures, 0 erreur console).

**1353/1353** tests (170 fichiers) · `tsc -b` exit 0 · **7 gardes** verts. **Aucune migration.**

**Reste ouvert**
- `GR-2` suite : reprise du **flux en cours** (étape de disponibilité) puis du **guide** (tranches séparées).
- `GR-3` (**décision fondateur** : « accueil à chaque connexion » contredit « une seule fois »).
- `NT-1` (documenter la manifestation de la notification — déjà répondu : son du système OS).
- `GUIDE-SPEC` (**bloqué** — décision A/B/C : la maquette, 74 écrans, n'a **aucune** surface de guide).
- **Terrain (`TT-1`/`TT-2`/Gate 7) EN DERNIER** (décision fondateur 2026-10-07).

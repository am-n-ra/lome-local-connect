# Rapport MCP — POP-1b preuve monde : dry-run jetable + canonique + prod (2026-09-28)

> **Session :** MCP (Neon + GitHub deployments). **Handoff :** `docs/founder-hq/mcp-handoff-2026-09-28-pop1b-world-dryrun.md`.
> **Branche :** `omni-v2-rebuild` — HEAD au départ **`890e9e9`** (`git pull`, attendu ≥ `890e9e9` ✅).
> **Porte lue :** `SPECIES_CLOSED_ROOT_OPEN` (jamais inférée). **Aucun secret. Aucun redeploy. Aucune variable.**
> **Canonique identifiée par ses DONNÉES :** `br-dawn-hill-am5amy22` = **206 facilités** (la branche
> nommée « production » en a 4 — piège re-confirmé).

---

## 1. P1 — Re-vérification hash prod du push POP-1b (T-07d)

| Contrôle | Résultat |
|---|---|
| Entrée `deployments` pour `890e9e9` ? | **OUI** — déploiement Production `6707166629`, 2026-09-28T09:56:49Z |
| Hash client prod | `index-BGUSIwRj.js` + `index-CBsJf68R.css` |
| Hash build local | `index-BGUSIwRj.js` + `index-CBsJf68R.css` → **prod === local** |

**Pourquoi le hash client est INCHANGÉ et pourquoi c'est NORMAL (et non un échec) :** POP-1a/POP-1b
modifient le **serveur** (`src/server/http.ts`, `src/domain/place-intake.ts`). Aucun fichier client
n'importe `place-intake` (vérifié : `grep -rl place-intake src/trunk src/main.tsx` → vide). Le bundle
client est donc **byte-identique** — la leçon documentée « hash inchangé = normal si changement
serveur » s'applique. La preuve-de-vie serveur a donc été faite **autrement** :

| Preuve serveur | Résultat |
|---|---|
| `890e9e9:src/server/http.ts` contient `admitIntakeBatch`/`QUARANTINED`/`skippedQuarantine`/`parseIntakeScope` | **6 occurrences** |
| Bundles `api/v2/*.js` **rebâtis localement** contiennent `QUARANTINED`/`skippedQuarantine` | **7 fichiers** |
| `POST /api/v2/public/facilities?action=operator-import-batch&scope=world` en prod | **401** (route déployée, garde auth) |
| `GET /api/v2/public/facilities` | **200**, **206** facilités |
| `GET /api/v2/public/routing` anonyme | **401 `AUTH_REQUIRED`** (fournisseur facturé configuré, gate identité actif) |

**DETTE RÉELLE DÉCOUVERTE (non bloquante, prod correcte) — bundles committés périmés.**
Les artefacts **suivis par git** `api/v2/*.js` aux commits `HEAD`/`890e9e9`/`7c6a925` **ne contiennent
pas** `QUARANTINED` (grep = 0), alors que le build local les régénère avec POP-1b. Historique :
les tranches serveur précédentes **committaient** leur bundle (`51a1e85`, `6cdbffb`, `df49c27`,
`c6e973b` apparaissent à la fois dans `git log -- src/server/http.ts` **et** `-- api/v2/availability.js`),
mais `7c6a925`/`890e9e9` ont touché `http.ts` **sans** régénérer le bundle.

- **Pourquoi la prod est quand même correcte :** `vercel.json` a `"buildCommand": "npm run build"`,
  et `build` = `build:vercel-functions && tsc -b && vite build`. Vercel **régénère** donc les bundles
  depuis la source à chaque déploiement. Preuve : le hash client prod (`index-BGUSIwRj.js`) ne peut
  provenir que d'un build ; un `api/v2` figé ne produirait pas ce hash.
- **Pourquoi c'est une dette :** un `grep` dans le repo (ou un clone hors Vercel) sur `api/v2/` lit un
  artefact **qui ment** ; il faut builder pour le lire. C'est la classe de bug déjà documentée
  (« tout changement serveur doit rebuild + committer le bundle, sinon la prod sert l'ancien »).
  Ici Vercel masque la dette (rebuild systématique), mais le repo reste trompeur.
- **Action dans cette session :** j'ai **régénéré** les bundles (build) puis **restauré** `api/v2/`
  avec `git checkout --` pour que mon commit reste **docs-only** (pas de diff d'artefacts parasite).
- **Recommandation (action séparée, non exécutée ici) :** régénérer et committer `api/v2/*.js` pour
  `7c6a925`+`890e9e9` (un commit dédié), OU ajouter au `build` une vérification qui échoue si
  `git status --porcelain api/v2/` est non vide après build — pour que la dette ne puisse plus passer
  silencieusement.

---

## 2. P2 — Dry-run distribution des tiers (branche JETABLE, LECTURE SEULE)

**Branche jetable :** `pop1b-world-dryrun` = `br-still-tooth-amhj9mlu`, créée depuis le canonique
(`parent_lsn 0/CBD0F28`), **supprimée en fin de session** (0 résidu — `list_branches search=pop1b` → `[]`).

**Méthode :** harnais `scripts/prove-pop1b-world-dryrun.mjs` — importe le **vrai** classifieur livré
(`classifyIntakePoint`, `admitIntakeBatch`, `parseIntakeScope`) et le **vrai** prédicat
(`isInsidePilotZone`), lit des **points réels** du canonique (copiés sur la jetable), **n'écrit rien**
(`writesAttempted: 0`, gardes `POP1B_DRYRUN_ALLOW=1` + refus si l'URL ressemble au canonique).
Échantillon : **22 points réels** (5 bbox Lomé + 17 Ghana) + 4 synthétiques (branches quarantine non
couvertes par les données réelles).

**Distribution mesurée sur les 22 points réels :**

| Tier | Nombre |
|---|---|
| `pilot` | **4** |
| `world` | **11** |
| `quarantine` | **7** |

**Histogramme des raisons :** `placeholder-no-address` = **7** · `outside-pilot-zone` = **11**.

**Admission par scope (sur 26 points : 22 réels + 4 synthétiques) :**

| Scope | admis | skippedOutOfZone | skippedQuarantine |
|---|---|---|---|
| `pilot` (défaut) | 4 | **12** | **10** |
| `world` | 16 | **0** | **10** |

**Tirages admis en scope `world` :** `{pilot: 4, world: 12}` (les 4 synthétiques ajoutent 1 world
nameless-with-address ; les 3 autres sont quarantine).

**Confirmations qualitatives attendues (vérifiées) :** majorité `pilot` sur Lomé ✅ · `world` sur Ghana
nommé-adressé ✅ · `quarantine` sur placeholder-sans-adresse ✅. **Découverte conforme au §7 :**
**1 point Lomé réel est `Unnamed public place` (sans adresse) → `quarantine`** — c'est exactement le
changement de comportement documenté (« un placeholder-sans-adresse dans la zone, admis avant,
désormais refusé-compté »). Sur 5 points Lomé tirés, **1 seul** tombe dans ce cas.

**Falsification du prédicat de zone (une preuve qui ne peut pas échouer ne prouve rien) :**

| Prédicat | Lomé | Ghana nommé | Placeholder |
|---|---|---|---|
| réel (`isInsidePilotZone`) | pilot | world | quarantine |
| `alwaysTrue` | **pilot** | **pilot** | quarantine |
| `alwaysFalse` | **world** | **world** | quarantine |

→ pilot↔world **s'inversent** avec le prédicat ⇒ le classifieur **l'utilise réellement** ; quarantine
reste quarantine (décidée **avant** la zone — conforme au code). Le compteur n'est pas un faux zéro.

**Zéro écriture canonique Prouvé** (counts canoniques avant = après) :

| Mesure canonique | avant | après |
|---|---|---|
| `v2_facilities` | 206 | **206** |
| `v2_facility_source_refs` | 203 | **203** |
| `v2_products` | 16 | **16** |
| `v2_entities` | 3 | **3** |
| `v2_operator_runs` | 202 | **202** |
| lignes `raw_metadata ? 'intake_tier'` | 0 | **0** |
| probe `POP1B DRYRUN PROBE` | — | **0** |

→ **Aucune écriture canonique, aucune écriture jetable** (le harnais est strictement en lecture).
Vérifié aussi **après suppression de la jetable** : canonique inchangé (206/203/16/3/202).

---

## 3. P3 — Claim spot-check (lecture seule)

**Chemin lu :** `createClaimDraft` (`trunk-repository.ts:1522`) filtre sur
`account_id is null and trust_state in ('unclaimed','verification_draft','needs_more_evidence')` —
**aucune référence au tier**. `listReviewQueue` (`:1694`) filtre par **zone de mission** (P2-C), pas par
tier. S-18 (preuve + arbitrage) intact.

**3 lieux `unclaimed` réels testés** (lecture seule, prédicat exact de `createClaimDraft`) :

| ID | Nom | Zone | `reachable_by_createClaimDraft` | claims ouverts | `tier_present` |
|---|---|---|---|---|---|
| `8be18269-3e9c-4390-918e-ece5a79fd7ef` | Agapet | world (Ghana, lng −0.008) | **true** | 0 | **0** |
| `f3ed08c1-9cd6-405c-ba10-9580a9adee91` | Agapet | pilot (lng 1.029) | **true** | 0 | **0** |
| `c5e6e671-b3e1-4be3-b2cc-d5a771f6b5a0` | Agapet | pilot (lng 1.090) | **true** | 0 | **0** |

**Verdict par lieu :** les 3 sont **joignables** par le claim, **sans** claim ouvert, et **sans** tier
enregistré (`tier_present=0`) → le chemin claim est **agnostique au tier**, y compris pour un lieu
`world` hors zone pilote. **S-18 intact, aucun droit donné par le tier.**

---

## 4. P4 — Recensement éclair canonique (lecture seule)

| Mesure | Valeur | Écart vs 2026-09-28 |
|---|---|---|
| `v2_facilities` total | **206** | = |
| `unclaimed` | **200** | = |
| liées entité (`entity_id not null`) | **3** | = |
| avec adresse | **6** (2,9 %) | = |
| **hors zone pilote** (vraie bbox 1.0/5.85/2.45/6.5) | **44** | **CORRIGÉ** (voir note) |
| dont `longitude < 0` (Ghana) | **17** | = |
| dont `0 ≤ longitude < 1.0` (ouest de Greenwich, avant bord pilote) | **27** | **nouveau** |
| `v2_entities` | **3** (3 organisation / **0** individu) | = |
| `v2_products` | **16** (10 publiés · 13 `a_valider` / 3 `en_stock`) | = |
| caractéristiques | `position_kind` **13** · `uniqueness/handover/price/condition` **3** chacun | = |
| avec média | **3** | = |
| `v2_seller_unlocks` | **0** | = |
| `raw_metadata` portant `intake_tier` | **0** | = (aucun import depuis POP-1a/b — **confirmé**) |
| registre `044`→`064` | **21/21, 0 trou** | = |

**CORRECTION HONNÊTE D'UN CHIFFRE ANTÉRIEUR.** Mon rapport précédent (`471f557`) annonçait
« 21 hors zone ». C'était mesuré avec une bbox « pays Togo » **ad hoc** (lng 0–1.7), pas avec le
**vrai** prédicat d'admission `PILOT_ZONE_BOUNDS` (west 1.0, south 5.85, east 2.45, north 6.5). Avec
la vraie bbox : **44** hors zone = **17** (lng<0, Ghana) + **27** (0 ≤ lng < 1.0, encore à l'ouest de
Greenwich mais à l'est des 17). Extrêmes supply : lat 5,9172–6,4282 / lng −1,0013–2,3912.
Les deux chiffres étaient « vrais » sous leur définition ; **le seul qui compte pour l'admission est 44**.

---

## 5. Vérifications de fin de session

| Garde | Résultat |
|---|---|
| `npm run check:state` | **STATE CONSISTENT** |
| `npm run check:docs` | **DOCS OK** |

---

## 6. Dette & recommandations (aucune action non autorisée exécutée)

1. **[HAUTE] Bundles `api/v2/*.js` périmés pour `7c6a925`+`890e9e9`** — commit dédié de régénération,
   OU garde de build qui échoue si `api/v2/` diverge après `npm run build`. Sinon le repo ment à qui le lit.
2. **[MOYENNE] 44 facilités hors zone pilote** (17 Ghana + 27 ouest) — dettes de DONNÉES ; la garde de
   périmètre du backfill canonique (POP-1c) doit réutiliser le précédent (défaut pilote : refusé-compté).
3. **[BASSE] Registre préfixé `db/migrations/`** sur les entrées anciennes — un filtre `'^044'` remonte
   0 ; utiliser `regexp_replace(filename,'^.*/','')`.
4. **[BASSE] `visual media` : 3/16** et **3/16 offres riches avec `position_kind` NULL** — dettes de
   peuplement (non bloquantes pour POP-1c).

---

## 7. Commits

- `scripts/prove-pop1b-world-dryrun.mjs` (harnais de preuve re-jouable, lecture seule, gardé)
- `docs/founder-hq/mcp-report-2026-09-28-pop1b-world-dryrun.md` (ce rapport)
- Message : `docs+proof: rapport MCP POP-1b (dry-run monde jetable, claim, census, prod)`

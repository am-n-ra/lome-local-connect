# Production Evidence Register — Root slice `R-F` (`S-06` + `S-32`)

> **ID :** `PER-OMNI-RF-2026-09-26`
> **Contrat :** `docs/nature-way/omni-root-s06-s32-contract-2026-09-26.md`
> **Commit :** `ecdb398` (poussé `17d719a..ecdb398`)
> **Branche :** `omni-v2-rebuild` · **Base canonique :** `br-dawn-hill-am5amy22`
> **Prod :** `omni.sparkafrika.online` sert `index-CnHnpl0w.js` === build local (**T-07d ✅**)

---

## 1. Ce qui a été livré

| Livrable | Fichier | Nature |
|---|---|---|
| Dérivation `S-06`/`S-32` pure | `src/trunk/offer-existence.ts` | module pur, testable sans base |
| Tests de dérivation | `src/trunk/offer-existence.test.ts` | 19 tests |
| Faits SQL + dérivation | `src/server/trunk-repository.ts` (`toProduct`, `toFacility`, 3 requêtes) | lecture seule |
| Types client | `src/trunk/types.ts` | `PublicProduct.existence/integrity/reputation`, `PublicFacility.existenceLevel` |
| Libellé UI | `src/trunk/ui-helpers.ts` (`offerTrustLabel`) | pur |
| Rendu | `src/trunk/TrunkAppV13.tsx` (fiche offre : `levelLine` + marque de confiance) | aligné maquette |
| Styles | `src/trunk/ui-v13.css` (`.stepline`, `.exlevel`, `.trust`) | portés de la maquette |

**Aucune migration.** `S-06` et `S-32` sont **dérivées** de faits existants — c'était l'invariant I-3 du contrat. La tranche ne touche pas le schéma.

## 2. Preuve unitaire

```
Test Files  73 passed (73)
Tests       664 passed (664)
```
(+26 vs 638 avant la tranche : 19 dérivation, 4 `toProduct` seam, 4 libellé UI — moins les chevauchements de comptage.)

**TSC :** `npx tsc --noEmit` → exit 0.
**Garde client :** `check:boundary` → *Client boundary: clean*.
**Gardes d'état :** `check:state` → *STATE CONSISTENT* · `check:docs` → *DOCS OK* · `check:maquette` → *MAQUETTE V2 OK* (74 écrans, 5 niveaux ; la ligne `S-06` du registre ne prétend plus que l'échelle est absente).

## 3. Falsification (la preuve peut échouer — sinon elle ne prouve rien)

| Règle sabotée | Tests qui échouent |
|---|---|
| `return reservable > 0 ? 4 : 3` → `return 4` | **2** (« niveau 3 quand rien n'est réservable », « réservations jamais négatives ») |
| `visuel: hasMedia(media)` → `visuel: true` | **4** (dont « ok impossible sans visuel ») |

Les deux règles porteuses du contrat sont donc réellement **gardées par des tests**.

## 4. Preuve live canonique (SQL réel, `br-dawn-hill-am5amy22`, 2026-09-26)

Les **requêtes exactes du dépôt** ont été exécutées contre la base canonique (pas des stubs — leçon NW-13j : un stub ne tombe pas sur `COALESCE types json[] and json` ni sur `min(uuid)`).

**Distribution mesurée des niveaux et de l'intégrité :**

| Niveau | Offres | Intégrité `ok` | `partielle` | `insuffisante` | Visuel manquant |
|---|---|---|---|---|---|
| **0** (Présente) | 3 | 0 | 3 | 0 | 3 |
| **2** (Offre publiée) | 13 | 0 | 13 | 0 | 13 |
| **3 / 4** | **0** | — | — | — | — |

**Ce que la mesure établit, sans embellissement :**
1. **Aucune offre n'est transactable aujourd'hui** (0 aux niveaux 3 et 4). Toutes les offres publiées sont au niveau 2 : `availability_state = 'a_valider'` partout (16/16).
2. **Aucune offre n'est `intégrité ok`** — les 16 échouent sur le **même** contrôle : `visuel` (`media = []`). C'est exactement l'écart prédit au §5.3 du contrat.
3. La réputation **se dérive** des transactions : `Baguette tradition` 1 avis, `Riz parfumé local 5 kg` 2 avis (10/2 = 5,0), etc. Les offres sans transaction sont **`muted`** (`count = 0`, `score = null`) — jamais « 0 ★ ».

**Conclusion honnête :** la maquette affiche « intégrité ✓ · 4,6 ★ » sur chaque carte ; la réalité est **0 ✓ / 16**. La tranche rend cet écart **visible et explicable** au lieu de le peindre. C'est le résultat attendu, pas un défaut.

## 5. Preuve de bundle et de production

| Vérification | Résultat |
|---|---|
| Client construit | `dist/assets/index-CnHnpl0w.js` |
| Chaînes `S-06` dans le bundle client | `Transactable`, `0 Présente`, `Niveau `, `stepline` = présentes |
| Chaînes `S-32` dans le bundle client | `intégrité partielle`, `intégrité insuffisante`, `visuel manquant`, `pas encore d’avis` = présentes |
| CSS livré | `.stepline`, `.exlevel`, `.trust.ok`, `.trust.muted` présents |
| Bundles serverless régénérés | `existenceFor`/`computeIntegrity`/`reputation_count`/`is_duplicate` dans **7** bundles `api/v2/*.js` |
| Démarrage navigateur | coquille rendue, dock Buyer/Recherche/QR/Menu, aucune erreur console bloquante |
| **Prod === local (T-07d)** | `omni.sparkafrika.online` sert `index-CnHnpl0w.js` — **identique** au build local |
| **Chaînes dans le bundle SERVI** | `Transactable`, `0 Présente`, `intégrité partielle`, `visuel manquant`, `pas encore d’avis`, `stepline`, `Niveau ` = **toutes présentes** dans `/assets/index-CnHnpl0w.js` récupéré depuis la prod |
| **API prod live** | `GET /api/v2/public/facilities` → **206 lieux** avec `existenceLevel` ; distribution **203 × niveau 0, 3 × niveau 2** — identique à la mesure canonique. Le calcul tourne réellement en prod. |

**Note de méthode :** un helper présent mais jamais appelé ressemble à un correctif déjà en place (leçon du 2026-09-17). C'est pourquoi la preuve vérifie les chaînes dans le **bundle servi** et la **réponse API live**, pas seulement la définition dans le source.

## 6. Résidus honnêtes

| Résidu | Statut |
|---|---|
| Preuve navigateur **avec session réelle** (fiche offre peuplée, `levelLine` + marque rendues) | **non exécutée** — le sandbox n'a ni DB ni auth. À faire au prochain spot-check fondateur. |
| Écart maquette ↔ réalité (maquette ✓ partout, réalité 0 ✓) | **assumé et documenté** — devient un **acte vendeur** : ajouter des visuels fait passer l'intégrité à `ok`. |
| `prix > 0` signalerait une offre gratuite légitime | **trade-off documenté** (§5.4 du contrat) + trigger de révision. |
| `S-06` niveau 3/4 jamais atteint en prod | **conséquence des données**, pas du calcul : aucun vendeur n'a encore confirmé de disponibilité (`a_valider` partout). Le jour où une dispo Pro est confirmée, le niveau monte seul. |
| Échelle non exposée sur la **recherche** (rail/cartes) | **hors périmètre** de cette tranche (fiche offre + fiche lieu seulement), conformément au contrat §7. |

## 7. Verdict

**Tranche `R-F` : livrée, prouvée, honnête.** Les deux dettes mesurées du Seed (`S-06`, `S-32`) ne sont plus **confirmées-mais-non-construites** : elles sont **dérivées, rendues, testées, et mesurées en live**.

La porte **Root** reste ouverte : cette tranche ferme `S-06`/`S-32` ; la clôture de Root demande le **verdict fondateur** sur l'écart assumé du §4 (0 ✓ / 16).

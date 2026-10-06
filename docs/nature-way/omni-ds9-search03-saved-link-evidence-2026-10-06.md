# DS-9 — SEARCH-03 lien « Recherches sauvegardées » (2026-10-06)

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** maquette Species V2 (74 écrans, CLOSE).
> **Objet :** `SEARCH-03` du registre `omni-dock-search-conformance-register-2026-10-06.md`.

## A. Constat (mesuré)

La maquette (L466, en-tête du sheet recherche) porte un lien `linkbtn` :

```html
<button class="linkbtn" onclick="go('saved')">Recherches sauvegardées</button>
```

L'app n'avait **aucun** lien vers `saved` dans l'en-tête de la recherche (seulement l'entrée du menu). Écart de fidélité, sévérité **basse**.

## B. Correctif

Lien ajouté dans `.sheet-head` du sheet recherche, **acheteur uniquement**, appelant `openSaved()` (qui garde correctement l'accès par session — les recherches sauvegardées sont liées au compte) :

```tsx
{role === 'buyer' && (
  <button type="button" className="linkbtn" onClick={() => void openSaved()}>Recherches sauvegardées</button>
)}
```

**Classe fidèle.** La maquette utilise `.linkbtn` (L99 : `font-size:9.5px;font-weight:800;color:var(--ink-soft);background:none;border:0;padding:0`). Cette classe était **absente** de l'app — ajoutée à `ui-v13.css` (port byte-identique de la maquette), **et** `.textbtn` (utilisée 3× dans `TrunkAppV13.tsx` mais **jamais définie**) est désormais définie : deux boutons qui rendaient aux styles par défaut du navigateur sont réparés. Garde `vocab-linkbtn-defined` (falsifiée).

**Note de placement.** En desktop (`≥1040px`) la recherche est une **barre permanente compacte** et `.sheet-head` y est **masqué** (CSS L243) — le lien n'y apparaît donc pas, ce qui est cohérent (l'entrée « Recherches sauvegardées » existe déjà dans le menu). En **mobile** l'en-tête est visible → le lien y apparaît, comme la maquette.

## C. Preuves

| Type | Résultat |
|---|---|
| **Garde falsifiable** | `scripts/check-dock-search.mjs` — **16 règles** (neuves : `search-03-saved-link`, `vocab-linkbtn-defined`) ; `--selftest` **16/16 fired** ; source réelle **PASS** |
| **Navigateur (mobile 390px, session stubbée au bord auth)** | `scripts/prove-search03-saved-link.mjs` — **4/4** : le sheet recherche ouvre, le lien « Recherches sauvegardées » est **visible** dans l'en-tête, il ouvre le sheet `saved`, aucune erreur |
| **Non-régression** | `tsc` clean · **796/796** tests · `dock-search`/`boundary`/`live-surface`/`state`/`docs` **PASS** |
| **Bundles serverless** | **0 modifié** (100 % client) |

## D. Défaut latent réparé (couplé, même commit)

La classe **`.textbtn`** était utilisée **3×** dans `TrunkAppV13.tsx` mais **définie dans AUCUN CSS** — ces boutons rendaient aux **styles par défaut du navigateur** (même classe que la règle `.navpill button` jetée, 2026-09-25). Réparée en même temps que `.linkbtn` (le lien SEARCH-03 en dépendait pour être fidèle). Garde `vocab-linkbtn-defined` : échoue si `.linkbtn` ou `.textbtn` disparaît du CSS — **falsifiée**.

## E. Reste (post-DS-9)

`SEARCH-02` (fraîcheur état-codée — **décision de modèle requise**, D-03) · `MENU-01` (menu vendeur 7→13 entrées — **Haute**, mais 13 destinations dont plusieurs écrans **non construits** → chaque entrée exigerait un écran, sinon bouton mort) · `DOCK-02` (dock opérateur terrain — **Haute**, logique, dépend de `op-queue`) · `SEARCH-01` (tri — **déjà livré**, DS-1) · écrans terrain opérateur (owner fondateur TT-1).

## F. État de livraison

Commit local, **NON poussé** — `GITHUB_TOKEN` **expiré** (401 sur `api.github.com/user`, les deux formes d'auth). **T-07d non franchi.** À pousser dès un jeton `repo` valide, puis vérifier hash prod === local + entrée de déploiement GitHub.

# V-9′ — Preuve du nettoyage du code v1 mort

> **ID :** `V9-PROOF-2026-09-23` · **Commit :** local (push bloqué — jeton expiré)
> **Branche :** `omni-v2-rebuild` · **Disposition :** `omni-v9-v1-dead-code-disposition-2026-09-23.md`

---

## 1. Ce qui a été supprimé

| Lot | Fichiers | Critère |
|---|---|---|
| Code v1 mort | **211** | Inatteignable depuis les 13 points d'entrée réels (`main.tsx` + 12 entrées serverless) |
| Tests couvrant du code mort | **22** | Importent un module mort — **124 cas** qui ne testaient rien qui shippe |
| Tests placeholder | **6** | N'assertent que `toBeDefined()` sur des composants **inexistants** |
| CSS orphelin + README périmé | **2** | `components/v2/maquette.css` (non importé), `routes/README.md` (documente TanStack, disparu) |
| Harnais v1 non branché | **1** | `scripts/check-global-coverage.ts` lisait `public.facilities` (table **v1 gelée**, RD-1) |
| **Total** | **242 suppressions + 1 module mort via git rm** | |

**Déplacement net :** 246 fichiers changés, **+222 / −37 419 lignes**. `src/` : **351 → 116 fichiers** (hors tests).

## 2. Le produit n'a PAS bougé — preuve au sha256

C'est le point qui compte : une suppression de mort ne doit rien changer à ce qui shippe.

| Mesure | HEAD (avant) | Après |
|---|---|---|
| JS `sha256` | `e4231c7eef9398f282d294193492a28938fcb2fe71a7839c5338ae5e9f8a76ba` | **identique** |
| JS taille | 2 232 444 o | **2 232 444 o** (byte-identique) |
| CSS taille | 347 742 o | **243 570 o** (−104 Ko) |
| CSS classes en moins / en plus | — | **−395 / +0** |

**Pourquoi le CSS change alors que le JS non :** Tailwind scanne l'arbre source pour générer ses utilitaires. Les 395 classes retirées sont celles des **fichiers supprimés** (ex. `inset-0`, `pointer-events-none`, `top-16`) ; **0 classe ajoutée** = **aucune classe vivante perdue**. Le hash Vite de l'entrée change parce qu'il intègre son dépendant CSS — **le corps du JS est identique au sha256**.

**Méthode A/B (pas supposée) :** build de `HEAD` dans un **worktree** → `index-DcmAYT8f.js` ; build après suppression → `index-1X4ttkWU.js` ; `sha256sum` des deux = **mêmes empreintes**. Et le JS servi en **prod** (`index-DcmAYT8f.js`) est **byte-identique** au build post-suppression.

## 3. Vérifications

| Contrôle | Avant | Après |
|---|---|---|
| `npm test` | 75 files / **691** | 46 files / **558** (−133 = tests de code mort, tous factices ou sur du mort) |
| `npx tsc --noEmit` | clean | **clean** |
| `npm run build` | ✓ | **✓** |
| `check:boundary` | clean | **clean** |
| `check:live-surface` (nouveau) | — | **clean** |

## 4. Le garde, et sa falsification

`scripts/check-live-surface.mjs` (`npm run check:live-surface`) échoue si :
1. un fichier de production est **inatteignable** depuis un point d'entrée réel ;
2. un test n'importe **que du code mort** (fausse couverture) ;
3. un fichier source importe un module **disparu** (nettoyage partiel) ;
4. un script ou `server/` importe un module `src/` **supprimé**.

**Falsification exécutée :** recréer un fichier mort → **exit 1** ; le retirer → **exit 0**. Un garde qui ne peut pas échouer ne garde rien.

## 5. Les trois failles du garde, trouvées en le construisant

Le garde **s'est trompé trois fois avant d'être juste** — chaque erreur était réelle, pas théorique :

1. **Il ne résolvait pas l'alias `@/`.** Or les tests l'utilisent. **Vérifié : aucun fichier de production n'utilise `@/`** — donc aucune suppression à tort, mais le garde aurait produit de faux orphelins demain. Corrigé.
2. **Il ignorait les scripts.** `check-global-coverage.ts` importait `@/lib/db.server` → `tsc -b` a cassé. Corrigé par le contrôle inverse (scripts → `src/`).
3. **Il exemptait à tort un test dont TOUS les imports pointent vers des fichiers supprimés** (ils ne résolvent pas → 0 dépendance → « pas de code mort »). C'est le cas `map-menu.unit.test.ts`. Corrigé par la détection d'import **interne non résolu**.

Et un **faux positif** corrigé aussi : 3 tests (`root-migration`, `group-by-completeness`, `route-intent-lock`) lisent des **artefacts vivants** (`db/migrations/*.sql`, `trunk-repository.ts`, `TrunkAppV13.tsx`) via `readFileSync` — **légitimes**. Un test sans import résolu n'est pas une fausse couverture.

## 6. Capacités présentes SEULEMENT dans le mort — stack abandonné

| Stack | Fichiers morts | Interprétation |
|---|---|---|
| **Supabase** | 5 | Auth/DB v1 **abandonnée** (Neon v2 l'a remplacée) |
| **TanStack Router** | 30 | Arbre de routes **jamais monté** (`main.tsx` monte `TrunkAppV13` directement) |
| **react-query** | 2 | Client de données v1 abandonné |

Ce ne sont **pas** des capacités utiles qu'on aurait perdues : ce sont les traces d'un **autre** produit.

## 7. Résidu honnête

- **18 escales** par rapport à la mesure initiale : le garde (avec alias + tests) en a trouvé **4 de plus** que mon script de graphe initial (`map-menu` + 3 tests-fichiers), et j'avais compté 2 CSS/README et 1 harnais en plus. Le compte final est celui du **garde**, source unique.
- Le test `map-menu.unit.test.ts` supprimé couvrait `map-context`/`omni-menu`/`search-dock-contract` — **tous morts et v1**. Si leurs concepts reviennent (dock contextuel, contrat de recherche), ils reviendront **écrits au gate**, pas ressuscités.
- **Push bloqué** : jeton GitHub **401** (expiré en session). RH-02 est poussé ; ce commit attend un jeton valide.
- **`D-V9-1/2/3`** : les trois décisions ont été **exécutées** sur ordre fondateur « go ». La **décision de fond** (faut-il jeter v1 ?) était déjà **oui**.

## 8. Prod — et un piège que je me suis infligé

**Prod déployée** (commit `fed06b0`, Vercel auto-deploy) : `index-mza3pQm7.js` + `index-DJ7oR68a.css` — **exactement** les fichiers locaux stabilisés.

**⚠️ Piège attrapé sur moi-même :** lors du premier contrôle prod, le CSS servu différait de 96 octets du CSS local, **pour le même commit**. Ce n'était **pas** un écart de déploiement : mon premier `npm run build` avait produit un CSS **transitoire** (`index-D4hBE0k9.css`, `dc16a39e…`) ; Tailwind a stabilisé au run suivant, et les **3 builds suivants** produisent tous `index-DJ7oR68a.css` (`a201d7d7…`) — **byte-identique à la prod**. La règle que j'avais écrite (« comparer le **contenu**, pas le nom ») **s'appliquait à mon propre contrôle** : j'avais conclu d'un nom de fichier, pas d'un sha.

**JS : byte-identique à la prod** (`e4231c7e…`) avant **et** après le nettoyage — le produit n'a pas bougé, y compris déployé.

**Smoke prod :** page **HTTP 200**, refus serveur `401 AUTH_REQUIRED` (la gate RH-02 tient en prod).


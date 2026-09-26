# V-9′ — Disposition du code v1 mort : « ignorer v1 » doit devenir exécutable

> **ID :** `V9-DISPOSITION-2026-09-23` · **As of :** 2026-09-23
> **Porte :** `ROOT` (ouverte) · **Handoff :** `HO-OMNI-22`
> **Déclencheur :** question fondateur — « *vu qu'on a recommencé depuis Species puis Seed, n'est-ce
> pas mieux qu'on se concentre sur Root, sans considérer ce qui avait été écrit comme code v1, et
> qu'au bon gate on écrive le code comme il se doit ?* »

---

## 1. Réponse courte

**Oui — et l'app le fait déjà.** Mais « ignorer v1 » est resté une **intention** : le code v1 est
**encore là**, dans le dépôt, et il **ment** (fausse couverture, carte faussée). « Ignorer v1 » doit
devenir **supprimer v1**. C'est `V-9`, planifié depuis TEC-1 et **jamais tranché** — avec un
périmètre documenté **~10× trop petit**.

## 2. Mesure — la séparation existe déjà (graine unique)

Graphe d'imports résolu depuis les **13 points d'entrée réels** (`src/main.tsx` + 12 entrées
serverless `src/server/vercel/*`), `.ts/.tsx`, hors tests :

| Fait mesuré | Valeur |
|---|---|
| Fichiers de production | **276** |
| **Atteignables** depuis une entrée réelle | **65** |
| **Morts** (jamais atteints) | **211** |
| Poids mort | **1 371 Ko / 2 443 Ko = 56 %** |
| Globs dynamiques (`import.meta.glob`) | **0** — aucun rattachement caché |
| Entrée client | **une seule** (`main.tsx` → `TrunkAppV13`) |

**Morts par dossier :** `src/components` **114/115** · `src/lib` **58/61** · `src/routes` **18/18** ·
`src/integrations` **6/6** · `src/core` **2/2** · `src/trunk` 4/35 · `src/server` 3/26.

**Capacités présentes SEULEMENT dans le code mort** (donc stack **abandonné**, pas capacité utile) :
**Supabase** (5 fichiers) · **TanStack Router** (30) · **react-query** (2).

## 3. Pourquoi ce n'est pas neutre — trois préjudices mesurés

1. **Fausse couverture.** **6 tests** n'assertent que `toBeDefined()` sur des composants qui
   **n'existent pas** (0 fichier pour chacun des 6). Suite verte, couverture nulle. Un test qui ne
   peut pas échouer ne garantit rien — la méthode le dit ; ici il **occupe une place** qui laisse
   croire le contraire.
2. **Le code mort a déjà menti une fois.** L'analyse d'itinéraire de RH-01 a trouvé, dans
   `src/routes/fiche.$id.tsx` et `src/components/omni/CartePage.tsx` (tous deux **morts**), du
   **contact vendeur affiché avant intention** — une incohérence qui **survit parce que les fichiers
   survivent**. Supprimés, l'incohérence disparaît avec eux.
3. **Il fausse la carte — c'est la cause de la confusion fondateur.** Un lecteur (humain ou IA)
   voit **3 points d'entrée d'app** et **4 générations d'UI** (`components/omni`, `omni-clean`,
   `mockup`, `v2`) et conclut que l'app est v1. La phrase « beaucoup d'incohérence dans ce qu'on veut
   réellement faire » décrit **ce dépôt**, pas l'intention.

## 4. Le contre-argument, dit franchement

- Le code mort **ne shippe pas** : le bundle est propre (65 fichiers, entrée unique). Le supprimer
  **n'améliore pas le produit pour l'acheteur**.
- Son coût réel est **maintenance + confusion + fausse couverture** — réel, mais **pas** face client.
- **Donc il ne doit pas déplacer la substance Root.** C'est une tranche d'**hygiène**, qui paie
  **avant** la prochaine grosse tranche Root (elle retire un faux signal), **pas à la place**.

## 5. Décisions demandées

| ID | Décision | Recommandation |
|---|---|---|
| **D-V9-1** | Supprimer le code v1 mort (211 fichiers) ? | **Oui** — mais par **périmètre prouvé**, pas par sweep : chaque suppression doit être **falsifiable** (le build et les 691 tests restent verts ; un garde échoue si un mort réapparaît). |
| **D-V9-2** | Supprimer les **6 tests placeholder** ? | **Oui** — ils affirment une couverture inexistante. |
| **D-V9-3** | Verrouiller la frontière ? | **Oui** — un `scripts/check-live-surface.mjs` qui échoue si un fichier hors fermeture d'imports réapparaît dans `src/`. |

**Ce qu'on ne supprime PAS :** `src/components/ui/PublicQrScannerSheet.tsx` — il est **vivant**
(scanner QR public). Les 65 fichiers vivants sont **conservés** : ils ont été écrits contre les
décisions Root courantes et sont **prouvés** (691 tests, preuves SQL réelles).

## 6. La règle qui répond exactement à la question

> **« Ignorer v1 » s'applique au *code* v1, jamais aux *leçons* v1.**

Le code mort est v1 → il part. Mais v1 a aussi laissé des **décisions** — contact **après**
intention, disponibilité **confirmée** avant affichage, **entité d'abord** — qui sont devenues des
décisions Seed/Species/Root et qui **doivent** être honorées. Ignorer l'**implémentation** v1 ;
jamais ignorer les **leçons** v1.

## 7. Ordre recommandé

1. **`V-9′`** (cette tranche, hygiène bornée) — supprimer v1 mort + 6 tests factices + garde.
   *Raison : rend le travail Root honnête et la carte vraie.*
2. **Root par gate** — prochaine tranche de substance : **`D-CON`/`D-LOC`** (seuils `'Quantité 10'` /
   `'≤ 15 000 FCFA'` **figés** et devise **en dur**, qui **contredisent des décisions approuvées**).
   C'est ce que le fondateur **voit**.
3. **Ne jamais réécrire ce qui vit** — les 65 fichiers vivants sont la graine ; on écrit du neuf
   **au gate**, pas par-dessus.

## 8. Non-goals

- Ne pas toucher aux 65 fichiers vivants.
- Ne pas rouvrir Seed ni Species.
- Ne pas « réécrire l'app » : elle est **déjà** réécrite ; il reste à **jeter l'ancienne**.
- Ne pas confondre ce nettoyage avec un gain produit : c'est de l'**hygiène de dépôt**.

## 9. Preuve attendue

- `npm test` **691/691** avant et après.
- `npm run build` : hash **identique** (le mort n'est pas dans le bundle — c'est la preuve qu'on ne
  touche pas le produit).
- `check:boundary` clean.
- **Falsification du garde** : recréer un fichier mort → le garde **échoue**.

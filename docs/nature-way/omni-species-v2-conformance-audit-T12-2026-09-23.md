# T-12 — Audit de conformité Species V2 — **REFait** (2026-09-23)

> **Tâche :** `T-12` (plan `NW-PROD-OMNI-SEED2-01`) · **Phase :** Species (réouverte)
> **Owner décisions :** fondateur · **Méthode :** rendu navigateur réel (Playwright), pas grep
> **Référence unique :** `docs/nature-way/omni-intent-brief-v2-2026-09-23.md`
> **Maquette :** `docs/maquette/omni-species-v2-interactive.html` (73 écrans)
> **Harnais :** `scripts/t12-audit.mjs` → `npm run check:species-t12`

---

## 1. Pourquoi cet audit a dû être refait

Le fondateur a tranché : **« l'audit est à refaire »**. Il avait raison, et la raison est une
**faute de méthode**, pas un manque de rigueur apparente.

**L'ancien audit mesurait le SOURCE HTML** (grep de chaînes), pas **l'écran rendu**. Il mesurait
donc des chaînes qui **peuvent ne jamais s'afficher**.

**Preuve immédiate trouvée au premier rendu :**

| Ce que l'ancien registre disait | Ce que l'écran `offer` rend vraiment |
|---|---|
| Caractéristique 5 **« Retrait / livraison » → `OK (SP-1)`**, cité par la chaîne `remise: 'Retrait sur place'` | Le mot **« Retrait » n'apparaît nulle part** sur la fiche. La donnée `remise` existe dans l'objet JavaScript mais **n'est jamais rendue**. |

Le panneau affichait pourtant **« sept caractéristiques »** — en réalité **7 lignes qui scindaient
Quantité/Déplétion** (une seule caractéristique au Seed) et **omettaient le Retrait/livraison**.
Autrement dit : **l'écran affirmait « sept » en n'en montrant que six**, et l'audit validait — parce
qu'il lisait la donnée, jamais le pixel.

> **C'est exactement la classe d'erreur qui a fait tourner le process en rond : *mesurer mal →
> construire sur la mauvaise mesure*.** Elle a désormais un correctif de méthode, pas un correctif de
> vigilance.

## 2. La méthode du refait

- **Rendre chaque écran** dans un navigateur réel (Chromium/Playwright, viewport 1280×900).
- Extraire le **texte visible** (`#sheetmount.innerText` **et** le corps entier — certaines surfaces,
  comme les filtres de carte, vivent **hors** du sheet).
- Pour chaque décision : **un prédicat sur ce qu'un être humain lit**, jamais sur le source.
- **Falsifier** : le prédicat doit pouvoir échouer. Vérifié.

## 3. Résultat : **16/16 conforme · 0 non conforme**

| Décision | Verdict | Preuve lue à l'écran |
|---|---|---|
| **S-01** tout est offre / 7 caractéristiques | ✅ **OK** *(après correctif)* | les **sept** caractéristiques rendues, **Retrait / livraison inclus** |
| **S-05** `unclaimed` niveau 0 + Revendiquer | ✅ OK | « Lieu connu… Revendiquer » (results) |
| **S-06** échelle 0→4 | ✅ OK | niveau rendu sur la fiche + `Niv. n` sur les résultats |
| **S-07** carte + recherche = un corpus, carte filtrable | ✅ OK | `Tout / Commerces / Particuliers / Transport` sur le viewport |
| **S-10** offre non limitée au physique + origine | ✅ OK | offre immatérielle rendue **et** son origine dite |
| **S-11** deux niveaux (entité / offre) | ✅ OK | sélecteur « Chercher une entité / une offre » + page publique entité |
| **S-14** seuil de confiance par volume | ✅ OK | « 1 vente (particulier) · 3 ventes (commerce) » |
| **S-18** revendication ≠ création | ✅ OK | preuve de contrôle + arbitrage opérateur |
| **S-19** avantage promotionnel obligatoire | ✅ OK | « Avantage Omni (requis) » à la publication |
| **S-20** visuels obligatoires | ✅ OK | « 1 image requise ✓ ajoutée » |
| **S-22** QR multi-canaux | ✅ OK | partage hors Omni + validation dashboard |
| **S-25** l'offre appartient à l'ENTITÉ | ✅ OK | « Cette offre appartient à… » + « le lieu dit *où*, jamais *à qui* » |
| **S-27** dashboard/scan strictement vendeur | ✅ OK | surface vendeur + acheteur **informé**, jamais doté du scanner |
| **S-29** espace vendeur progressif | ✅ OK | entrée Créer / Revendiquer |
| **S-32** intégrité + réputation de l'offre | ✅ OK | les deux blocs rendus sur la fiche |
| **économie** plafond gratuit + bonus distincts | ✅ OK | « 3 / 20 (gratuit) » + « 20 USD → 3 ventes à des acheteurs distincts » |

## 4. Écart réel trouvé — et corrigé (périmètre maquette)

**`S-01` — la fiche offre affirmait « sept caractéristiques » sans montrer le Retrait/livraison.**

- **Cause racine :** le panneau rendait `Quantité` et `Déplétion` en **deux lignes** et **omettait la
  ligne `remise`** — donc 7 lignes pour 6 caractéristiques réelles du Seed. Fausse affirmation à l'écran.
- **Correctif :** une ligne **« Quantité / déplétion »** (une caractéristique, comme au Seed) + une
  ligne **« Retrait / livraison »** → **sept lignes, sept caractéristiques, aucune affirmation fausse.**
- **Preuve :** `docs/nature-way/t12-proof/offer-caracteristiques.png`.

## 5. Falsifications (un audit qui ne peut pas échouer n'est pas un audit)

| # | Falsification | Résultat attendu | Obtenu |
|---|---|---|---|
| F1 | retirer la ligne « Retrait / livraison » de la fiche | `S-01` échoue | ✅ **ABSENT — characteristic(s) not rendered: Retrait / livraison** |
| F2 | remplacer « 3 / 20 (gratuit) » par « 3 / 50 » | `economy` échoue | ✅ **ABSENT — free ceiling not stated** |
| F3 | remplacer « Cette offre appartient à » | `S-25` échoue | ✅ **ABSENT — ownership not explicit** |

**Deux faiblesses de l'audit lui-même, trouvées et corrigées pendant la falsification :**

1. **Premier jet : 4 faux négatifs.** Les prédicats `S-07`, `S-11`, `S-27` et `economy` accusaient à
   tort — les surfaces **existaient**. Causes : les filtres de carte vivent **hors** du sheet ; un bug
   d'expression ; une recherche trop littérale ; **le mauvais écran** pour le plafond (il est sur
   `seller-offers`, pas `seller-publish`). **L'audit mesurait mal, pas le produit.**
2. **F2 a d'abord PASSÉ** malgré l'altération : le prédicat d'économie avait un repli trop large
   (`plafond gratuit`) qui masquait le changement de valeur. **Resseré** sur la chaîne exacte
   `3 / 20 (gratuit)`. C'est ce qui rend F2 décisive maintenant.

## 6. Resource Receipt

| Statut | Chemin |
|---|---|
| Chargé | `.agents/skills/nature-way/references/visual-and-logic-coherence-review.md` |
| Chargé | `.agents/skills/nature-way/references/intra-skill-execution-controller.md` |
| Chargé | `docs/nature-way/omni-intent-brief-v2-2026-09-23.md` (34 décisions) |
| Chargé | `docs/maquette/omni-species-v2-interactive.html` (73 `SHEETS`) |
| Chargé | `docs/founder-hq/current-state.md` (source d'état) |
| Non chargé / raison | `technical-lead-production-review.md` — phase Root non active |

## 7. Retour à Founder HQ

| Champ | Valeur |
|---|---|
| HQ plan | `HQ-OMNI-2026-09-02` · porte courante : **Seed/Species réouverte** |
| Plan local | `NW-PROD-OMNI-SEED2-01` · **T-12 refait et livré** |
| Verdict | **16/16 conforme** par rendu navigateur ; **1 écart réel trouvé et corrigé** (S-01) |
| Preuve | `npm run check:species-t12` + `docs/nature-way/t12-proof/` |
| Gap résiduel | **Aucun écart de conformité connu.** Les décisions hors périmètre maquette restent `V1+` par Seed (`S-02`, `S-12`) |
| Prochaine action | **Le fondateur valide `SP-1…SP-6`** (`SP-VALIDATION`) → clôture Species. **Rien d'aval ne s'ouvre avant.** |

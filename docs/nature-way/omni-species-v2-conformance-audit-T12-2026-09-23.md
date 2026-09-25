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
| Verdict | **16/16 conforme** par rendu navigateur ; **1 écart réel trouvé et corrigé** (S-01) — ⚠️ **dénominateur corrigé le 2026-09-25 (voir §7) : 22/22, 21 décisions rendues, `NON MESURÉ = 0`** |
| Preuve | `npm run check:species-t12` + `docs/nature-way/t12-proof/` |
| Gap résiduel | **Aucun écart de conformité connu.** Les décisions hors périmètre maquette restent `V1+` par Seed (`S-02`, `S-12`) — ⚠️ **5 décisions restent `règle écrite` (non auditées) : S-09, S-13, S-16, S-17, S-28 (§7)** |
| Prochaine action | **Le fondateur valide `SP-1…SP-6`** (`SP-VALIDATION`) → clôture Species. **Rien d'aval ne s'ouvre avant.** |

---

## 7. Amendement 2026-09-25 — le dénominateur était faux (`COH-V2-18`)

Cet audit disait **« 16/16 conforme »**. C'était **vrai** — et **trompeur**, exactement de la même manière que le premier audit qu'il remplaçait.

### Le défaut, nommé

Le harnais appliquait **ses propres** phrases de Seed — **15 décisions** sur les **34** du Seed V2 — puis imprimait `16/16 conforme`. Le **dénominateur était choisi par l'audit lui-même** : toute décision qu'il ne regardait pas devenait **conforme par omission**.

Mesuré : **20 décisions du Seed n'étaient prouvées par AUCUNE mesure** (S-03, S-04, S-08, S-12, S-21, S-24, S-30, S-31…).

> **C'est la même faute que §1, une couche plus haut.** L'ancien audit lisait la **donnée** au lieu du **pixel** ; celui-ci regardait un **sous-ensemble** en le présentant comme le **tout**. Dans les deux cas : *mesurer mal → conclure trop fort.*

### Le correctif — le Seed est le dénominateur

Le harnais **lit désormais le Seed** et **classe CHAQUE décision `S-xx`** :

| Classe | Sens | Compte |
|---|---|---|
| `rendu à l'écran` | la phrase est **lue au rendu** (preuve navigateur) | **21** |
| `contrainte code` | règle de modèle prouvée en base/code, aucun écran à rendre | 4 |
| `règle écrite` | règle énoncée, surface non auditée | 5 |
| `hors V1 (Seed)` | **exclu par le Seed lui-même** (`V1+`) | 2 (S-08, S-12) |
| **`NON MESURÉ`** | **aucune preuve** | **0** |

Et le harnais imprime le verdict **borné** (« ne porte QUE sur les 21 rendues ») et sort en **code ≠ 0** s'il reste un `NON MESURÉ` **ou** un non-conforme. **Avant, un non-conforme imprimait une ligne et sortait en `0`** — il ne pouvait pas faire échouer un CI.

### 6 décisions sorties de l'aveuglement → **1 écart réel corrigé**

| Décision | Verdict | Preuve (rendue) |
|---|---|---|
| **S-04** | **CORRIGÉ** | L'écran de publication **ne nommait pas l'entité propriétaire** → violation de « pas d'offre orpheline ». Ligne ajoutée : « Cette offre appartient à Boutique Kodjo · l'entité ». |
| `S-03` | OK | `entite-publique` liste « **Ses offres** » |
| `S-21` | OK | `scan-entity` (QR public → remise Omni) + `entity-from-qr` (avantages Omni −15 %) |
| `S-24` | OK | asymétrie tenue : acheteur scanne les entités, vendeur scanne les acheteurs ; aucune fuite côté acheteur |
| `S-30` | OK | « la confiance porte sur l'entité » rendu ; la fiche offre **ne revendique pas** de confiance propre |
| `S-31` | OK | `seller-verif` rend « Vous publiez déjà » + « Non vérifié » |

### Preuves

- `npm run check:species-t12` → **22/22 conforme**, **21 rendues**, **`NON MESURÉ = 0`**, exit `0`.
- **Garde falsifié** : retirer la ligne d'ownership → **S-04 `ABSENT`**, **exit `1`** (avant : **exit `0`**).
- `check:maquette`, `check:state`, `tsc`, **600/600 tests** — verts.

### Ce qui reste, honnêtement

- `S-09`, `S-13`, `S-16`, `S-17`, `S-28` = **`règle écrite`** : surfaces probables, **non auditées ici**. Les déclarer conformes serait retomber dans le défaut.
- `S-08` / `S-12` = **hors V1 par décision du Seed** — une **exclusion assumée**, pas une conformité.
- **`COH-V2-18` → CORRIGÉ.** Ce qui reste ouvert : **`SP-VALIDATION`** — un audit conforme **ne vaut pas** acceptation fondateur.


# Handoff Receipt — `HO-OMNI-25`

> **Date :** 2026-09-26
> **De :** Nature Way Founder HQ (route produit)
> **À :** Fondateur Omni
> **Objet :** Root slice `R-F` — `S-06` (échelle d'existence) + `S-32` (intégrité & réputation de l'offre), et **Founder Mission Contract**
> **Commit :** `ecdb398` · **Prod :** `index-CnHnpl0w.js` (**T-07d ✅**)

---

## Ce qui a été fait

Le fondateur a tranché : « **oui on en fait une tranche root et oui on l'écrit** ». Les deux choses ont été faites.

**1. Le Founder Mission Contract est écrit** (`docs/nature-way/omni-founder-mission-contract-2026-09-26.md`). Il fixe la mission (un index vivant de l'offre locale, pour supprimer la recherche/contact/comparaison à la main), la cible de maturité (`pilot-ready` Lomé, pas `production-ready`), les non-goals, les responsabilités IA, la frontière de revue humaine, la définition de done, et les trois décisions qui remontent au fondateur. Il nomme aussi ses propres hypothèses réversibles (grille des packs, taux pilote) — il ne les cache pas.

**2. La tranche Root `R-F` est livrée.** `S-06` et `S-32` étaient **confirmées mais jamais construites** (0 occurrence en code et en schéma). La maquette les **dessinait déjà** — l'app ne les **calculait pas**. C'est la définition exacte d'une dette Root.

Les deux sont **dérivées, jamais stockées** : une colonne `existence_level` peut vieillir ou se désynchroniser, une dérivation non. **Aucune migration** — les faits existaient.

## Ce que la mesure a révélé (et pourquoi ça compte pour vous)

Vous dites que « tout le fond et la logique qui doit faire de Omni omni n'est pas là ». Cette tranche met **un chiffre** sur cette sensation :

- **0 offre sur 16 n'est transactable aujourd'hui** (toutes au niveau 2, `a_valider` partout).
- **0 offre sur 16 n'est `intégrité ok`** — les 16 échouent sur le **même** contrôle : **aucun visuel** (`media = []`).

La maquette affiche « intégrité ✓ · 4,6 ★ » sur chaque carte. La réalité est **0 ✓ / 16**. La tranche rend cet écart **visible et explicable** (elle nomme « visuel manquant ») au lieu de le peindre par-dessus. **C'est le fond qui manquait, chiffré.**

## Preuve

- **664/664 tests**, `tsc` propre, gardes `boundary`/`state`/`docs`/`maquette` vertes.
- Les **deux règles porteuses** du contrat ont été **sabotées** pour prouver que les tests les gardent : le niveau 4 sans stock réservable fait échouer **2** tests ; l'intégrité sans visuel en fait échouer **4**.
- Le **SQL réel** du dépôt a été exécuté contre la base canonique (pas des stubs).
- **Prod === local** : `omni.sparkafrika.online` sert `index-CnHnpl0w.js`, identique au build local ; l'API live renvoie `existenceLevel` avec la **même distribution** que la mesure canonique (203 × niveau 0, 3 × niveau 2).

## Décisions qui remontent à vous

1. **L'écart assumé (0 ✓ / 16)** — la maquette montre ✓ partout, la réalité non. C'est un **acte vendeur** (ajouter des visuels), pas un bug. Confirmez-vous que c'est le bon comportement, ou faut-il ajuster la maquette ?
2. **Résidu** : la preuve navigateur **avec session réelle** (fiche offre peuplée) n'a pas été exécutée — le sandbox n'a ni DB ni auth. Elle reste pour le prochain spot-check.

## Ce qui reste

La porte **Root** reste **ouverte** : cette tranche ferme `S-06`/`S-32`. La clôture de Root demande votre verdict sur l'écart du point 1.

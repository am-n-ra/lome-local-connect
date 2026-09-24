# Omni — Species `SP-7`/`SP-8` : le monde peuplé et la revendication simple (2026-09-24)

> **Directive fondateur :** *« avec cette approche le monde sera peuplé de lieux dans Omni et il sera
> simple de claim ou de créer son entité et ses offres. »*
>
> **Constat de départ (important) :** la maquette V2 **avait déjà** l'essentiel — le style de pin
> niveau 0, la fiche de revendication avec preuve, et le choix créer/revendiquer. `SP-7`/`SP-8` n'étaient
> **pas à construire**, mais **deux écarts précis** cassaient la promesse fondateur. Corrigés.

---

## 1. Ce qui existait déjà (ne pas refaire)

| Élément | État avant |
|---|---|
| Style de pin `vdot.unclaimed` (pointillé) | ✅ présent |
| Carte de résultat niveau 0 (`Épicerie du Port`, `Niv. 0 · Non revendiquée`) | ✅ présent |
| Fiche `seller-claim` avec **preuve de contrôle + arbitrage** (S-18) | ✅ présent |
| Choix « créer mon entité » vs « revendiquer un lieu existant » | ✅ présent |
| Couche d'intel (`admin-signal` : « Ce que les gens cherchent sans trouver ») | ✅ présent |

**Conclusion : la conception était bonne. C'est l'exécution qui trahissait la promesse.**

## 2. Les deux écarts qui cassaient la promesse — et leur correction

### Écart 1 — « le monde peuplé » n'était pas peuplé

**Mesure :** la carte dessinait **3** lieux niveau 0. On ne voit pas un monde peuplé avec 3 points.

**Correction :** la carte de recherche dessine maintenant **12** lieux connus non revendiqués
(Épicerie du Port, Couture Ama, Garage Kodjo, Pharmacie Bè, Boulangerie Adawlato, Crèche Les Anges,
Atelier Menuiserie, Salon Grâce, Cabinet Dentaire, Cyber Café, Épicerie Kossi, Bureau Traductions)
+ 2 offres réelles. Hors recherche : 3 lieux + 1 offre.

**Règle posée :** *le monde est peuplé, pas un échantillon.* C'est la démonstration de la décision A —
la carte fournit les lieux en abondance, gratuitement.

### Écart 2 — un lieu niveau 0 était une impasse

**Mesure :** cliquer un lieu non revendiqué déclenchait `toast('Lieu connu — non revendiqué')` — un
**cul-de-sac**. Idem dans les résultats : `toast('Lieu connu mais non revendiqué — non interrogeable')`.
Aucun chemin vers la revendication depuis le lieu lui-même.

**C'est le défaut central contre la promesse fondateur** : « le monde = des lieux » n'a de sens que si
chaque lieu mène **quelque part**.

**Correction :** nouveau écran **`lieu-connaitre`** — la fiche d'un lieu de niveau 0 :

- **Statut** : `Niv. 0 · Non revendiquée`, **Géré par : Aucune entité**
- **Ce qu'Omni ne peut PAS dire** : `Dispo · prix · horaires` — *« Omni ne l'inventera pas »*
- **Action principale** : **« C'est mon lieu — le revendiquer »** → fiche de revendication
- **Action secondaire** : **« Créer une entité (pas ce lieu) »** → création immédiate
- **Le contraste expliqué** : `Revendiquer = preuve + arbitrage opérateur` vs `Créer = immédiat · badge « Non vérifié »`

**Règle posée :** *un lieu n'est jamais une impasse — c'est une invitation à revendiquer.*

## 3. Le chemin complet, désormais sans trou

```
pin pointillé (12 sur la carte)
   └─► fiche lieu-connaitre  « connu, pas géré · Omni ne peut rien promettre »
          ├─► « C'est mon lieu » ─► seller-claim  (preuve + arbitrage opérateur, S-18)
          └─► « Créer une entité » ─► seller-entity (immédiat, badge « Non vérifié », S-31)
                                        └─► publier une offre ─► USAGE ─► INTEL
```

**« Simple de claim ou de créer » est maintenant littéralement vrai** : les deux gestes partent du
même endroit, sur la carte, et chacun dit honnêtement ce qu'il coûte.

## 4. Honnêteté maintenue (la limite qui ne bouge pas)

Le lieu de niveau 0 affiche **explicitement ce qu'Omni ne sait pas**. Il ne promet jamais de stock, de
prix ni d'horaire. C'est la règle (1) du Seed : *« Mentir sur la disponibilité : montrer un résultat
qui promet du stock alors qu'il n'y a rien derrière »* — le danger central, évité.

Et **`S-18` n'est pas contourné** : la revendication d'un lieu **réel** exige toujours la preuve de
contrôle et l'arbitrage opérateur. Le mot « simple » ne doit **jamais** vouloir dire « sans preuve » —
l'usurpation d'un commerce réel reste le risque nommé par le Seed.

## 5. État des gardes (mesuré)

| Garde | Résultat |
|---|---|
| `npm run check:maquette` | ✅ **74 écrans**, 5 niveaux, registre honnête, 0 doublon |
| `npm run check:species-t12` | ✅ **16/16 conforme** au rendu navigateur réel |
| Registre mis à jour | ✅ 73 → **74 écrans** (le garde l'a détecté, corrigé) |

## 6. Ce qui reste avant `SP-VALIDATION`

| # | Élément | Nature |
|---|---|---|
| `SP-9` | la couche d'intel **rendue** au vendeur / acheteur / opérateur au-delà de `admin-signal` | **décision fondateur** |
| `S-08`/`S-12` | le transport comme **offre** (partiel) | travail Species |
| `S-15` | coût de routage : OSRM par défaut vs Mapbox — **« décision à acter »** | **décision fondateur** |
| `SP-VALIDATION` | valider `SP-1…SP-9` | **décision fondateur** |

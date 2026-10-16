# Species V2b — entrée & guide : maquette proposée (2026-10-15)

Fondateur : **« 3 normalement oui, guide et onboarding sont encore trop génériques et peu modernes »**
puis choix **A** (mini-maquette acceptée avant tout redessin).

## Le fait qui a commandé cette passe

**La maquette Species V2 (74 écrans, autorité acceptée) ne contient AUCUNE surface de guide,
d'accueil ou d'onboarding.** Les 74 `SHEETS` n'ont ni `welcome`, ni `how-it-works`, ni
`tutorial` ; il n'y a **aucun `spotlight`**. Les deux seules occurrences de « bienvenue »/« guide »
sont **incidentes** (titre d'une fiche facilité, phrase du plan Signal).

L'app porte pourtant **trois** surfaces sans parent accepté : `welcome` (5 étapes),
`HowItWorksBody` (3 blocs `cardbox` de listes `kv`), `MapSpotlightV13` (3 arrêts). Ce sont des
**`orphaned leaves`** — construites sans direction visuelle. D'où le ressenti « générique » : ce
n'est pas un mensonge à corriger, c'est une **spec visuelle absente**.

## Ce que la V2b propose (3 écrans)

| Écran | Direction visuelle | Ce qu'il change vs l'app |
|---|---|---|
| **1 · Welcome** | Un **héros** : kicker + titre de promesse sur deux lignes + sous-phrase. Puis **3 moments** : pastille d'icône ronde, numéro, titre, une phrase. Deux gestes clairs (chercher / vendre) + « Comment ça marche ». | remplace 5 étapes de texte par une promesse + 3 moments illustrés |
| **2 · Comment ça marche** | Le cœur (3 moments), l'**échelle 0→4** en vrai curseur **et** ses 5 mots enseignés, l'encadré **« Ce qu'Omni ne dira jamais »**, le bloc **Pro · automatique** (2 conditions / 3 abstentions), le bloc **Notifications** (Inbox, permission après action). | enseigne ce que le guide actuel ne dit **jamais** : le Pro, l'automate, son **abstention**, les notifications, la confiance |
| **3 · Spotlight carte** | 3 arrêts **numérotés sur une ligne de temps** + une légende des points (plein / pointillés / ambré). | la carte devient lisible : chaque marqueur a une signification |

**ADN strictement hérité** (aucun token inventé) : `--ink #0f0f0f`, `--panel #f7f7f7`,
`--line #e6e6e6`, `--accent #2e8b6f` ; grammaire de feuille, `cardbox`/`kv`/`eyebrow` inchangés ;
table d'icônes reprise. **Monochrome. L'accent reste réservé à la confiance** (`.status.ok`
uniquement) — l'entrée n'est pas un signal de confiance.

## Preuve (mesurée, pas jugée)

`npm run check:maquette-v2b` — garde **falsifiable, zéro dépendance** : 3 écrans présents, JS
parse, conteneur `.sheet` présent, **chaque svg dimensionné**, **les 5 mots de l'échelle (S-06)
enseignés**, l'abstention sur négociation **dite**, la fenêtre de fraîcheur **dite**, aucun tiret
cadratin, accent jamais en fond de bloc, 4 tokens hérités. **Falsifié** : retirer `class="sheet"`
→ garde **échoue**.

`node scripts/prove-species-v2b-entry-guide.mjs` — **preuve navigateur, 13/13 PASS** à 390 px :
titre de promesse, 3 moments avec icône, **icônes à 16 px** (pas 300×150), 5 segments d'échelle,
2 conditions + 3 abstentions, négociation et péremption **dites**, Inbox nommée, permission
située **après** une action, **0 bloc teinté à l'accent**, 5 mots S-06 présents, 3 arrêts
numérotés, **0 erreur console**.

Captures : `docs/nature-way/species-v2b-proof/` (3 PNG).

## Deux vrais défauts attrapés par la preuve (pas par relecture)

1. **Le conteneur n'avait pas `class="sheet"`** → le contenu se rendait **sous `.grid`**, qui
   **avalait les taps** (Playwright : « `<div class="grid">` intercepts pointer events »). Corrigé.
   *Un test ne se contente pas de trouver l'élément : il vérifie qu'on peut le toucher.*
2. **Les 5 mots de l'échelle (S-06) n'étaient pas enseignés** — le curseur ne montrait que les
   extrêmes. Le guide doit **enseigner le mot juste**, pas dessiner un concept. Corrigé (liste
   sélectionnable sous le curseur), et **verrouillé par le garde**.

Et mon propre garde a attrapé **deux authentiques défauts de ma maquette** : un tiret cadratin
(règle COPY-PASS) et l'accent utilisé en fond de bloc ×3 (interdit). Corrigés.

## Décision fondateur

**Accepter** la V2b comme extension de Species (elle devient l'autorité du rendu de l'entrée), ou
**la corriger** (dire ce qui ne va pas : direction, ton, contenu). Ensuite, l'app est alignée
dessus (`GUIDE-SPEC` → livraison), et `NR-11` (expliquer le plan) reprend le même contenu.

## Résidu honnête

- Je n'ai pas de test utilisateur réel : la V2b traduit **votre jugement** en une proposition
  **vérifiable**. Elle peut être acceptée, amendée ou rejetée — c'est la boucle maquette.
- Les captures sont à 390 px (mobile). Le desktop suit la même feuille ; une vérification aux
  largeurs desktop viendra avec l'alignement de l'app.
- Aucun code produit écrit : **maquette + garde + preuve**, comme la méthode l'exige.

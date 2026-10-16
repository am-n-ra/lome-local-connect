# Guide & onboarding — diagnostic mesuré (2026-10-15)

Fondateur : « **1 ok** (alertes) · **2 ok** (expliquer le plan) · **3** normalement oui, **guide et
onboarding sont encore trop génériques et peu modernes** ».

## Le fait structurel qui commande la suite

**La maquette Species V2 (74 écrans, autorité acceptée) ne contient AUCUNE surface de guide,
d'accueil ou d'onboarding.** Mesuré : les 74 `SHEETS` ne portent ni `welcome`, ni `how-it-works`,
ni `onboarding`, ni `tutorial` ; les deux seules occurrences de « bienvenue »/« guide » sont
**incidentes** (titre d'une fiche facilité l.897, phrase du plan Signal l.1554). Il n'y a
**aucun `spotlight`** dans la maquette.

L'app, elle, porte **trois** surfaces : `welcome` (5 étapes), `how-it-works` (menu + première fois),
`MapSpotlightV13` (3 arrêts sur la carte). **Ces surfaces sont des `orphaned leaves`** : construites
sans parent accepté — exactement le cas décrit par le garde-fou produit de Founder HQ (« a visible
surface already built while its upstream parents are missing »).

## Pourquoi elles paraissent génériques — mesuré, pas jugé

| Surface | Réalité du code | Effet ressenti |
|---|---|---|
| `HowItWorksBody` | **3 blocs `cardbox`** de listes `kv` (3 temps · échelle 0→4 · lieu non revendiqué) | un **mur de texte** : aucune icône, aucun visuel, aucune progression, rien à regarder |
| `WelcomeV13` | 5 étapes, **1 seul import lucide (`X`)** — aucun pictogramme | même densité textuelle, aucune image, pas de rythme visuel |
| `MapSpotlightV13` | 3 arrêts (**rolepill / filterrail / dock**) | correct techniquement, **générique** : il décrit l'écran, pas la promesse |

Aucun de ces écrans n'est **moche** au sens du code : ils sont **conformes au design system**
(`.cardbox`/`.kv`/`.eyebrow`) mais **n'ont jamais reçu de direction visuelle** — la maquette ne
les ayant jamais spécifiés, personne n'a défini à quoi ils doivent ressembler.

## Ce que le guide n'enseigne pas aujourd'hui (lacunes de fond)

- **Le Pro et l'auto disponibilité** : `how-it-works.ts` contient **1** occurrence de « pro/auto/
  notification » (incidente). L'utilisateur n'apprend nulle part que l'automate existe, **quand il
  s'abstient** (stock frais, jamais partiel, négociation ouverte), ni **où** on l'active.
- **Les notifications** : jamais expliquées (ni où vit l'Inbox, ni quand la permission est demandée).
- **La confiance / l'entité (S-30)** : **0** occurrence — le guide n'enseigne pas la distinction
  qui structure tout Omni (confiance = entité, réputation = offre).

## Conclusion — c'est un GATE, pas une tranche de durcissement

Branches = durcissement (corriger ce qui ment). Ici il n'y a **pas de mensonge à corriger** : il y a
une **direction visuelle absente** pour trois surfaces que la maquette n'a jamais couvertes.

Reconstruire « moderne » **sans maquette acceptée** produirait précisément la dette que la méthode
interdit : un goût d'agent à la place d'une décision fondateur, puis une reprise à zéro à la
prochaine critique. **On ne redessine pas trois écrans sur une intuition.**

## Décision fondateur demandée

**Comment veut-on spécifier l'entrée d'Omni ?**

- **A (recommandé) — mini-maquette d'entrée, sur Species.** Spécifier *Species V2b : entrée & guide*
  (accueil, guide, spotlight) comme une **extension acceptée** de Species : quelques écrans, la
  direction visuelle (icônes, illustrations, progression), le ton. Puis on aligne l'app dessus.
  Coût : une boucle maquette (courte — 3 surfaces). C'est le seul chemin qui rend « moderne »
  **vérifiable** au lieu de subjectif.
- **B — trancher au goût, maintenant.** Je redessine les 3 surfaces en dur (icônes + illustrations
  + progression), sans maquette. Rapide, mais **non opposable** : la prochaine revue rouvrira.
- **C — laisser tel quel** et ne rouvrir qu'après le terrain. Honnête, mais l'entrée reste
  le point faible de la première impression.

## Deux tranches indépendantes, déjà tranchées, à ordonner (décisions 1 & 2 « ok »)

| ID | Objet | Nature | Prérequis |
|---|---|---|---|
| `NR-10` | « alertes » acheteur : **construire** le producteur (recherche sauvegardée → événement quand une offre correspond) | **capacité neuve** (même famille que `NR-9`) | décision d'ordre fondateur |
| `NR-11` | **Expliquer le plan** : une phrase par capacité Pro vendeur, dont ce que « automatique » veut dire **et quand l'automate s'abstient** | **durcissement d'honnêteté** (une promesse doit être lisible) | aucune |

`NR-11` est le plus petit pas à valeur immédiate : il rend le plan **compréhensible** sans toucher
au visuel, et il est **falsifiable** (garde : chaque ligne Pro porte une phrase explicative).

## Résidus honnêtes

- Je n'ai pas mesuré le **ressenti** utilisateur réel (pas de test avec de vrais acheteurs/vendeurs) :
  le jugement « trop générique » est **le vôtre**, et il est cohérent avec ce que le code montre
  (texte dense, zéro visuel). Je le traite comme un **signal fondateur**, pas comme une mesure.
- Aucun code écrit dans cette passe : **mesure + diagnostic + décision**.

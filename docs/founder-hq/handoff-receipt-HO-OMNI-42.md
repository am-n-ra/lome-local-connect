# Handoff receipt — HO-OMNI-42 (Founder HQ ↔ Nature Way)

> **Objet :** `BRANCHES-DESKTOP-ONBOARDING` — bugs desktop signalés par le fondateur (clic carte
> intermittent, « demander la disponibilité » muet) + **option A de l'onboarding** (activation
> minimale après création). Porte courante **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** (Branches OPEN,
> 2026-10-07). **Livré** — preuve prod 5/5, à pousser.

## Dispatch Record (Founder HQ)

| Champ | Valeur |
|---|---|
| Objectif | Corriger les bugs desktop fondateur + livrer la tranche onboarding (option A) |
| Skill primaire | **`/nature-way`** — une fonctionnalité bornée + durcissement |
| Skill secondaire | aucun |
| Reversibilité | **réversible** — la surface `welcome` s'ajoute à l'union `Sheet` ; l'onboarding est **une seule fois, à la création** ; `pendingAction` prime toujours |
| Gate de premier niveau | Source autorité : Seed (S-31, S-28, S-16) + maquette ; le code suit le fondateur |
| Invocation | `/nature-way-founder-hq` puis `/nature-way` — activés |

## Activation Receipt

| Champ | Valeur |
|---|---|
| Entrée | « on est normalement sur trunk je crois » + rapport de bugs desktop (session relais) |
| Lecture de l'état | `docs/founder-hq/current-state.md` → porte **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** (Heartwood CLOSE 2026-10-07). **La bordure était fine : Trunk/Heartwood venaient d'être clos ; la porte courante est Branches.** |
| Portée tenue | **Branches = une fonctionnalité à la fois + durcissement.** Pas de nouvelle fondation, pas d'ouverture Canopy/Ring, terrain toujours **en dernier** |
| Gate aval | non ouvert |

## Outcome

| Item | Verdict |
|---|---|
| Clic carte intermittent | **corrigé** — `openedDuringRevealRef` (choix explicite > cinématique/filet 5,5 s), réarmé par `runSearch` |
| « Demander la disponibilité » muet | **corrigé (honnêteté)** — facilité sans produit **le dit** ; bouton inactif **guide** ; envoi **s'affiche** |
| `BuyerFlowV13` prix ÷100 | **corrigé** — `formatMoney` |
| Zoom clavier mobile | **élargi** — exclut checkbox/radio, couvre contenteditable |
| En-tête collant | **vérifié déjà correct** — aucun changement |
| Onboarding option A | **livré** — `WelcomeV13` (création seule, sans plan forcé, compteur réel) |

## Preuve (falsifiable)

| Mesure | Résultat |
|---|---|
| Suite | **1067/1067** (avant 1057) |
| tsc | 0 |
| Gardes | **9 verts** (`boundary`, `state`, `live-surface`, `dead-css`, `docs`, `coherence`, `type`, `maquette` n/a, `client-boundary`) |
| Falsification | garde anti-vol retiré → **1 échec** ; signature restaurée → 7 tests auth rouges avant alignement, 0 après |
| Prod navigateur | `npm run proof:branches-desktop-onboarding` → **5/5 PASS** |

## Décisions fondateur laissées ouvertes

- **S-16 (téléphone-first)** — la seule promesse Seed acceptée encore non construite (branche C).
- **Clic carte sur poste lent** — règle prouvée par garde de source ; preuve déterministe du
  clic *pendant* une révélation lente non capturée (révélation rapide en prod).
- **Créer un compte neuf en prod** — le chemin `signUp → WelcomeV13` est prouvé unitairement +
  présent dans le bundle servi ; l'exercice réel reste une preuve fondateur.

## Push

**Fait — `e6e49f4` poussé, déployé, vérifié.** `T-07d ✅` : prod `index-Bfc5_tJ0.js` === build local
byte-identique (SHA-256 `02c24a87…`) **et** entrée GitHub `deployments` `e6e49f4`. Preuve prod
`proof:branches-desktop-onboarding` rejouée → **5/5 PASS**.

## Correction de diagnostic (à retenir)

Le relais avait consigné un « bug prix ÷100 » dans `BuyerFlowV13`. **Mesure en base avant d'agir :
c'était FAUX** — depuis `062_one_money_family.sql` (D-LOC-9, **appliquée : `062` est au registre
`omni_schema_migrations` de la canonique**), **toute** la monnaie est stockée ×100, donc ÷100 EST la
convention (`Box déjeuner togolais.price_minor = 80000` = **800 F**).
Le code divisait correctement ; seul le **format** (`toFixed(2)`) était à remplacer par `formatMoney`.
**Un rapport de bug peut être faux : vérifier le modèle monétaire en base avant de « corriger » un
formateur.**

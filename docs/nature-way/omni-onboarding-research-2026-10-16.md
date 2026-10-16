# Onboarding — recherche web profonde 2023→2026, et ce que la V2b doit changer (2026-10-16)

Fondateur : « **je ne suis pas d'accord avec l'onboarding que tu proposes** — fais une recherche
web profonde sur comment les onboarding qui convertissent de 2023 à 2026 fonctionnent. »

Il a raison de refuser. Ma V2b proposait **un héros + trois moments + un guide** : c'est un
**écran éducatif**, pas un onboarding qui **convertit**. Voici ce que la donnée dit.

## 1. Ce que disent les benchmarks (2023→2026)

| Fait | Chiffre | Source |
|---|---|---|
| Activation J1, top décile | **~21 %** (médiane ~5 %) | Amplitude Product Benchmark |
| D7 top quartile | **~7 %** (rétention médiane D1 26 % / D7 13 % / D30 7 %) | Growth-onomics 2026 |
| Perte par écran d'onboarding | **20-35 %** (un écran à >50 % = défaut) | UXCam |
| Flux « bénéfice » courts / progressifs | **65-85 %** de complétion | UI-Deploy 2025 |
| Prompt permission à froid (ATT) | **~14 %** d'opt-in ; **+20-40 pts** si **pre-prompt après valeur** | Singular 2024 / Playwire |
| Personnalisation (2-5 micro-questions qui **changent visiblement** l'expérience) | **~+40 %** de rétention vs tour générique | The Decision Lab |
| Onboarding **dynamique** vs statique | **J7 +63 %**, **J30 +47 %** (source vendeur) | Amra & Elma |
| 1re expérience ratée | **77 %** ne reviennent jamais | Amra & Elma |

## 2. Les six principes qui tiennent (avec leur preuve)

1. **Le time-to-value d'abord : un seul geste cœur dans la première session.** Les meilleurs
   atteignent l'« aha » **dans** la session 1. Un carrousel d'explications **retarde** l'aha.
2. **Progressif, jamais un mur.** Différer compte / permission / paiement **jusqu'après** la
   valeur. Airbnb diffère l'inscription jusqu'à l'intention de réserver ; Duolingo fait
   **d'abord un exercice** (démontre la valeur), l'inscription vient **après**.
3. **La permission se demande APRÈS une action qui la rend utile** (pas au démarrage) :
   +20-40 points d'opt-in. *— c'est exactement ce que `NOTIF-1b` fait déjà côté Omni.*
4. **Personnaliser bat expliquer.** 2-5 micro-questions dont le résultat **se voit** (la carte
   se filtre, les résultats changent) valent mieux qu'un guide qui décrit l'app.
5. **Court et orienté résultat.** Remplacer les longs carrousels par **un** écran de valeur ou
   2-3 micro-étapes. Chaque écran ajouté coûte 20-35 %.
6. **Tout se teste en A/B** (timing du login, timing de la permission, coach marks) ; les
   corrélations activation↔rétention varient par catégorie.

## 3. Anti-patterns prouvés (ce que ma V2b contenait)

| Anti-pattern | Pourquoi c'est faux | Ma V2b |
|---|---|---|
| **Long carrousel / écrans explicatifs** | 20-35 % perdus **par écran** | **OUI** — 3 écrans dont un guide dense |
| **Tour générique** (« voici l'écran ») | bat par la personnalisation (~+40 % rétention) | **OUI** — spotlight qui décrit l'écran |
| **Dump de fonctionnalités** (échelle 0→4, Pro, abstentions, notifications) | l'utilisateur n'a pas encore de question à laquelle ça répond | **OUI** — le guide enseigne 5 concepts |
| **Bouton « passer » à chaque étape** | quasi-100 % de skips, activation en baisse | risque réel (mes écrans ont « fermer » partout) |
| **Coach marks mal placés** | frustration | partiel (spotlight au 1er lancement) |

**Verdict : ma proposition était un bon *contenu*, au mauvais *endroit*.** Les concepts
(échelle, Pro, abstention) sont utiles — mais **au moment où la question se pose**, pas à
l'entrée. Un onboarding qui convertit ne les enseigne pas : il fait **agir**.

## 4. Ce que l'onboarding Omni devrait faire (révisé)

Le principe, appliqué à Omni (le « aha » est **voir de la vraie supply autour de soi**) :

1. **Écran d'entrée = UNE action**, pas une explication. « **Qu'est-ce que vous cherchez ?** »
   → on lance la carte/la recherche **immédiatement**. Le premier écran est la **carte**, pas une
   feuille de bienvenue.
2. **Personnaliser en 1 tap** : le choix **Acheteur / Vendeur** change réellement l'app (il le
   fait déjà) → c'est le seul « micro-question » utile. Rien d'autre à l'entrée.
3. **La valeur d'abord, l'explication ensuite** : chaque concept s'enseigne **là où il sert** —
   l'échelle 0→4 **sur une fiche lieu** (au moment de la question), le Pro **au moment de
   vouloir automatiser**, les notifications **après la première action utile** (déjà fait).
4. **Aucun mur** : pas de compte, pas de permission, pas de carrousel avant d'avoir vu la carte.
   Le compte vient quand l'utilisateur veut **transiger** (D-05 : chercher exige un compte —
   mais **regarder la carte n'exige rien**).
5. **Le guide devient un secours**, pas une porte : atteignable par le menu, **jamais imposé**.
6. **A/B à prévoir** : au minimum, mesurer si l'entrée « carte directe » bat « écran de
   bienvenue » sur la première recherche lancée.

**Conséquence honnête** : cela **supprime** l'essentiel de la V2b. Ce qui survit :
l'**échelle 0→4 sur la fiche** (elle répond à une vraie question), le **bloc Pro** déplacé au
moment de l'automatisation, et le **spotlight** réduit à un seul arrêt (le dock), au premier
lancement, avec un « passer » discret.

## 5. Ce que je propose maintenant

- **V2c — entrée « carte directe »** : 0 écran d'explication ; le premier écran **est** la carte ;
  le rôle (Acheteur/Vendeur) se choisit dans le rolepill existant ; le guide vit dans le menu.
- **Déplacer le contenu, ne pas le jeter** : échelle → fiche lieu ; Pro + abstention → écran
  d'activation de l'automatisation ; notifications → après action (déjà livré).
- **Mesurer** : instrumenter « première recherche lancée » et « première intention » comme
  métriques d'activation, puis comparer à la version à écran de bienvenue.

**Décision fondateur** : valider la direction « carte directe, explication au moment de l'usage »
(et j'en fais la V2c), ou préciser ce qui doit rester à l'entrée.

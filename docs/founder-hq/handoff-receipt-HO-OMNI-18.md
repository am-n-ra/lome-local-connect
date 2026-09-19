# Handoff HO-OMNI-18 — Dispatch itinéraire + deux bugs console corrigés (2026-09-17)

## Dispatch Record

| Champ | Valeur |
|---|---|
| Objectif fondateur | « notre façon de faire les itinéraires doit être aussi parfaite que ce que Google Maps propose et tout » |
| Primary skill | **`/nature-way`** — livraison produit et diagnostic de phase |
| Raison | La demande touche une capacité produit (géométrie d'itinéraire), pas le capital, la distribution ou la personne |
| Secondary handoff | aucune — une seule spécialité active à la fois |
| Gate concerné | **Root System** — choix de la source de vérité géométrique et du fournisseur |
| Premier gate requis | décision fondateur D-ROUTE-1…5 (voir contrat) |

## Activation Receipt

| Champ | Valeur |
|---|---|
| Invocation exacte | `/nature-way` |
| Statut d'activation | **`user invocation required`** |
| Motif d'honnêteté | Les skills `nature-way` / `nature-way-founder-hq` vivent dans `.agents/skills/` du dépôt et ne sont **pas** enregistrées dans l'environnement d'exécution : l'appel programmatique renvoie `Unknown skill`. La méthode a donc été **appliquée depuis les fichiers chargés** (protocole, gates, Resource Receipt respectés), mais l'invocation dynamique par l'outil n'a pas eu lieu et n'est **pas** revendiquée. |
| Ressources chargées | `nature-way/SKILL.md`, `nature-way-founder-hq/SKILL.md`, `references/intra-skill-execution-controller.md`, `references/prerequisite-architecture.md` |
| Artefact retourné | `docs/nature-way/omni-route-directions-contract-2026-09-17.md` |
| Prochaine action | fondateur tranche D-ROUTE-1…5 |

## État au handoff
- HEAD `5a31ebc` poussé sur `omni-v2-rebuild`.
- Prod sert `index-DUw7RWKU.js` === dist local (**sha256 `f3727dce…` identique**).
- Working tree propre. **61 files / 523 tests**, `tsc --noEmit` exit 0.

## Ce qui a été corrigé dans ce passage

### 1. Deux erreurs console réelles, signalées par le fondateur — corrigées à la racine (`5a31ebc`)

**a. `Uncaught Cannot stop, scanner is not running or paused.`**
- **Cause racine** : `html5-qrcode` signale « pas en cours de scan » en levant une **chaîne** (`throw \`Cannot stop…\``), et ce **de façon synchrone** — pas une promesse rejetée. La chaîne `scanner.stop().then(...).catch(...)` de `SellerQrScannerSheet.tsx` ne pouvait donc **pas** l'intercepter : démonter l'écran avant que `start()` ne se résolve, ou un onglet masqué pendant le démarrage, s'échappait en **erreur non capturée**.
- **`clear()` lève de la même façon** (« Cannot clear while scan is ongoing ») — les deux appels sont désormais gardés indépendamment.
- Extraction en `teardownScanner` (export) pour rendre la logique testable.

**b. `/api/v2/buyer/pro-status` → 409**
- **Cause racine** : `getBuyerProStatus` levait `BuyerSearchPolicyError('ACCOUNT_UNAVAILABLE')` quand l'identité authentifiée n'avait **pas encore** de ligne compte. La couche HTTP mappait cette classe en **409 POLICY_REJECTED** — un code de violation de politique pour ce qui est en réalité une **précondition de provisionnement**.
- **Incohérence de contrat** : la lecture sœur `/api/v2/account/context` répond **403 ACCOUNT_UNAVAILABLE** pour exactement la même condition. Deux endpoints, même cause, deux codes.
- **Correctif** : le dépôt renvoie `null`, la couche HTTP répond **403 ACCOUNT_UNAVAILABLE** sur `pro-status` **et** `pro/renewal-status`, aligné sur le précédent.

### 2. Preuve des correctifs
- **+5 tests de régression** (518 → **523**).
- **Les deux nouveaux tests ont été vérifiés comme échouant contre le code d'origine** avant correction (`Cannot stop…` levé ; `ACCOUNT_UNAVAILABLE` levé au lieu de `null`). Un test qui ne peut pas échouer n'est pas une preuve.
- Garde-fou défensif **confirmé présent dans le bundle de production** après déploiement.

## Diagnostic itinéraire — résumé non technique

**L'itinéraire actuel n'est pas un itinéraire : c'est une ligne droite.** Géométrie à 2 points, distance en vol d'oiseau (haversine), aucun moteur de routage dans le projet. À décharge du travail existant : l'UI **l'annonce** (`(tracé direct)`) et passe en état honnête « Position indisponible… » sans géolocalisation. Il n'y a pas de mensonge à corriger, il y a une **source de vérité géométrique à remplacer**.

**Écart mesuré, sur le vrai réseau routier de Lomé :** Marché d'Adawlato → nord de Lomé = **4,91 km** en ligne droite contre **6,19 km** en route réelle, soit **+26 %**. La valeur actuelle **sous-estime systématiquement** la distance, et donc toute estimation de temps ou de coût.

**Le réseau OpenStreetMap couvre bien Lomé** : la route réelle remonte des rues nommées (Rue de L'Avenir, Rue Khra, Rue Kamé, Rue Slt Gnémégnah, Avenue Maman N'Danida, Boulevard de la Paix) avec turn-by-turn exploitable en français. La couverture n'est donc pas le problème.

**Le nœud réel est le fournisseur.** Le serveur de démonstration OSRM **interdit** l'usage en production et classe ce volume en « usage très lourd ». Il faut soit un fournisseur hébergé avec clé et proxy serveur, soit un OSRM auto-hébergé pour le Togo. Dans les deux cas la clé ne doit **jamais** partir dans le bundle client, et un cache serveur est nécessaire.

**Contradiction de spec bloquante :** la maquette Species (S11/S22/S23/S25/S33) dit itinéraire **verrouillé jusqu'à l'intention** ; la correction fondateur du 2026-09-14 dit itinéraire **ouvert sur chaque fiche**, sans intention. Le code suit le fondateur. **La maquette n'a jamais été réconciliée** — un futur contributeur pourrait « corriger » le code à l'envers.

**Périmètre honnête :** « aussi parfait que Google Maps » n'est pas atteignable avec de l'open data — trafic temps réel, reroutage dynamique et qualité de géocodage ne sont pas au rendez-vous. Cible recommandée : **« itinéraire routier fiable et honnête à Lomé »**, avec les limites assumées par écrit.

**Point ouvert qui ne dépend d'aucun fournisseur — vérifié en base :** seulement **2,9 % des facilités (6/206)** ont une adresse renseignée. Même le meilleur moteur de routage produit un mauvais itinéraire sur un point mal géocodé. C'est un travail de **données Omni**.

## Ce qui n'est PAS prouvé
- Aucune ligne de code d'itinéraire n'a été écrite — le gate est un **choix de fournisseur et de périmètre**.
- Aucune mesure de latence ni de coût réel du fournisseur retenu.
- Aucun test du réseau routier de Lomé **via le code Omni** (uniquement par requête directe).
- Le fallback DOM ne sait pas afficher un tracé (`addSource`/`addLayer` = no-op, `fallback-map-surface.ts:227`).

## Suites immédiates
1. **Trancher D-ROUTE-1…5** — fournisseur, repli, règle d'accès, périmètre. C'est le seul vrai bloqueur.
2. **Réconcilier la maquette** S11/S22/S23/S25/S33 avec la règle fondateur (D-ROUTE-3).
3. **Traiter la couverture d'adresse** (2,9 %) — indépendant du fournisseur.
4. Vérifier la coordonnée `lng −1,00` : elle sort de la zone Lomé (supply lat 5,92–6,43 / lng −1,00–2,39).
# Handoff receipt — HO-OMNI-44 (Founder HQ ↔ Nature Way)

> **Objet :** clôture de deux tranches (`IOS-PWA-1` par l'appareil réel, `P4` par preuve E2E) et
> **choix de la prochaine branche**. Porte courante **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** (Branches OPEN).
> **Autorité :** `/nature-way`. **Terrain (`TT-1`/`TT-2`/Gate 7) reste EN DERNIER** (décision 2026-10-07).

## Dispatch Record (Founder HQ)

| Champ | Valeur |
|---|---|
| Objectif | Enregistrer 2 clôtures prouvées, puis router la prochaine tranche Branches |
| Skill primaire | **`/nature-way`** — durcissement Branches, une fonctionnalité à la fois |
| Skill secondaire | aucun |
| Reversibilité | **réversible** — documentation de clôture + sélection de branche ; aucun code produit modifié |
| Gate de premier niveau | Source autorité : Seed (`S-16`, `S-19`, `S-26`, `S-31`) + porte `HEARTWOOD_CLOSED_BRANCHES_OPEN` |
| Invocation | `/nature-way-founder-hq` activé → `/nature-way` pour l'exécution |

## Activation Receipt

| Champ | Valeur |
|---|---|
| Entrée | fondateur « iphone pwa passe maintenant / what next? » |
| Lecture de l'état | `docs/founder-hq/current-state.md` → porte **`HEARTWOOD_CLOSED_BRANCHES_OPEN`** ; plan local `NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01` |
| Portée tenue | **Branches = durcissement/fermeture, pas de fondation neuve** (sauf capacité explicitement autorisée par le fondateur, ex. `NR-9`/`NR-10`) |

## Résultat (evidence)

| Item | Statut | Preuve |
|---|---|---|
| **`IOS-PWA-1`** | **CLOS** | Décision **B** (proxy same-origin `/api/v2/auth/*`, cookie first-party) : preuve serveur (prod `bc87f41`, `Set-Cookie … SameSite=Lax`, sans `Domain`/`Partitioned`) **ET confirmation fondateur sur iPhone PWA standalone** (« iphone pwa passe maintenant ») — le seul juge qui manquait. |
| **`P4` (gel prix)** | **CLOS** | Câblage déjà livré (`c455f76` + migration `074` appliquée + `075`), mais **jamais prouvé** — c'était le manque réel. `npm run proof:price-freeze` **9/9** sur branche jetable (code livré) : l'intention fige origine+remise+prix dû ; changer prix/remise **après** l'intention ne change rien (S-26) ; snapshot append-only. **Falsifié** (remise→0 → 6 échecs) + garde `price-freeze.test.ts` (falsifié). Prod `16aeb02`. |
| Suite | **1330/1330**, tsc 0 | 6 gardes verts (boundary · live-surface · dead-css · docs · state · coherence) |

## Ce qui reste OUVERT (mesuré, pas supposé)

| ID | Nature | Rattachement | Statut mesuré |
|---|---|---|---|
| `GR-1` | Spotlight étape dock coupée (4/128 px visibles) | guide | **corrigé** (`placeSpotlightCard` + garde `spotlight-placement.test.ts`) — ligne de plan **périmée** |
| `NR-10` | « Alertes » acheteur : recherche sauvegardée → événement | Seed (promesse du plan) | `ready` — `v2_saved_searches` existe, **aucun producteur d'événement** (0 occurrence) |
| `NR-11` | Expliquer le plan Pro vendeur (chaque capacité + quand l'automate s'abstient) | Seed (honnêteté) | `ready` — **non présent** dans le code |
| `GR-2` | Reprise PWA élargie (guide + flow en cours) | S-26 | `planned` — `nav-state` persiste rôle/sheet/lieu, **pas** le guide ni le flow |
| `GR-3` | Accueil montré **une seule fois** par compte | S-31 | `planned` — pas de drapeau « welcome déjà vu » (seul le spotlight carte a le sien) |
| `NT-1` | Documenter la manifestation d'une notification | S-16 | `planned` — réponse connue (son OS, contenu FR, tap→Inbox), à écrire |
| `GUIDE-SPEC` | Direction visuelle de l'entrée/guide | Species | **`blocked`** — la maquette (74 écrans) n'a **aucune** surface de guide → 3 `orphaned leaves` ; **décision A/B/C requise** |
| `COH-V2-09` | `omni_schema_migrations` en retard sur le schéma | dette faible | `watch` |
| `SCOUT-01` | Couverture de base mondiale des lieux | S-05, `DEC-V2-30` | candidat Trunk, non démarré |
| `MENU-01` | Destinations menu vendeur (7–8 écrans maquette) | maquette | candidat, non démarré |
| Escalade des verrous avancés | Surface opérateur (transaction bloquée) | TXN | hors périmètre Branches, non ouverte |

## Return handoff to Founder HQ

- **HQ plan ID :** `HQ-OMNI-2026-09-02` · **Local plan ID :** `NW-PROD-OMNI-GUIDE-RESUME-NOTIF-01`
- **Active gate :** Branches (`HEARTWOOD_CLOSED_BRANCHES_OPEN`)
- **Closed :** `IOS-PWA-1`, `P4`
- **Open/ready :** `NR-10`, `NR-11` · **planned :** `GR-2`, `GR-3`, `NT-1` · **blocked :** `GUIDE-SPEC`
- **Residual gap :** `GUIDE-SPEC` bloque l'entrée/guide (aucune direction visuelle dans la maquette) ;
  `NR-10` est une **capacité neuve autorisée** mais non construite ; `GR-1` est corrigé (ligne à rafraîchir)
- **Owner :** Nature Way (agent) — **prochaine branche = décision fondateur**
- **Next smallest action (recommandée) :** **`NR-11`** — expliquer le plan Pro vendeur. Le plus petit
  pas à valeur immédiate : **aucun visuel, aucune migration, aucun risque** ; pure honnêteté de copie.
  Puis **`NR-10`** (alertes) sur ordre explicite (capacité neuve).
- **Re-plan trigger :** le fondateur tranche A/B/C sur `GUIDE-SPEC`, ordonne `NR-10`/`NR-11`, ou
  sélectionne une autre branche (`SCOUT-01`, `MENU-01`).

## Resource Receipt

| Ressource | État |
|---|---|
| `references/ecosystem-activation-manifest.md` | **Loaded** |
| `references/intra-skill-execution-controller.md` | **Loaded** |
| `references/founder-hq-board.md` | **Loaded** |
| `docs/founder-hq/current-state.md` | **Loaded** (lu avant toute affirmation de porte) |
| `templates/skill-handoff-receipt.md` | **instancié** (ce fichier) |
| `references/portability-protocol.md` | **Not loaded** — aucun export/transfert |
| `references/ecosystem-orchestration-protocol.md` | **Not loaded** — pas de nouveau venture |

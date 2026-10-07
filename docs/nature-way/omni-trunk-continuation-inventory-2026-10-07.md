# Inventaire de continuation Trunk — « la suite depuis la clarification du 29 »

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** `/nature-way`.
> **As of :** 2026-10-07 (UTC). **HEAD :** `ba76a78`.
> **Objet :** répondre au fondateur — « on doit faire la suite de Trunk ? il y a des choses
> à corriger / ajouter / améliorer / enlever ? » — par une **mesure**, pas une liste d'envies.
> **Méthode :** lecture Seed V2 + SDM + registres + **code réel** (grep + lecture des requêtes).
>
> **⚠️ RÉCONCILIÉ 2026-10-07 (plus tard le même jour).** L'inventaire avait **une heure de retard** :
> `TRUNK-X1` et `TRUNK-X2` étaient décrits **à faire**, mais leur code était **déjà livré ce jour-là
> dans `3d19a50`** (migration `067` + `068`, preuves jetables, prod). Vérifié : `git merge-base
> --is-ancestor 3d19a50 HEAD` → **YES** ; `067_v2_transaction_expired_state.sql` et
> `068_v2_auto_availability.sql` existent ; `sweepExpiredIntents` émet `expired` ; `listOpenTransactions`
> exclut les zombies. **C'est la même classe de staleness que la board et le `R-B` du 2026-09-26.**
> Les sections 1 et 3 ci-dessous sont corrigées ci-dessous.

## 0. Réponse courte (RÉCONCILIÉE 2026-10-07)

**Trunk est livrée** : `X1` (expiration honnête), `X2` (automatisation vendeur), `X3` (Room),
`X4` (desktop/PWA), `X5` (onboarding honnête) **+** la série `DS-1…DS-14` et `UI-1…UI-10`.
**Toutes vérifiées en prod** (T-07d). Le reste de l'inventaire « à faire » était **périmé** :
voir §1 et §3, corrigés. Il ne reste : (a) la **réconciliation de mémoire** (cet inventaire),
(b) **une décision fondateur** (`SCOUT-01`), (c) le **terrain** (= dernier, hors Trunk).

## 1. `TRUNK-X1` — LIVRÉ (corrigé 2026-10-07)

### `TRUNK-X1` — l'expiration d'une intention est un état canonique honnête ✅
- **Livré** (`3d19a50`, le même jour que cet inventaire) : migration
  **`067_v2_transaction_expired_state.sql`**, `sweepExpiredIntents` écrit l'événement `expired`
  (+ audit `intent_expired`) et `listOpenTransactions` exclut les zombies via
  `pi.state = 'expired'`. Preuve jetable `scripts/prove-v2-intent-expiry.mjs` **7/7**, falsifiée
  (4 FAIL). Statut plan : `TRUNK-X1` `verified`.
- **Ce que l'inventaire décrivait comme « prochaine action » est fait.**


## 2. Enlever / réconcilier — la **mémoire est en retard** (registres périmés)

Le registre de cohérence `omni-v2-coherence-and-debt-2026-09-23.md` porte encore des lignes
**`open` qui sont déjà fermées en code** — vérifié :

| Ligne registre | Dit | Réel mesuré | Disposition réelle |
|---|---|---|---|
| `COH-V2-03` | offre→facility vs entité, `open` | migration `058` : `entity_id` ajouté, `facility_id` **nullable** (« où, pas à qui »), backfill fait | **FERMÉ** |
| `COH-V2-04` | avantage Omni obligatoire, `open` | `publication_block` → `ADVANTAGE_REQUIRED` | **FERMÉ (RH-01/02)** |
| `COH-V2-05` | visuel obligatoire, `open` | `publication_block` → `MEDIA_REQUIRED` | **FERMÉ (RH-01)** |
| `COH-V2-01` | `design.md` pointe l'ancienne maquette, `open` | `design.md` pointe **V2** (« l'ancienne reste l'historique ») | **FERMÉ** |
| `COH-V2-18` | audit auto-référent, `ouvert` | `check:species-t12` corrigé → 27/27, `NON MESURÉ=0` | **FERMÉ** |

→ **Cause = celle déjà nommée** : un document de diagnostic est **périmé dès qu'un commit
passe**. Le remède n'est pas un nouveau plan : c'est que l'état de référence **inclue** la série
Trunk et que le registre soit re-classé. (Le garde `check:coherence` couvre le registre
Seed↔code ; il **ne couvre pas** `COH-V2-*`.)

## 3. Ajouter — capacités maquette sans écran (déjà cadrées)

| ID | Manque | État |
|---|---|---|
| `seller-automation` | bascule « disponibilité auto » (Pro) | **LIVRÉ 2026-10-07** (`TRUNK-X2`, `3d19a50`) : migration `068` (`v2_products.auto_availability` + `v2_reconcile_auto_availability()`), repo + HTTP + client + carte `SellerV13` ; `bientôt` manuel jamais écrasé, `verifie` jamais écrit par l'auto ; preuve jetable 9/9 falsifiée |
| `room` | chat transactionnel buyer↔seller | **LIVRÉ 2026-10-07** (`TRUNK-X3`, `bda68e0`) : `TransactionRoom` acheteur **+** surface vendeur ; fil complet, transitions acteur, reçu dérivé ; chemin neutre `/api/v2/transactions` ; preuve jetable 5/5 falsifiée |
| Destinations menu vendeur (`MENU-01`) | 7–8 entrées maquette | **acté** : ne pas afficher = pas de boutons morts |

## 4. Terrain — dépend de vous, pas du code

- **TT-1/TT-2** (usage réel, vendeurs Lomé observés, donnée terrain) : owner **fondateur**,
  hors sandbox.
- **Gate 7 Venture Lifecycle** (preuve de demande : 65 000 F / 13 Pro sellers + CAC mesuré) :
  `watch`, `/nature-way-venture-lifecycle`.

## 5. Ce qui est **fait mais pas dans le SDM/registres**

- **`SCOUT-01`** (couverture mondiale) : **en cours de résolution** par `POP-1c` (vagues
  Afrique, MCP session) — pas un blocage.
- La série `DS-1…DS-14` (conformité dock/recherche/menus) : livrée + prod, **absente du SDM**.

## 6. Slice recommandée (RÉCONCILIÉE 2026-10-07)

**Aucune slice de code Trunk ne reste.** `TRUNK-X1`…`X5`, `DS-1…DS-14`, `UI-1…UI-10` sont
**tous livrés + prod-vérifiés**. La tranche restante est **de la mémoire** : re-classer cet
inventaire (fait, ce document) et **décider la suite de porte** (Heartwood/Branches/Canopy/Ring
vs terrain). Le seul item « à décider » est `SCOUT-01` (voir §7).

- **Non-goals :** terrain (dernier, hors Trunk).

## 7. Décisions posées au fondateur

1. ~~Valider la direction : Trunk = suite ; je pars sur `TRUNK-X1` ?~~ **FAIT** — `X1` livré (`3d19a50`), puis `X2`/`X3`/`X4`/`X5`.
2. ~~**`seller-automation`** : construire ou acter l'absence ?~~ **LIVRÉ** — `TRUNK-X2` (`3d19a50`).
3. **`room`** : ~~tranche dédiée maintenant, ou `deferred` jusqu'au terrain ?~~ **RÉPONDU + EXÉCUTÉ** — fondateur « ok room » (option A, périmètre complet) → `TRUNK-X3` livré + prod (`bda68e0`).
4. **Réconciliation mémoire :** j'ajoute la série `DS-1…DS-14` au SDM + je re-classe `COH-V2`
   (corrige les 5 lignes périmées + il reste `COH-V2-02`/`-06`/`-07`/`-08`/`-09` à statuer) ?

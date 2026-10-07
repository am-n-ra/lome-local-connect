# Inventaire de continuation Trunk — « la suite depuis la clarification du 29 »

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** `/nature-way`.
> **As of :** 2026-10-07 (UTC). **HEAD :** `029e1fe`.
> **Objet :** répondre au fondateur — « on doit faire la suite de Trunk ? il y a des choses
> à corriger / ajouter / améliorer / enlever ? » — par une **mesure**, pas une liste d'envies.
> **Méthode :** lecture Seed V2 + SDM + registres + **code réel** (grep + lecture des requêtes).

## 0. Réponse courte

**Oui** — Trunk est la bonne continuation, et **oui il reste des choses**. Ce ne sont **pas**
des envies : ce sont des **écarts mesurés** entre (a) l'Omni clarifié (Seed V2 + Species V2) et
(b) ce que le code fait réellement. La série `DS-1…DS-14` a **fermé la couche fidélité**
(dock, recherche, menus, tri, fraîcheur). Ce qui reste se classe en **quatre familles**, dont
**une seule tranche de code est vraiment prête** ; le reste est soit **déjà fait mais non
consigné** (mémoire en retard), soit **bloqué sur une décision**, soit **dépendant du terrain**.

## 1. Corriger — un défaut réel, mesuré (le plus fort)

### `TRUNK-X1` — une intention d'achat **expirée** devient une transaction « en cours » zombie
- **Mesure :** `sweepExpiredIntents` (`trunk-repository.ts:7168`) libère le stock et marque la
  **demande** `expired`, mais **n'écrit aucun événement de transaction** (`v2_transaction_events`).
  Or `listOpenTransactions` (`:6992`) lit l'état **uniquement depuis les événements**, et filtre
  `current_state <> 'closed'`. Une intention qui n'a **jamais été scannée** n'a **aucun**
  événement → son état retombe sur le défaut `'intent_created'` → elle reste **affichée
  « en cours » pour toujours** dans l'espace acheteur.
- **Impact :** le bouton « reprendre » ramène l'acheteur dans un flux **déjà mort** ; la vérité
  (expirée) n'est visible que sur la **demande**, pas sur la transaction.
- **Classe :** c'est exactement la famille de bugs E2E déjà consignée (D-TXN-11, « ne jamais
  départager/figer un état sur une source qui ne le porte pas »). `SCOUT-02` (Haute) pointe
  la même impasse, **partiellement** traitée côté *demande*.
- **Prochaine action :** 1 h pour **confirmer en base** (branche jetable : intention → sweep →
  `listOpenTransactions`) puis corriger (`intent_expired` émis comme événement, ou
  `listOpenTransactions` joint `pi.state`).

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
| `seller-automation` | bascule « disponibilité auto » (Pro) | **sans modèle de données** → **décision fondateur** (règle H1) |
| `room` | chat transactionnel buyer↔seller | serveur existe (`v2_transaction_messages`), surface acheteur absente → tranche dédiée |
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

## 6. Slice recommandée (une seule)

**`TRUNK-X1` — « une intention expirée ne ment pas sur son état »** (Heartwood/correctif).
- **Rattachement :** Seed V2 « VIVANT » (« qui l'a **maintenant** ? ») + `SCOUT-02` + famille
  D-TXN-11. **H1 satisfait.**
- **Fini :** intention expirée → hors « Transactions en cours », état « expirée » honnête,
  stock libéré (déjà), 0 zombie ; test falsifié ; preuve SQL réelle.
- **Non-goals :** `SCOUT-01` (POP), `room`, `seller-automation` (décision), terrain.

## 7. Décisions posées au fondateur

1. **Valider la direction :** Trunk = suite ; je pars sur `TRUNK-X1` ? (recommandé)
2. **`seller-automation`** : on construit (il faut un modèle — auto-dispo par stock alloué) ou
   on acte l'absence (comme `DS-4`) ?
3. **`room`** : tranche dédiée maintenant, ou `deferred` jusqu'au terrain ?
4. **Réconciliation mémoire :** j'ajoute la série `DS-1…DS-14` au SDM + je re-classe `COH-V2`
   (corrige les 5 lignes périmées + il reste `COH-V2-02`/`-06`/`-07`/`-08`/`-09` à statuer) ?

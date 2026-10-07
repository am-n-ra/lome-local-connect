# TRUNK-X1 — l'expiration d'une intention est un ÉTAT, pas un zombie

> **Porte :** Trunk OPEN (`ROOT_CLOSED_TRUNK_OPEN`). **Autorité :** `/nature-way`.
> **Plan local :** `NW-PROD-OMNI-TRUNK-02`. **As of :** 2026-10-07.
> **Décision fondateur :** « 1 ok » (parmi les 4 de l'inventaire de continuation).

## Le défaut (mesuré, pas supposé)

`sweepExpiredIntents` (`src/server/trunk-repository.ts`) libérait le stock et passait la
**demande** à `expired`, mais **n'écrivait aucun événement** de transaction. Or « l'état
courant » d'une transaction = le dernier événement de `v2_transaction_events` (D-TXN-11).
Une intention **jamais scannée** n'ayant **aucun** événement, son état retombait sur le défaut
`'intent_created'` → elle restait affichée **« en cours » pour toujours** et le bouton
« reprendre » ramenait l'acheteur dans un flux **déjà mort**. Même famille que `SCOUT-02`
et D-TXN-11 : *un état figé/lu sur une source qui ne le porte pas*.

## Le correctif

1. **`expired` devient un état canonique de la timeline** (migration **`067`** : CHECK de
   `state` étendu ; **pas** de `state_rank` — ce n'est pas une étape d'avancement).
2. **Le sweep écrit l'événement `expired`** (`event_expired`, ancré sur `intent_expired`
   → idempotent exactement comme la libération de stock FF-8).
3. **`listOpenTransactions`** joint `v2_purchase_intents.state` et **exclut** l'expiration
   **avant verrou** (couvre les zombies déjà écrits, sans événement). Le verrou (`qr_verified`)
   garantit qu'une transaction engagée n'a **jamais** `pi.state='expired'` → rien d'engagé
   n'est caché.
4. **`getTransaction`** renvoie `expired` (l'expiration avant verrou prime sur le défaut).
5. **UI** (`BuyerFlowV13`) : une carte **terminale honnête** — « Expirée · rien n'a été débité ·
   réservation libérée » + « Nouvelle demande », sans le panneau « transaction verrouillée »
   (qui aurait menti). `transaction-time` : libellé « Expirée », responsable = système.

## Preuve (falsifiée)

- **SQL réel** sur branche jetable (depuis la canonique, migration `067` appliquée) via
  `scripts/prove-v2-intent-expiry.mjs` pilotant le **code livré** (`createTrunkRepository`) :
  **7/7 PASS** — intention vivante visible → sweep → **disparaît de la liste** →
  `getTransaction` = `expired` → **événement canonique présent** → stock libéré, stock déclaré
  intact → replay no-op.
- **Falsification** : correctif retiré (`git stash`) → **4 FAIL** (T3 zombie, T4
  `intent_created`/`qr_ready`, T5 0 événement, T7). Restauré → 7/7. **Le test ne peut pas
  échouer sans le bug.**
- **Suite** : **836/836** (+1 unité `transaction-time`), `tsc` 0, 7 gardes verts.

## Migration

`067_v2_transaction_expired_state.sql` — additive + idempotente (**rejouée** sur la jetable : OK).
**Appliquée à la canonique `br-dawn-hill-am5amy22`** (constraint vérifiée : `... , 'closed', 'expired'`)
+ registre `omni_schema_migrations` (checksum du fichier). Aucune ligne réécrite.

## Résidu honnête

- Les **zombies pré-existants** sont traités par la **lecture** (exclusion `pi.state='expired'`) ;
  ils n'auront un **événement** `expired` que s'ils sont balayés à nouveau (le sweep ne re-visite
  pas les intentions déjà `expired`). Visible dans la liste = **honnête** dès maintenant.
- Preuve navigateur avec **session acheteur réelle** non exécutée (sandbox) — la carte terminale
  est prouvée par le type + la logique serveur réelle.
